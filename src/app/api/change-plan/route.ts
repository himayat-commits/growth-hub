// POST /api/change-plan
//
// Body: { tier: PaidPlanTier, interval: BillingInterval, action: 'preview' | 'commit' }
//
// preview → returns { amountDue, currency, periodStart, periodEnd, newMonthlyAmount }
//          without modifying the subscription
// commit  → calls stripe.subscriptions.update with proration. Upgrade
//          charges proration immediately (always_invoice). Downgrade
//          credits the customer balance for the next invoice
//          (create_prorations).
//
// Only callable by users with an active paid subscription. New
// subscribers still go through /api/checkout.

import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@workos-inc/authkit-nextjs';
import type Stripe from 'stripe';
import * as Sentry from '@sentry/nextjs';
import { getStripe } from '@/lib/stripe';
import { getSubscription } from '@/lib/subscription';
import {
  PLANS,
  getPlanPriceId,
  priceIdToPlan,
  type BillingInterval,
  type PaidPlanTier,
} from '@/lib/plans';

export const runtime = 'nodejs';

interface ChangePlanRequest {
  tier: PaidPlanTier;
  interval: BillingInterval;
  action: 'preview' | 'commit';
}

interface ChangeDirection {
  isUpgrade: boolean;
  /** stripe proration_behavior to apply on commit. */
  prorationBehavior: 'always_invoice' | 'create_prorations';
}

function classify(
  currentTier: PaidPlanTier | null,
  newTier: PaidPlanTier,
): ChangeDirection {
  const currentPrice = currentTier ? PLANS[currentTier].monthlyPrice : 0;
  const newPrice = PLANS[newTier].monthlyPrice;
  const isUpgrade = newPrice > currentPrice;
  return {
    isUpgrade,
    // Upgrades: charge proration immediately so the user pays for the
    // higher tier from today.
    // Downgrades: don't charge anything now; just credit the difference
    // against the next invoice.
    prorationBehavior: isUpgrade ? 'always_invoice' : 'create_prorations',
  };
}

export async function POST(req: NextRequest) {
  const { user } = await withAuth();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  let body: ChangePlanRequest;
  try {
    body = (await req.json()) as ChangePlanRequest;
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const { tier, interval, action } = body;
  if (!tier || !interval || !action) {
    return NextResponse.json(
      { error: 'tier, interval, and action are required' },
      { status: 400 },
    );
  }

  const sub = await getSubscription(user.id);
  if (!sub?.stripeSubscriptionId) {
    return NextResponse.json(
      { error: 'No active subscription to change. Use /api/checkout to subscribe.' },
      { status: 400 },
    );
  }

  if (sub.planTier === tier && sub.billingInterval === interval) {
    return NextResponse.json(
      { error: "You're already on that plan and interval." },
      { status: 400 },
    );
  }

  let newPriceId: string;
  try {
    newPriceId = getPlanPriceId(tier, interval);
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }

  const stripe = getStripe();
  const stripeSub = await stripe.subscriptions.retrieve(sub.stripeSubscriptionId, {
    expand: ['items.data.price'],
  });

  // Find the line item that holds the BASE plan (skip add-ons).
  const planItem = stripeSub.items.data.find((item) => priceIdToPlan(item.price.id));
  if (!planItem) {
    return NextResponse.json(
      { error: "Could not find the plan line item on this subscription." },
      { status: 500 },
    );
  }

  const direction = classify(sub.planTier as PaidPlanTier | null, tier);

  if (action === 'preview') {
    // Use Stripe's invoices.createPreview to compute the exact prorated
    // amount due. This is what the user will see in the dialog before
    // they confirm.
    try {
      // `createPreview` is the supported name in newer Stripe SDKs; if
      // the local SDK exposes only `retrieveUpcoming` we fall back to it.
      // Both compute the same value.
      const invoicesApi = stripe.invoices as unknown as {
        createPreview?: (params: Stripe.InvoiceCreatePreviewParams) => Promise<Stripe.Invoice>;
        retrieveUpcoming?: (params: Record<string, unknown>) => Promise<Stripe.Invoice>;
      };
      const previewParams: Stripe.InvoiceCreatePreviewParams = {
        customer: sub.stripeCustomerId!,
        subscription: sub.stripeSubscriptionId,
        subscription_details: {
          items: [{ id: planItem.id, price: newPriceId }],
          proration_behavior: direction.prorationBehavior,
        },
      };
      const upcoming = invoicesApi.createPreview
        ? await invoicesApi.createPreview(previewParams)
        : await invoicesApi.retrieveUpcoming!({
            customer: sub.stripeCustomerId!,
            subscription: sub.stripeSubscriptionId,
            subscription_items: [{ id: planItem.id, price: newPriceId }],
            subscription_proration_behavior: direction.prorationBehavior,
          });

      return NextResponse.json({
        action: 'preview',
        isUpgrade: direction.isUpgrade,
        amountDue: upcoming.amount_due,
        currency: upcoming.currency,
        periodStart: upcoming.period_start,
        periodEnd: upcoming.period_end,
        newMonthlyAmount: PLANS[tier].monthlyPrice * 100, // cents
      });
    } catch (err) {
      console.error('[change-plan] preview failed', err);
      Sentry.captureException(err, { tags: { area: 'change-plan', phase: 'preview' } });
      return NextResponse.json(
        { error: 'Could not preview the change. Try again or contact support.' },
        { status: 500 },
      );
    }
  }

  // action === 'commit'
  try {
    await stripe.subscriptions.update(sub.stripeSubscriptionId, {
      items: [{ id: planItem.id, price: newPriceId }],
      proration_behavior: direction.prorationBehavior,
      metadata: {
        ...(stripeSub.metadata ?? {}),
        userId: user.id,
        planTier: tier,
        billingInterval: interval,
        lastChangeAt: new Date().toISOString(),
      },
    });
    // Webhook will sync the DB row. Return immediately so the client
    // can show the success state.
    return NextResponse.json({
      action: 'commit',
      isUpgrade: direction.isUpgrade,
    });
  } catch (err) {
    console.error('[change-plan] commit failed', err);
    Sentry.captureException(err, { tags: { area: 'change-plan', phase: 'commit' } });
    return NextResponse.json(
      { error: 'Could not change your plan. Try again or contact support.' },
      { status: 500 },
    );
  }
}
