// Server-side helpers for the referrals table.
//
// Lifecycle (referral.status):
//   1. Marketing site captures ?ref=<code> in a cookie (set by middleware)
//   2. /auth/callback reads the cookie on first sign-in and calls
//      attributeReferral() — creates a row linking the new user to the
//      referrer → status=pending
//   3. Ops marks the referred member's Growth Call booking `completed`
//      (PATCH /api/ops/bookings/[id]) and calls
//      qualifyReferralForCompletedGrowthCall() → status=qualified.
//      Booking a call is NOT enough — the free Growth Call is a Free-tier
//      benefit, so qualifying on the request alone would let two throwaway
//      accounts mint A$100 in seconds.
//   4. lib/stripe/referral-credit.ts settles each SIDE of a qualified row
//      independently (Stripe balance credit if the user has a Stripe
//      customer, otherwise held in user_profiles.pending_credit_cents).
//      Runs on every active subscription sync and on the ops "Issue A$50
//      credits" action. When both sides are settled → status=credited.
//   5. When a member with a held credit first becomes active,
//      syncSubscription() posts the whole held amount to Stripe and flips
//      their 'pending' side states to 'applied'.
//
// Per-side credit state (referrer_credit_state / referred_credit_state):
//   'none' → 'stripe'  | 'none' → 'pending' → 'applied'
// Nothing ever moves a side back to 'none'; that is what makes issuance
// idempotent across webhook retries and repeated ops clicks.
//
// Self-referrals are blocked at insert. Existing referrals are not
// overwritten (one referrer per referred user — first one wins).

import 'server-only';
import { and, eq, sql } from 'drizzle-orm';
import { getDb } from '@/lib/db';
import { referrals, userProfiles, type Referral } from '@/lib/db/schema';
import { isValidReferCode } from '@/lib/referral-code';

/** A$50 in cents — the per-side credit. */
export const REFERRAL_CREDIT_CENTS = 5000;

export type ReferralStatus = 'pending' | 'qualified' | 'credited' | 'declined';
export type ReferralSide = 'referrer' | 'referred';
export type CreditState = 'none' | 'stripe' | 'pending' | 'applied';

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
  // The proxy validates ?ref= before setting the cookie, but the cookie can
  // be set by anything on the origin (ShareButtons used to write a random
  // anon id into the same cookie name). Validate again here.
  if (!isValidReferCode(input.referCode)) return null;
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
 * Promote a pending referral to qualified. Call this ONLY when ops has
 * marked the referred user's Growth Call booking `completed` — the
 * completed call is the qualifying event, not the booking request.
 * Idempotent — returns null (no-op) if the referral is already
 * qualified/credited/declined or the user was never referred.
 *
 * Does not issue the credit. The caller may follow up with
 * `issueReferralCreditNow(referral.id)` from lib/stripe/referral-credit.ts
 * to settle both sides immediately; otherwise the next active subscription
 * sync or the ops "Issue A$50 credits" action will.
 */
export async function qualifyReferralForCompletedGrowthCall(
  referredUserId: string,
): Promise<Referral | null> {
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

/** @deprecated Use qualifyReferralForCompletedGrowthCall — same behaviour,
 *  the name makes the trigger explicit. */
export const qualifyReferral = qualifyReferralForCompletedGrowthCall;

export async function getReferralById(id: number): Promise<Referral | null> {
  const rows = await getDb().select().from(referrals).where(eq(referrals.id, id)).limit(1);
  return rows[0] ?? null;
}

/** All referrals where this user is the referrer. */
export async function getReferralsByReferrer(userId: string): Promise<Referral[]> {
  return getDb()
    .select()
    .from(referrals)
    .where(eq(referrals.referrerUserId, userId));
}

/** Every qualified referral this user is on either side of. */
export async function getQualifiedReferralsForUser(userId: string): Promise<Referral[]> {
  return getDb()
    .select()
    .from(referrals)
    .where(
      and(
        eq(referrals.status, 'qualified'),
        sql`(${referrals.referrerUserId} = ${userId} OR ${referrals.referredUserId} = ${userId})`,
      ),
    );
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

/** Ops funnel: row counts per status + total A$ currently held as pending
 *  credit across all profiles. One grouped query + one aggregate. */
export interface ReferralFunnel {
  pending: number;
  qualified: number;
  credited: number;
  declined: number;
  heldCreditCents: number;
}

export async function getReferralFunnel(): Promise<ReferralFunnel> {
  const db = getDb();
  const [byStatus, held] = await Promise.all([
    db
      .select({ status: referrals.status, c: sql<number>`count(*)::int` })
      .from(referrals)
      .groupBy(referrals.status),
    db
      .select({ held: sql<number>`coalesce(sum(${userProfiles.pendingCreditCents}), 0)::int` })
      .from(userProfiles),
  ]);
  const funnel: ReferralFunnel = {
    pending: 0,
    qualified: 0,
    credited: 0,
    declined: 0,
    heldCreditCents: held[0]?.held ?? 0,
  };
  for (const row of byStatus) {
    const key = row.status as ReferralStatus;
    if (key in funnel) funnel[key] = row.c;
  }
  return funnel;
}

// ── Per-side credit state ──────────────────────────────────────────────────

/**
 * Record that a side's A$50 was posted to Stripe. Only flips 'none' →
 * 'stripe'; returns false if the side had already been settled (a retry).
 */
export async function markSideCreditedViaStripe(
  referralId: number,
  side: ReferralSide,
): Promise<boolean> {
  const col = side === 'referrer' ? referrals.referrerCreditState : referrals.referredCreditState;
  const rows = await getDb()
    .update(referrals)
    .set(side === 'referrer' ? { referrerCreditState: 'stripe' } : { referredCreditState: 'stripe' })
    .where(and(eq(referrals.id, referralId), eq(col, 'none')))
    .returning({ id: referrals.id });
  return rows.length > 0;
}

/**
 * Hold a side's A$50 on the user's profile because they have no Stripe
 * customer yet. ONE statement: flips the side 'none' → 'pending' and
 * increments user_profiles.pending_credit_cents together, so a crash
 * between the two can neither lose the credit nor double it. The
 * neon-http driver has no interactive transactions — hence the CTE.
 *
 * Returns false if nothing changed: the side was already settled, or the
 * user has no user_profiles row (nothing is flipped in that case either,
 * so the next run can retry once the profile exists).
 */
export async function holdSideCreditAsPending(
  referralId: number,
  side: ReferralSide,
  amountCents: number,
): Promise<boolean> {
  const stateCol = sql.raw(side === 'referrer' ? 'referrer_credit_state' : 'referred_credit_state');
  const userCol = sql.raw(side === 'referrer' ? 'referrer_user_id' : 'referred_user_id');
  const result = await getDb().execute(sql`
    WITH flipped AS (
      UPDATE referrals
      SET ${stateCol} = 'pending'
      WHERE id = ${referralId}
        AND ${stateCol} = 'none'
        AND EXISTS (SELECT 1 FROM user_profiles up WHERE up.user_id = referrals.${userCol})
      RETURNING ${userCol} AS uid
    )
    UPDATE user_profiles
    SET pending_credit_cents = pending_credit_cents + ${amountCents},
        updated_at = now()
    FROM flipped
    WHERE user_profiles.user_id = flipped.uid
    RETURNING user_profiles.user_id
  `);
  return result.rows.length > 0;
}

/**
 * Close out a referral once BOTH sides have left 'none'. Stores the
 * per-side amount. Only flips 'qualified' rows; returns null if the row
 * isn't ready (a side still 'none') or already credited.
 */
export async function finalizeReferralCredit(
  referralId: number,
  perSideCents: number,
): Promise<Referral | null> {
  const rows = await getDb()
    .update(referrals)
    .set({
      status: 'credited',
      creditedAmountCents: perSideCents,
      creditedAt: new Date(),
    })
    .where(
      and(
        eq(referrals.id, referralId),
        eq(referrals.status, 'qualified'),
        sql`${referrals.referrerCreditState} <> 'none'`,
        sql`${referrals.referredCreditState} <> 'none'`,
      ),
    )
    .returning();
  return rows[0] ?? null;
}

// ── Held (pending) credit on the profile ───────────────────────────────────

export async function getPendingCreditCents(userId: string): Promise<number> {
  const rows = await getDb()
    .select({ cents: userProfiles.pendingCreditCents })
    .from(userProfiles)
    .where(eq(userProfiles.userId, userId))
    .limit(1);
  return rows[0]?.cents ?? 0;
}

/**
 * Zero the held credit — but only if it still equals the amount the caller
 * just posted to Stripe. Returns false if the amount moved underneath us
 * (another referral settled between read and write); the caller should
 * alert rather than silently drop the difference.
 */
export async function consumePendingCredit(userId: string, expectedCents: number): Promise<boolean> {
  const rows = await getDb()
    .update(userProfiles)
    .set({ pendingCreditCents: 0, updatedAt: new Date() })
    .where(and(eq(userProfiles.userId, userId), eq(userProfiles.pendingCreditCents, expectedCents)))
    .returning({ userId: userProfiles.userId });
  return rows.length > 0;
}

/** Flip every 'pending' side this user owns to 'applied' (both columns). */
export async function markPendingCreditStatesApplied(userId: string): Promise<void> {
  const db = getDb();
  await Promise.all([
    db
      .update(referrals)
      .set({ referrerCreditState: 'applied' })
      .where(and(eq(referrals.referrerUserId, userId), eq(referrals.referrerCreditState, 'pending'))),
    db
      .update(referrals)
      .set({ referredCreditState: 'applied' })
      .where(and(eq(referrals.referredUserId, userId), eq(referrals.referredCreditState, 'pending'))),
  ]);
}
