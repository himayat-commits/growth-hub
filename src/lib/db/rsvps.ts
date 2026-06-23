// Server-side helpers for event RSVPs (Drizzle table, separate from
// Payload's `events` collection in the payload schema).

import 'server-only';
import { and, eq, gte } from 'drizzle-orm';
import { getDb } from '@/lib/db';
import { eventRsvps, type EventRsvp } from '@/lib/db/schema';

export interface RsvpAttribution {
  source?: string | null;
  utmMedium?: string | null;
  utmCampaign?: string | null;
  utmContent?: string | null;
  ref?: string | null;
}

/** Insert an RSVP, idempotent. Returns true if a NEW row was created, false
 *  if the user had already RSVP'd. Race-safe: the (userId, eventId) primary
 *  key + onConflictDoNothing means two concurrent POSTs can't double-insert —
 *  exactly one wins and the other returns false. The first RSVP's attribution
 *  is preserved (we never overwrite on conflict). */
export async function rsvpToEvent(
  userId: string,
  eventId: number,
  attribution?: RsvpAttribution,
): Promise<boolean> {
  const inserted = await getDb()
    .insert(eventRsvps)
    .values({
      userId,
      eventId,
      source: attribution?.source ?? null,
      utmMedium: attribution?.utmMedium ?? null,
      utmCampaign: attribution?.utmCampaign ?? null,
      utmContent: attribution?.utmContent ?? null,
      ref: attribution?.ref ?? null,
    })
    .onConflictDoNothing({ target: [eventRsvps.userId, eventRsvps.eventId] })
    .returning();
  return inserted.length > 0;
}

/** Cancel an RSVP. Returns true if a row was actually deleted. */
export async function cancelRsvp(userId: string, eventId: number): Promise<boolean> {
  const db = getDb();
  const result = await db
    .delete(eventRsvps)
    .where(and(eq(eventRsvps.userId, userId), eq(eventRsvps.eventId, eventId)))
    .returning();
  return result.length > 0;
}

/** All RSVPs for a user, optionally filtered to upcoming events (i.e.
 *  created within the last year — we don't have the event date here, so
 *  the page-level join filters by date). */
export async function getUserRsvps(userId: string): Promise<EventRsvp[]> {
  return getDb()
    .select()
    .from(eventRsvps)
    .where(eq(eventRsvps.userId, userId));
}

/** Set membership check: which of these event IDs has the user RSVP'd to?
 *  Returned as a Set for O(1) membership tests in render. */
export async function getUserRsvpSet(userId: string): Promise<Set<number>> {
  const rows = await getUserRsvps(userId);
  return new Set(rows.map((r) => r.eventId));
}

/** Recent (last 90 days) RSVP count for a user — for the dashboard
 *  "Upcoming sessions" preview. */
export async function getRecentRsvpCount(userId: string): Promise<number> {
  const ninetyDaysAgo = new Date();
  ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
  const rows = await getDb()
    .select()
    .from(eventRsvps)
    .where(
      and(eq(eventRsvps.userId, userId), gte(eventRsvps.createdAt, ninetyDaysAgo)),
    );
  return rows.length;
}
