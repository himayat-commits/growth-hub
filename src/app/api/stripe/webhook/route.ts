import { NextRequest, NextResponse } from 'next/server';
import type Stripe from 'stripe';
import { Resend } from 'resend';
import * as Sentry from '@sentry/nextjs';
import { getStripe } from '@/lib/stripe';
import { syncSubscription } from '@/lib/stripe/sync-subscription';
import { sendServerConversion } from '@/lib/analytics/server-conversions';

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
        // Tier 3.4: fire server-side conversions. No-op when META_CAPI_*
        // / GOOGLE_ADS_* env vars aren't set, so safe to leave in.
        // Doesn't await — if Meta is slow we don't want to slow the
        // webhook ack and trigger Stripe to retry.
        void sendServerConversion({
          eventId: event.id,
          eventName: session.mode === 'subscription' ? 'Purchase' : 'Lead',
          email: session.customer_details?.email ?? null,
          phone: session.customer_details?.phone ?? null,
          externalId:
            typeof session.customer === 'string'
              ? session.customer
              : (session.customer?.id ?? null),
          value:
            typeof session.amount_total === 'number'
              ? session.amount_total / 100
              : undefined,
          currency: session.currency?.toUpperCase(),
          sourceUrl: session.success_url ?? undefined,
          // fbc / fbp / clientIp / userAgent would come from
          // session.metadata if we threaded them through at checkout-
          // creation time. Wire in /api/checkout when ready.
        });
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
