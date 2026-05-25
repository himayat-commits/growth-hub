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

/** Insert an RSVP, idempotent. Returns true if a new row was created.
 *  Attribution is optional — when present it lets /ops/events answer
 *  "where did these RSVPs come from?" */
export async function rsvpToEvent(
  userId: string,
  eventId: number,
  attribution?: RsvpAttribution,
): Promise<boolean> {
  const db = getDb();
  // Check first so we can return the right boolean without relying on
  // returning() shape variance across drivers.
  const existing = await db
    .select()
    .from(eventRsvps)
    .where(and(eq(eventRsvps.userId, userId), eq(eventRsvps.eventId, eventId)))
    .limit(1);
  if (existing[0]) return false;
  await db.insert(eventRsvps).values({
    userId,
    eventId,
    source: attribution?.source ?? null,
    utmMedium: attribution?.utmMedium ?? null,
    utmCampaign: attribution?.utmCampaign ?? null,
    utmContent: attribution?.utmContent ?? null,
    ref: attribution?.ref ?? null,
  });
  return true;
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
