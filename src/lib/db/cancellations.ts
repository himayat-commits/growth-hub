// Cancellation log helpers. Single upsert function so the cancel
// endpoint and the Stripe webhook can both write the row idempotently.

import 'server-only';
import { sql } from 'drizzle-orm';
import { getDb } from './index';
import { subscriptionCancellations, type NewSubscriptionCancellation } from './schema';

/**
 * Upsert a cancellation row.
 *
 * Behaviour:
 *   - If no row exists for this stripeSubscriptionId → INSERT.
 *   - If one exists → UPDATE reason/comment/cancelAt only when the
 *     incoming values are non-empty. The dual-writer race (CancelDialog
 *     submits reason+comment, webhook fires moments later with empty
 *     metadata) won't blank out the survey data.
 *
 * Returns the row id for the caller to log.
 */
export async function upsertCancellation(row: NewSubscriptionCancellation) {
  const db = getDb();
  const result = await db
    .insert(subscriptionCancellations)
    .values(row)
    .onConflictDoUpdate({
      target: subscriptionCancellations.stripeSubscriptionId,
      set: {
        // COALESCE NULLIF '' lets us preserve a non-empty existing
        // reason/comment if the new write is empty.
        reason: sql`COALESCE(NULLIF(EXCLUDED.reason, ''), ${subscriptionCancellations.reason})`,
        comment: sql`COALESCE(NULLIF(EXCLUDED.comment, ''), ${subscriptionCancellations.comment})`,
        planTier: sql`COALESCE(EXCLUDED.plan_tier, ${subscriptionCancellations.planTier})`,
        cancelAt: sql`COALESCE(EXCLUDED.cancel_at, ${subscriptionCancellations.cancelAt})`,
        updatedAt: new Date(),
      },
    })
    .returning({ id: subscriptionCancellations.id });
  return result[0]?.id ?? null;
}

/**
 * Mark a row as restored (cancellation undone). Called when Stripe sends
 * customer.subscription.updated with cancel_at_period_end flipped back to
 * false on a row we previously logged.
 */
export async function markCancellationRestored(stripeSubscriptionId: string) {
  const db = getDb();
  await db
    .update(subscriptionCancellations)
    .set({ restoredAt: new Date(), updatedAt: new Date() })
    .where(sql`${subscriptionCancellations.stripeSubscriptionId} = ${stripeSubscriptionId}`);
}
