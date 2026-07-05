// Canonical Stripe → DB subscription sync, shared by the Stripe webhook and
// the post-checkout bridge page (/onboarding/upgraded). Idempotent —
// whichever caller runs first writes the same canonical state.

import 'server-only';
import type Stripe from 'stripe';
import { eq } from 'drizzle-orm';
import * as Sentry from '@sentry/nextjs';
import { getStripe } from '@/lib/stripe';
import { getDb } from '@/lib/db';
import { subscriptions } from '@/lib/db/schema';
import { priceIdToPlan, PLANS } from '@/lib/plans';
import { createNotification } from '@/lib/db/notifications';
import { tryIssueReferralCredit } from '@/lib/stripe/referral-credit';
import { upsertCancellation, markCancellationRestored } from '@/lib/db/cancellations';
import { loadOnboardingState } from '@/lib/wizard/provisioning-store';

/**
 * Pull canonical subscription state from Stripe and overwrite our DB row.
 * Stripe is the source of truth — never trust diffs from event payloads.
 */
export async function syncSubscription(subscriptionId: string) {
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
    // These audit writes are idempotent (upsert keyed on stripeSubscriptionId),
    // so we let failures propagate to the top-level catch → Stripe retries the
    // webhook rather than silently losing the cancellation record.
    if (!priorCancelAtPeriodEnd && nowCancelAtPeriodEnd) {
      const meta = (sub.metadata ?? {}) as Record<string, string | undefined>;
      await upsertCancellation({
        userId,
        stripeSubscriptionId: sub.id,
        planTier: planInfo?.tier ?? null,
        reason: meta.cancellationReason ?? '',
        comment: meta.cancellationComment ?? '',
        cancelAt: periodEnd,
      });
    } else if (priorCancelAtPeriodEnd && !nowCancelAtPeriodEnd) {
      await markCancellationRestored(sub.id);
    }
  }

  const isActiveNow = sub.status === 'active' || sub.status === 'trialing';
  const newlyActive =
    isActiveNow && priorStatus !== 'active' && priorStatus !== 'trialing';

  // subscription_active notification fires only on the activation transition.
  // Best-effort: a failed notification must never break webhook idempotency,
  // so it stays swallowed (and won't re-fire on a retry, since priorStatus is
  // already active by then).
  if (newlyActive && userId && planInfo) {
    try {
      const planName = PLANS[planInfo.tier].name;
      // Pre-provision users' next action is finishing setup, not billing —
      // point them back into the wizard via the post-checkout bridge.
      const state = await loadOnboardingState(userId);
      const provisioned = Boolean(state?.provisioning.businessNumber);
      await createNotification({
        userId,
        kind: 'subscription_active',
        title: `${planName} plan activated`,
        body: provisioned
          ? `Welcome aboard — your ${planName} subscription is live. Manage billing any time on the Plan page.`
          : `Welcome aboard — your ${planName} subscription is live. Finish your setup and we'll create your Birdeye account.`,
        href: provisioned ? '/plan' : '/onboarding/upgraded',
      });
    } catch (e) {
      console.error('[stripe.webhook] subscription_active notification failed', e);
      Sentry.captureException(e, { tags: { area: 'stripe.webhook', phase: 'notification' } });
    }
  }

  // Settle any pending referral credit. This walks both directions:
  //   - if this user was REFERRED by someone, that referral is credited
  //   - if this user IS a referrer and their referred user has now upgraded
  // Run on EVERY active/trialing sync (not just the activation transition) so
  // the "other side pays later" case is retried, and so a Stripe webhook retry
  // actually re-attempts it. tryIssueReferralCredit is idempotent (only flips
  // 'qualified' rows; the Stripe balance credits carry idempotency keys), so we
  // let failures propagate to the top-level catch → Stripe retries.
  if (isActiveNow && userId) {
    await tryIssueReferralCredit(userId);
  }
}
