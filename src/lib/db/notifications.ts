// Server-side helpers for the notification feed.
//
// Append-only by design — we never delete rows, just flip readAt. The
// topbar bell shows the unread count; /dashboard shows the latest 3-5
// in the Notifications card.

import 'server-only';
import { and, desc, eq, isNull, sql } from 'drizzle-orm';
import { getDb } from '@/lib/db';
import { notifications, type Notification, type NewNotification } from '@/lib/db/schema';

export type NotificationKind =
  | 'welcome'
  | 'subscription_active'
  | 'birdeye_provisioned'
  | 'new_resource'
  | 'event_reminder'
  | 'referral_signed_up'
  | 'message_received';

export interface NotificationInsert {
  userId: string;
  kind: NotificationKind;
  title: string;
  body: string;
  href?: string | null;
}

/** Create a notification. Never throws — failures log to console so we
 *  don't take down the parent flow (a Stripe webhook, an SSE provision,
 *  etc.). */
export async function createNotification(input: NotificationInsert): Promise<void> {
  try {
    const row: NewNotification = {
      userId: input.userId,
      kind: input.kind,
      title: input.title,
      body: input.body,
      href: input.href ?? null,
    };
    await getDb().insert(notifications).values(row);
  } catch (e) {
    console.error('[notifications] createNotification failed', e);
  }
}

/** Latest N notifications for a user. Default 20 — enough for the
 *  inbox view, plenty for the dashboard card preview. */
export async function getNotifications(userId: string, limit = 20): Promise<Notification[]> {
  return getDb()
    .select()
    .from(notifications)
    .where(eq(notifications.userId, userId))
    .orderBy(desc(notifications.createdAt))
    .limit(limit);
}

/** Number of unread notifications. Used by the topbar bell. */
export async function getUnreadNotificationCount(userId: string): Promise<number> {
  const rows = await getDb()
    .select({ id: notifications.id })
    .from(notifications)
    .where(and(eq(notifications.userId, userId), isNull(notifications.readAt)));
  return rows.length;
}

/** Mark a single notification as read. Idempotent — repeated calls are no-ops. */
export async function markNotificationRead(userId: string, id: number): Promise<boolean> {
  const result = await getDb()
    .update(notifications)
    .set({ readAt: sql`now()` })
    .where(
      and(
        eq(notifications.id, id),
        eq(notifications.userId, userId),
        isNull(notifications.readAt),
      ),
    )
    .returning();
  return result.length > 0;
}

/** Mark every unread notification for a user as read. Returns the count
 *  that was actually flipped. */
export async function markAllNotificationsRead(userId: string): Promise<number> {
  const result = await getDb()
    .update(notifications)
    .set({ readAt: sql`now()` })
    .where(and(eq(notifications.userId, userId), isNull(notifications.readAt)))
    .returning();
  return result.length;
}
