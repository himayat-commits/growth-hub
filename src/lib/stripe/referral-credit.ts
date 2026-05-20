// Stripe customer-balance credit issuance for qualified referrals.
//
// Triggered from the Stripe webhook after a user transitions into an
// active/trialing subscription. Walks the referrals table in both
// directions — if THIS user is either side of a qualified-but-uncredited
// referral, and the other side ALSO has a Stripe customer, we issue the
// A$50 credit to both balances and flip the row to credited.
//
// `customer.balance` is the simplest way — a negative balance is a credit
// that's automatically applied to future invoices. No coupon plumbing.

import 'server-only';
import { eq, inArray } from 'drizzle-orm';
import { getStripe } from '@/lib/stripe';
import { getDb } from '@/lib/db';
import { subscriptions, referrals } from '@/lib/db/schema';
import { createNotification } from '@/lib/db/notifications';
import {
  REFERRAL_CREDIT_CENTS,
  markReferralCredited,
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
): Promise<void> {
  // `createBalanceTransaction` posts a negative amount to credit the
  // customer's balance. Amount must be in the customer's settlement
  // currency — Australian dollars in this project.
  await getStripe().customers.createBalanceTransaction(stripeCustomerId, {
    amount: -amountCents,
    currency: 'aud',
    description,
  });
}

/**
 * For a user who just became active on a paid plan, try to settle any
 * qualified referrals they're part of. Idempotent (markReferralCredited
 * only flips rows in 'qualified' state).
 *
 * Skips silently when:
 *   - the user has no qualified referrals in either direction
 *   - the OTHER side of a referral doesn't have a Stripe customer yet
 *     (free or never-paid). We'll retry the next time their webhook fires.
 *   - the user themselves has no Stripe customer ID (shouldn't happen on
 *     a subscription_active transition, but defensive).
 */
export async function tryIssueReferralCredit(userId: string): Promise<void> {
  const db = getDb();

  // Pull every qualified referral this user is part of.
  const rows = await db
    .select()
    .from(referrals)
    .where(
      inArray(referrals.status, ['qualified']),
    );
  const involved = rows.filter(
    (r) => r.referrerUserId === userId || r.referredUserId === userId,
  );
  if (involved.length === 0) return;

  for (const referral of involved) {
    const referrerCustomerId = await getStripeCustomerId(referral.referrerUserId);
    const referredCustomerId = await getStripeCustomerId(referral.referredUserId);
    if (!referrerCustomerId || !referredCustomerId) {
      // Other side hasn't paid yet — leave qualified, retry on their webhook.
      continue;
    }

    // Issue credit to both sides. If one call fails, the markReferralCredited
    // call below won't fire, so we'll retry next time. Stripe's idempotency
    // protects against double-crediting if the retry hits before we mark.
    try {
      await Promise.all([
        applyBalanceCredit(
          referrerCustomerId,
          REFERRAL_CREDIT_CENTS,
          `Growth Hub referral credit (ref ${referral.referCode})`,
        ),
        applyBalanceCredit(
          referredCustomerId,
          REFERRAL_CREDIT_CENTS,
          `Growth Hub welcome credit (ref ${referral.referCode})`,
        ),
      ]);
    } catch (e) {
      console.error(`[referral-credit] Stripe credit failed for referral ${referral.id}`, e);
      continue;
    }

    await markReferralCredited(referral.referredUserId, REFERRAL_CREDIT_CENTS);

    // Notify both sides that the credit landed.
    try {
      await Promise.all([
        createNotification({
          userId: referral.referrerUserId,
          kind: 'referral_signed_up',
          title: 'A$50 referral credit applied',
          body: 'Your service credit is now on your Stripe customer balance — it applies automatically to your next invoice.',
          href: '/plan',
        }),
        createNotification({
          userId: referral.referredUserId,
          kind: 'referral_signed_up',
          title: 'A$50 welcome credit applied',
          body: 'Your service credit is now on your Stripe customer balance — it applies automatically to your next invoice.',
          href: '/plan',
        }),
      ]);
    } catch (e) {
      console.error('[referral-credit] notification fan-out failed', e);
    }
  }
}
