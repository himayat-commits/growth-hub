// A$50 referral credit issuance for qualified referrals.
//
// Each SIDE of a qualified referral (referrer, referred) is settled on its
// own, exactly once, tracked by referrals.referrer_credit_state /
// referred_credit_state:
//
//   user has a Stripe customer  → customers.createBalanceTransaction(-A$50)
//                                 side state 'none' → 'stripe'
//   user has NO Stripe customer → user_profiles.pending_credit_cents += 5000
//                                 side state 'none' → 'pending'
//                                 (syncSubscription posts it to Stripe when
//                                 they first become active → 'applied')
//
// Once both sides have left 'none' the row flips to status=credited.
//
// Two callers:
//   - tryIssueReferralCredit(userId)  — every active subscription sync
//     (Stripe webhook / post-checkout bridge). Settles every qualified
//     referral the user is on either side of.
//   - issueReferralCreditNow(referralId) — the ops "Issue A$50 credits"
//     action in /ops/referrals.
//
// Idempotency: Stripe calls carry a stable key per referral + side
// (`gh-refcredit-<id>-<side>`), and the side-state columns only ever move
// away from 'none'. A retry after a partial failure re-runs the Stripe call
// (a no-op under the same key) and then completes the DB write it missed.
//
// `customer.balance` is the simplest way — a negative balance is a credit
// that's automatically applied to future invoices. No coupon plumbing.

import 'server-only';
import { eq } from 'drizzle-orm';
import * as Sentry from '@sentry/nextjs';
import { getStripe } from '@/lib/stripe';
import { getDb } from '@/lib/db';
import { subscriptions, type Referral } from '@/lib/db/schema';
import { createNotification } from '@/lib/db/notifications';
import {
  REFERRAL_CREDIT_CENTS,
  type ReferralSide,
  getReferralById,
  getQualifiedReferralsForUser,
  markSideCreditedViaStripe,
  holdSideCreditAsPending,
  finalizeReferralCredit,
} from '@/lib/db/referrals';

async function getStripeCustomerId(userId: string): Promise<string | null> {
  const rows = await getDb()
    .select({ stripeCustomerId: subscriptions.stripeCustomerId })
    .from(subscriptions)
    .where(eq(subscriptions.userId, userId))
    .limit(1);
  return rows[0]?.stripeCustomerId ?? null;
}

async function applyBalanceCredit(
  stripeCustomerId: string,
  amountCents: number,
  description: string,
  idempotencyKey: string,
): Promise<void> {
  // `createBalanceTransaction` posts a negative amount to credit the
  // customer's balance. Amount must be in the customer's settlement
  // currency — Australian dollars in this project.
  await getStripe().customers.createBalanceTransaction(
    stripeCustomerId,
    {
      amount: -amountCents,
      currency: 'aud',
      description,
    },
    { idempotencyKey },
  );
}

const SIDE_COPY: Record<
  ReferralSide,
  { stripeDesc: string; stripeTitle: string; heldTitle: string }
> = {
  referrer: {
    stripeDesc: 'Growth Hub referral credit',
    stripeTitle: 'A$50 referral credit applied',
    heldTitle: 'A$50 referral credit held for you',
  },
  referred: {
    stripeDesc: 'Growth Hub welcome credit',
    stripeTitle: 'A$50 welcome credit applied',
    heldTitle: 'A$50 welcome credit held for you',
  },
};

/**
 * Settle ONE side of a qualified referral. Throws if the Stripe call fails
 * (so the caller's retry contract — webhook 500 → Stripe retries — holds).
 * Never throws for "already settled"; that's a silent no-op.
 */
async function settleSide(referral: Referral, side: ReferralSide): Promise<void> {
  const state = side === 'referrer' ? referral.referrerCreditState : referral.referredCreditState;
  if (state !== 'none') return;

  const userId = side === 'referrer' ? referral.referrerUserId : referral.referredUserId;
  const copy = SIDE_COPY[side];
  const customerId = await getStripeCustomerId(userId);

  if (customerId) {
    // Stripe first (idempotent under the key), then the state flip. If the
    // flip fails we come back here, Stripe replays the same response, and
    // the flip gets another go.
    await applyBalanceCredit(
      customerId,
      REFERRAL_CREDIT_CENTS,
      `${copy.stripeDesc} (ref ${referral.referCode})`,
      `gh-refcredit-${referral.id}-${side}`,
    );
    const flipped = await markSideCreditedViaStripe(referral.id, side);
    if (flipped) {
      await createNotification({
        userId,
        kind: 'referral_signed_up',
        title: copy.stripeTitle,
        body: 'Your A$50 is on your Stripe customer balance — it applies automatically to your next Growth Hub invoice.',
        href: '/plan',
      });
    }
    return;
  }

  // No Stripe customer yet (Free member who has never started checkout).
  // Hold the credit on their profile; one atomic statement.
  const held = await holdSideCreditAsPending(referral.id, side, REFERRAL_CREDIT_CENTS);
  if (held) {
    await createNotification({
      userId,
      kind: 'referral_signed_up',
      title: copy.heldTitle,
      body: "We're holding your A$50 credit — it's applied to your first invoice as soon as you're on a paid plan.",
      href: '/plan',
    });
  } else {
    // Either a concurrent run settled this side first (fine) or the user has
    // no user_profiles row (should be impossible after sign-in). Surface the
    // second case; the next run retries once the profile exists.
    Sentry.captureMessage('referral-credit: could not hold pending credit (no profile row?)', {
      level: 'warning',
      tags: { area: 'referral_credit', phase: 'hold_pending' },
      extra: { referralId: referral.id, side, userId },
    });
  }
}

/**
 * Settle both sides of one qualified referral and, if both are now
 * settled, flip it to credited. Returns the resulting row (re-read).
 * Throws on Stripe failure so callers can decide retry vs. surface.
 */
async function settleReferral(referral: Referral): Promise<Referral> {
  if (referral.status !== 'qualified') return referral;

  // Sequential, not Promise.all: a failure on the first side should stop
  // before we touch the second, keeping the partial state easy to reason
  // about (and each side is independently idempotent anyway).
  await settleSide(referral, 'referrer');
  await settleSide(referral, 'referred');

  const finalized = await finalizeReferralCredit(referral.id, REFERRAL_CREDIT_CENTS);
  if (finalized) return finalized;
  return (await getReferralById(referral.id)) ?? referral;
}

/**
 * For a user who is active on a paid plan, settle any qualified referrals
 * they're part of (either side). Idempotent — see module header.
 *
 * Stripe failures are logged + Sentry'd per referral and then rethrown at
 * the end, so the webhook returns 500 and Stripe retries. Every referral
 * still gets attempted in the same pass.
 */
export async function tryIssueReferralCredit(userId: string): Promise<void> {
  const involved = await getQualifiedReferralsForUser(userId);
  if (involved.length === 0) return;

  let firstError: unknown = null;
  for (const referral of involved) {
    try {
      await settleReferral(referral);
    } catch (e) {
      console.error(`[referral-credit] settle failed for referral ${referral.id}`, e);
      Sentry.captureException(e, {
        tags: { area: 'referral_credit', phase: 'stripe_balance' },
        extra: { referralId: referral.id, referCode: referral.referCode, trigger: 'sync' },
      });
      firstError ??= e;
    }
  }
  if (firstError) throw firstError;
}

/**
 * Ops action: settle a specific qualified referral right now. Same per-side
 * logic as the sync path. Returns the row after the attempt — callers must
 * check `status === 'credited'` rather than assume success. Throws on
 * Stripe failure (the route turns that into a 502 and persists nothing).
 */
export async function issueReferralCreditNow(referralId: number): Promise<Referral | null> {
  const referral = await getReferralById(referralId);
  if (!referral) return null;
  if (referral.status === 'credited') return referral;
  if (referral.status !== 'qualified') {
    throw new Error(`Referral ${referralId} is ${referral.status}; only qualified referrals can be credited`);
  }
  try {
    return await settleReferral(referral);
  } catch (e) {
    Sentry.captureException(e, {
      tags: { area: 'referral_credit', phase: 'stripe_balance' },
      extra: { referralId, referCode: referral.referCode, trigger: 'ops' },
    });
    throw e;
  }
}
