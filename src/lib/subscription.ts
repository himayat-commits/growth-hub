import { withAuth } from '@/lib/auth/with-auth';
import { redirect } from 'next/navigation';
import { eq } from 'drizzle-orm';
import { getDb } from '@/lib/db';
import { subscriptions, type Subscription } from '@/lib/db/schema';
import type { PlanTier } from '@/lib/plans';

/**
 * Look up the subscription row for a user. Falls back to the current WorkOS
 * user when no userId is passed.
 */
export async function getSubscription(userId?: string): Promise<Subscription | null> {
  let id = userId;
  if (!id) {
    const { user } = await withAuth();
    id = user?.id ?? undefined;
  }
  if (!id) return null;

  const rows = await getDb().select().from(subscriptions).where(eq(subscriptions.userId, id)).limit(1);
  return rows[0] ?? null;
}

/**
 * Is this subscription currently entitled to paid features?
 *
 * `active` and `trialing` count as entitled. `past_due` is intentionally
 * excluded so a failed payment immediately gates access — change this if
 * you want a grace period.
 */
export function isActive(sub: Subscription | null | undefined): boolean {
  if (!sub) return false;
  if (sub.subscriptionStatus !== 'active' && sub.subscriptionStatus !== 'trialing') {
    return false;
  }
  if (!sub.currentPeriodEnd) return false;
  return sub.currentPeriodEnd.getTime() > Date.now();
}

/**
 * Server-component / route-handler guard. Redirects to /pricing if the user
 * doesn't have an active subscription. Returns the subscription on success
 * so the caller can read planTier, billingInterval, etc.
 */
export async function requireSubscription(): Promise<Subscription> {
  const sub = await getSubscription();
  if (!isActive(sub)) {
    redirect('/pricing');
  }
  return sub!;
}

/**
 * Resolve the effective plan tier for any signed-in user.
 *
 * Free Members have no `subscriptions` row — the absence of a row IS the
 * Free state. Paid users with an active sub return their `planTier`. Users
 * whose paid sub has lapsed (cancelled / past_due / expired period) fall
 * back to Free until they re-subscribe. This is the helper to use everywhere
 * the UI needs to know "what does this user see right now".
 */
export function getEffectivePlan(sub: Subscription | null | undefined): PlanTier {
  if (isActive(sub) && sub?.planTier) {
    return sub.planTier as PlanTier;
  }
  return 'free';
}

/** Length of the Free Member trial window, in days. Surfaced in dashboard
 *  countdown copy and on the pricing page. Change here only — banner copy
 *  reads from this constant. */
export const FREE_TIER_DAYS = 120;

/**
 * How many days a Free Member has been on the platform, measured from
 * `user_profiles.createdAt` (auto-created on first sign-in). Day 0 = today.
 * Negative numbers are clamped to 0 so banner copy stays sane if a profile
 * has a future-dated createdAt for any reason (test data, clock skew).
 */
export function getFreeMemberDayCount(profileCreatedAt: Date): number {
  const ms = Date.now() - profileCreatedAt.getTime();
  return Math.max(0, Math.floor(ms / 86_400_000));
}
