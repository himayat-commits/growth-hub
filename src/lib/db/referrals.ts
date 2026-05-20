// Server-side helpers for the referrals table.
//
// Lifecycle:
//   1. Marketing site captures ?ref=<code> in a cookie (set by middleware)
//   2. /auth/callback reads the cookie on first sign-in and calls
//      attributeReferralFromCookie() — creates a row linking the new
//      user to the referrer
//   3. /api/service-bookings calls qualifyReferralOnGrowthCall() when
//      the referred user books their first Growth Call → status=qualified
//   4. A separate step (manual ops or future cron) calls
//      issueReferralCredits() to apply the Stripe customer-balance credit
//      to both sides → status=credited
//
// Self-referrals are blocked at insert. Existing referrals are not
// overwritten (one referrer per referred user — first one wins).

import 'server-only';
import { and, eq } from 'drizzle-orm';
import { getDb } from '@/lib/db';
import { referrals, userProfiles, type Referral } from '@/lib/db/schema';

/** A$50 in cents — the per-side credit. */
export const REFERRAL_CREDIT_CENTS = 5000;

/** Look up a user profile by their referral code. Used during attribution. */
export async function findReferrerByCode(code: string) {
  const rows = await getDb()
    .select()
    .from(userProfiles)
    .where(eq(userProfiles.referCode, code))
    .limit(1);
  return rows[0] ?? null;
}

/**
 * Create the referral row. Idempotent — returns the existing row if the
 * referred user is already attributed to someone (first-come wins). Returns
 * null if self-referral or referrer not found.
 */
export async function attributeReferral(input: {
  referredUserId: string;
  referCode: string;
}): Promise<Referral | null> {
  const referrer = await findReferrerByCode(input.referCode);
  if (!referrer) return null;
  if (referrer.userId === input.referredUserId) return null; // self-referral

  const db = getDb();
  // Check if already attributed.
  const existing = await db
    .select()
    .from(referrals)
    .where(eq(referrals.referredUserId, input.referredUserId))
    .limit(1);
  if (existing[0]) return existing[0];

  const inserted = await db
    .insert(referrals)
    .values({
      referrerUserId: referrer.userId,
      referredUserId: input.referredUserId,
      referCode: input.referCode,
    })
    .onConflictDoNothing({ target: referrals.referredUserId })
    .returning();
  if (inserted[0]) return inserted[0];

  // Lost the race — re-fetch.
  const refetched = await db
    .select()
    .from(referrals)
    .where(eq(referrals.referredUserId, input.referredUserId))
    .limit(1);
  return refetched[0] ?? null;
}

/**
 * Promote a pending referral to qualified. Called when the referred user
 * books their first Growth Call. Idempotent — no-op if the referral is
 * already qualified/credited.
 */
export async function qualifyReferral(referredUserId: string): Promise<Referral | null> {
  const db = getDb();
  const result = await db
    .update(referrals)
    .set({ status: 'qualified', qualifiedAt: new Date() })
    .where(
      and(eq(referrals.referredUserId, referredUserId), eq(referrals.status, 'pending')),
    )
    .returning();
  return result[0] ?? null;
}

/** All referrals where this user is the referrer. */
export async function getReferralsByReferrer(userId: string): Promise<Referral[]> {
  return getDb()
    .select()
    .from(referrals)
    .where(eq(referrals.referrerUserId, userId));
}

/** Top-of-card stats for /benefits: count by status + total credited. */
export interface ReferralStats {
  total: number;
  pending: number;
  qualified: number;
  credited: number;
  totalCreditCents: number;
}

export async function getReferralStats(userId: string): Promise<ReferralStats> {
  const rows = await getReferralsByReferrer(userId);
  const stats: ReferralStats = {
    total: rows.length,
    pending: 0,
    qualified: 0,
    credited: 0,
    totalCreditCents: 0,
  };
  for (const r of rows) {
    if (r.status === 'pending') stats.pending++;
    else if (r.status === 'qualified') stats.qualified++;
    else if (r.status === 'credited') {
      stats.credited++;
      stats.totalCreditCents += r.creditedAmountCents;
    }
  }
  return stats;
}

/** Mark a referral as credited and store the per-side amount.
 *  Doesn't call Stripe itself — the caller decides when (and if) to issue
 *  the actual customer-balance credit. Idempotent. */
export async function markReferralCredited(
  referredUserId: string,
  perSideCents: number,
): Promise<Referral | null> {
  const db = getDb();
  const result = await db
    .update(referrals)
    .set({
      status: 'credited',
      creditedAmountCents: perSideCents,
      creditedAt: new Date(),
    })
    .where(
      and(eq(referrals.referredUserId, referredUserId), eq(referrals.status, 'qualified')),
    )
    .returning();
  return result[0] ?? null;
}
