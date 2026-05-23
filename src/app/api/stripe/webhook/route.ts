import { NextRequest, NextResponse } from 'next/server';
import type Stripe from 'stripe';
import { Resend } from 'resend';
import { eq } from 'drizzle-orm';
import * as Sentry from '@sentry/nextjs';
import { getStripe } from '@/lib/stripe';
import { getDb } from '@/lib/db';
import { subscriptions } from '@/lib/db/schema';
import { priceIdToPlan, PLANS } from '@/lib/plans';
import { createNotification } from '@/lib/db/notifications';
import { tryIssueReferralCredit } from '@/lib/stripe/referral-credit';
import { upsertCancellation, markCancellationRestored } from '@/lib/db/cancellations';

// Webhook needs the Node.js runtime so we can read the raw request body
// for signature verification. Edge runtime parses bodies eagerly.
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

const RELEVANT_EVENTS = new Set<Stripe.Event['type']>([
  'checkout.session.completed',
  'customer.subscription.created',
  'customer.subscription.updated',
  'customer.subscription.deleted',
  'invoice.paid',
  'invoice.payment_failed',
]);

export async function POST(req: NextRequest) {
  const signature = req.headers.get('stripe-signature');
  if (!signature) {
    return new NextResponse('Missing Stripe-Signature header', { status: 400 });
  }
  if (!process.env.STRIPE_WEBHOOK_SECRET) {
    return new NextResponse('STRIPE_WEBHOOK_SECRET is not set', { status: 500 });
  }

  // Important: req.text() gives us the *raw* body, which is what
  // constructEvent needs to verify the signature.
  const rawBody = await req.text();

  let event: Stripe.Event;
  try {
    event = getStripe().webhooks.constructEvent(
      rawBody,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    console.error('Webhook signature verification failed:', msg);
    Sentry.captureException(err, { tags: { area: 'stripe.webhook', phase: 'verify' } });
    return new NextResponse(`Webhook Error: ${msg}`, { status: 400 });
  }

  if (!RELEVANT_EVENTS.has(event.type)) {
    // Acknowledge so Stripe doesn't keep retrying. We just don't act on it.
    return NextResponse.json({ received: true, ignored: true });
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        if (session.mode === 'subscription' && session.subscription) {
          const subId =
            typeof session.subscription === 'string'
              ? session.subscription
              : session.subscription.id;
          await syncSubscription(subId);
        }
        break;
      }

      case 'customer.subscription.created':
      case 'customer.subscription.updated':
      case 'customer.subscription.deleted': {
        const sub = event.data.object as Stripe.Subscription;
        await syncSubscription(sub.id);
        break;
      }

      case 'invoice.paid': {
        const invoice = event.data.object as Stripe.Invoice;
        const subId = extractSubscriptionId(invoice);
        if (subId) await syncSubscription(subId);
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice;
        const subId = extractSubscriptionId(invoice);
        if (subId) await syncSubscription(subId);
        await sendPaymentFailedEmail(invoice);
        break;
      }
    }
  } catch (err) {
    console.error(`Webhook handler error (${event.type}):`, err);
    Sentry.captureException(err, {
      tags: { area: 'stripe.webhook', phase: 'handle', event_type: event.type },
    });
    // Return 500 so Stripe retries. Webhook handlers must be idempotent —
    // syncSubscription is, since it overwrites with canonical state.
    return new NextResponse('Webhook handler failed', { status: 500 });
  }

  return NextResponse.json({ received: true });
}

/**
 * Pull canonical subscription state from Stripe and overwrite our DB row.
 * Stripe is the source of truth — never trust diffs from event payloads.
 */
async function syncSubscription(subscriptionId: string) {
  const rawSub = await getStripe().subscriptions.retrieve(subscriptionId, {
    expand: ['items.data.price'],
  });

  // Cast to access fields that exist at runtime but whose types differ across
  // Stripe API versions (current_period_end, cancel_at_period_end).
  const sub = rawSub as unknown as Stripe.Subscription & {
    current_period_end?: number | null;
    cancel_at_period_end?: boolean;
    items: { data: Array<{ price: Stripe.Price }> };
  };

  const customerId = typeof sub.customer === 'string' ? sub.customer : (sub.customer as Stripe.Customer).id;

  // Separate the base plan price from add-on prices.
  let planPriceId: string | null = null;
  const addOnPriceIds: string[] = [];
  for (const item of sub.items.data) {
    const priceId = item.price.id;
    if (priceIdToPlan(priceId)) {
      planPriceId = priceId;
    } else {
      addOnPriceIds.push(priceId);
    }
  }

  const planInfo = planPriceId ? priceIdToPlan(planPriceId) : null;

  // current_period_end is a Unix timestamp in seconds
  const periodEnd = sub.current_period_end
    ? new Date(sub.current_period_end * 1000)
    : null;

  // Read the prior row so we can detect a "just activated" transition and
  // notify the user. Notifications only fire when we cross from non-active
  // into active/trialing — repeated activations from the same state are no-ops.
  const existing = await getDb()
    .select()
    .from(subscriptions)
    .where(eq(subscriptions.stripeCustomerId, customerId))
    .limit(1);
  const priorStatus = existing[0]?.subscriptionStatus ?? null;
  const priorCancelAtPeriodEnd = existing[0]?.cancelAtPeriodEnd ?? false;
  const userId = existing[0]?.userId ?? null;

  await getDb()
    .update(subscriptions)
    .set({
      stripeSubscriptionId: sub.id,
      stripePriceId: planPriceId,
      planTier: planInfo?.tier ?? null,
      billingInterval: planInfo?.interval ?? null,
      subscriptionStatus: sub.status,
      currentPeriodEnd: periodEnd,
      cancelAtPeriodEnd: sub.cancel_at_period_end ?? false,
      addOnPriceIds,
      updatedAt: new Date(),
    })
    .where(eq(subscriptions.stripeCustomerId, customerId));

  // Cancellation log. Two transitions of interest:
  //   priorCancelAtPeriodEnd=false → sub.cancel_at_period_end=true
  //     → upsert a row (reason/comment come from Stripe metadata if the
  //       member used /api/cancel-subscription, otherwise empty)
  //   priorCancelAtPeriodEnd=true  → sub.cancel_at_period_end=false
  //     → mark the existing row restored (member changed their mind)
  // Idempotent via the upsert helper; safe to re-fire.
  if (userId) {
    const nowCancelAtPeriodEnd = sub.cancel_at_period_end ?? false;
    if (!priorCancelAtPeriodEnd && nowCancelAtPeriodEnd) {
      try {
        const meta = (sub.metadata ?? {}) as Record<string, string | undefined>;
        await upsertCancellation({
          userId,
          stripeSubscriptionId: sub.id,
          planTier: planInfo?.tier ?? null,
          reason: meta.cancellationReason ?? '',
          comment: meta.cancellationComment ?? '',
          cancelAt: periodEnd,
        });
      } catch (e) {
        console.error('[stripe.webhook] cancellation log upsert failed', e);
        Sentry.captureException(e, { tags: { area: 'stripe.webhook', phase: 'cancellation_log' } });
      }
    } else if (priorCancelAtPeriodEnd && !nowCancelAtPeriodEnd) {
      try {
        await markCancellationRestored(sub.id);
      } catch (e) {
        console.error('[stripe.webhook] cancellation restore mark failed', e);
        Sentry.captureException(e, { tags: { area: 'stripe.webhook', phase: 'cancellation_restore' } });
      }
    }
  }

  // Emit subscription_active notification on the active/trialing
  // transition. Wrapped in a try so a notification failure never breaks
  // webhook idempotency.
  const newlyActive =
    (sub.status === 'active' || sub.status === 'trialing') &&
    priorStatus !== 'active' &&
    priorStatus !== 'trialing';
  if (newlyActive && userId && planInfo) {
    try {
      const planName = PLANS[planInfo.tier].name;
      await createNotification({
        userId,
        kind: 'subscription_active',
        title: `${planName} plan activated`,
        body: `Welcome aboard — your ${planName} subscription is live. Manage billing any time on the Plan page.`,
        href: '/plan',
      });
    } catch (e) {
      console.error('[stripe.webhook] subscription_active notification failed', e);
      Sentry.captureException(e, { tags: { area: 'stripe.webhook', phase: 'notification' } });
    }

    // Try to issue any pending referral credit. This walks both directions:
    //   - if this user was REFERRED by someone, that referral is credited
    //     (their credit lands on this customer's Stripe customer balance)
    //   - if this user IS a referrer and any of their qualified referrals
    //     have just had their referred user upgrade, those credits process
    // tryIssueReferralCredit handles both. Failures are logged + swallowed.
    try {
      await tryIssueReferralCredit(userId);
    } catch (e) {
      console.error('[stripe.webhook] referral credit issuance failed', e);
      Sentry.captureException(e, { tags: { area: 'stripe.webhook', phase: 'referral_credit' } });
    }
  }
}

/**
 * Different Stripe API versions expose the linked subscription ID in
 * different places on the Invoice object. Try both.
 */
function extractSubscriptionId(invoice: Stripe.Invoice): string | null {
  const direct = (invoice as unknown as { subscription?: string | { id: string } | null })
    .subscription;
  if (direct) return typeof direct === 'string' ? direct : direct.id;

  // Newer API: invoice.parent.subscription_details.subscription
  const parent = (invoice as unknown as {
    parent?: { subscription_details?: { subscription?: string | { id: string } | null } };
  }).parent;
  const fromParent = parent?.subscription_details?.subscription;
  if (fromParent) return typeof fromParent === 'string' ? fromParent : fromParent.id;

  return null;
}

async function sendPaymentFailedEmail(invoice: Stripe.Invoice) {
  if (!resend) return;
  const to = invoice.customer_email;
  if (!to) return;

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://himayat.com.au';
  const portalLink = `${appUrl}/dashboard`;

  await resend.emails.send({
    from: 'Himayat <hello@himayat.com.au>',
    to,
    subject: 'Action needed: your Himayat payment failed',
    html: `
      <div style="font-family: -apple-system, BlinkMacSystemFont, sans-serif; line-height: 1.6;">
        <p>Hi,</p>
        <p>We weren't able to process your most recent Himayat subscription payment. This usually means the card on file has expired or has insufficient funds.</p>
        <p>To keep your subscription active, please update your payment method:</p>
        <p>
          <a href="${portalLink}"
             style="display:inline-block;background:#1a3530;color:#fff;padding:12px 24px;border-radius:999px;text-decoration:none;">
            Update billing details
          </a>
        </p>
        <p>If you need a hand, reply to this email and we'll sort it out.</p>
        <p>— Himayat</p>
      </div>
    `,
  });
}
