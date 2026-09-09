import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@workos-inc/authkit-nextjs';
import * as Sentry from '@sentry/nextjs';
import { eq } from 'drizzle-orm';
import { getStripe } from '@/lib/stripe';
import { getDb } from '@/lib/db';
import { CONSENT_COOKIE, consentStateFromCookie } from '@/lib/consent';
import { subscriptions } from '@/lib/db/schema';
import {
  ADDONS,
  getAddOnPriceId,
  getPlanPriceId,
  type AddOnId,
  type BillingInterval,
  type PlanTier,
} from '@/lib/plans';

export const runtime = 'nodejs';

interface CheckoutRequest {
  tier: PlanTier;
  interval: BillingInterval;
  addOns?: AddOnId[];
}

export async function POST(req: NextRequest) {
  const { user } = await withAuth();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const userId = user.id;
  const email = user.email;
  if (!email) {
    return NextResponse.json({ error: 'No email on WorkOS user' }, { status: 400 });
  }

  // Analytics consent rides along on the Stripe session so the webhook can
  // decide whether Meta CAPI may see this purchase. Same opt-in cookie that
  // gates the browser pixels; 'unset' is treated as denied downstream.
  const consent = consentStateFromCookie(req.cookies.get(CONSENT_COOKIE)?.value);

  let body: CheckoutRequest;
  try {
    body = (await req.json()) as CheckoutRequest;
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const { tier, interval, addOns = [] } = body;
  if (!tier || !interval) {
    return NextResponse.json({ error: 'tier and interval are required' }, { status: 400 });
  }
  if (tier === 'free') {
    // Free tier has no Stripe subscription — the user just signs up via WorkOS.
    return NextResponse.json(
      { error: 'Free plan does not require checkout. Sign up directly via /sign-up.' },
      { status: 400 },
    );
  }

  // One subscription per member. /plan hides Checkout for subscribers, but
  // /pricing posts here for any signed-in user — without this guard a Growth
  // member clicking "Start with Accelerate" gets a SECOND subscription on the
  // same customer once the 24h idempotency window lapses, and the DB row then
  // flip-flops between the two on every webhook.
  const existing = await getDb()
    .select()
    .from(subscriptions)
    .where(eq(subscriptions.userId, userId))
    .limit(1);
  const current = existing[0];
  const LIVE_STATUSES = new Set(['active', 'trialing', 'past_due', 'unpaid', 'incomplete']);
  if (current?.stripeSubscriptionId && LIVE_STATUSES.has(current.subscriptionStatus ?? '')) {
    return NextResponse.json(
      {
        error: 'You already have a subscription. Change or manage your plan from the Plan page.',
        code: 'already_subscribed',
        redirect: '/plan',
      },
      { status: 409 },
    );
  }

  // Build line items: base plan + add-ons compatible with the chosen tier.
  let planPriceId: string;
  try {
    planPriceId = getPlanPriceId(tier, interval);
  } catch (err) {
    // Config gap (missing STRIPE_PRICE_* env). Loud for us, generic for them.
    console.error('[checkout] plan price not configured', err);
    Sentry.captureException(err, { tags: { area: 'checkout', phase: 'plan_price' }, extra: { tier, interval } });
    return NextResponse.json(
      { error: 'Checkout is temporarily unavailable for this plan. Please try again shortly or contact us.' },
      { status: 500 },
    );
  }

  const lineItems: Array<{ price: string; quantity: number }> = [
    { price: planPriceId, quantity: 1 },
  ];

  for (const addOnId of addOns) {
    const addOnConfig = ADDONS[addOnId];
    if (!addOnConfig) continue;
    if (!addOnConfig.availableFor.includes(tier)) continue;
    try {
      lineItems.push({ price: getAddOnPriceId(addOnId), quantity: 1 });
    } catch (err) {
      // Missing env var. Refuse rather than silently charging the base plan
      // while the customer believes they bought the add-on.
      console.error('[checkout] add-on price not configured', err);
      Sentry.captureException(err, { tags: { area: 'checkout', phase: 'addon_price' }, extra: { addOnId } });
      return NextResponse.json(
        { error: `The ${addOnConfig.name} add-on isn’t available right now. Try again without it, or contact us.` },
        { status: 500 },
      );
    }
  }

  // Reuse an existing Stripe customer for this user, or create one.
  let customerId = current?.stripeCustomerId ?? null;
  if (!customerId) {
    const customer = await getStripe().customers.create(
      {
        email,
        metadata: { userId },
      },
      // Dedupe concurrent checkouts so we never create two customers for one user.
      { idempotencyKey: `gh-customer-${userId}` },
    );
    customerId = customer.id;

    if (existing.length > 0) {
      await getDb()
        .update(subscriptions)
        .set({ stripeCustomerId: customerId, email, updatedAt: new Date() })
        .where(eq(subscriptions.userId, userId));
    } else {
      await getDb().insert(subscriptions).values({
        userId,
        email,
        stripeCustomerId: customerId,
      });
    }
  }

  const origin = req.nextUrl.origin;

  // Stable idempotency key so an accidental double-submit / client retry
  // returns the same Checkout Session instead of creating duplicates.
  // `consent` is part of the key because it changes the session params —
  // Stripe rejects a reused key with different params, which would 400 a
  // visitor who declined, cancelled, then accepted cookies and retried.
  const idempotencyKey = `gh-checkout-${userId}-${tier}-${interval}-${consent}-${lineItems
    .map((li) => li.price)
    .sort()
    .join('.')}`;

  const session = await getStripe().checkout.sessions.create(
    {
      mode: 'subscription',
      customer: customerId,
      line_items: lineItems,
      // {CHECKOUT_SESSION_ID} is a literal Stripe placeholder — Stripe fills
      // it in. The bridge page uses it to sync the subscription before first
      // paint (kills the webhook race).
      success_url: `${origin}/onboarding/upgraded?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/pricing`,
      allow_promotion_codes: true,
      billing_address_collection: 'auto',
      subscription_data: {
        metadata: {
          userId,
          planTier: tier,
          billingInterval: interval,
          consent,
        },
      },
      metadata: {
        userId,
        consent,
      },
    },
    { idempotencyKey },
  );

  if (!session.url) {
    return NextResponse.json({ error: 'Stripe did not return a checkout URL' }, { status: 500 });
  }

  return NextResponse.json({ url: session.url });
}
