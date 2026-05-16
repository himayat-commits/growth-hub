import { withAuth } from '@workos-inc/authkit-nextjs';
import { redirect } from 'next/navigation';
import { eq } from 'drizzle-orm';
import { getDb } from '@/lib/db';
import { subscriptions, type Subscription } from '@/lib/db/schema';

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
