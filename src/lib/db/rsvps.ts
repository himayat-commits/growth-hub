// Server-side helpers for event RSVPs (Drizzle table, separate from
// Payload's `events` collection in the payload schema).

import 'server-only';
import { and, desc, eq, gte, isNull, sql } from 'drizzle-orm';
import { getDb } from '@/lib/db';
import { eventRsvps, subscriptions, userProfiles, type EventRsvp } from '@/lib/db/schema';

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
 *  is preserved (we never overwrite on conflict).
 *
 *  `email` is the WorkOS email at RSVP time (F3.6) — stored so the ops roster
 *  and reminder cron work for Free members who have no `subscriptions` row. */
export async function rsvpToEvent(
  userId: string,
  eventId: number,
  attribution?: RsvpAttribution,
  email?: string | null,
): Promise<boolean> {
  const inserted = await getDb()
    .insert(eventRsvps)
    .values({
      userId,
      eventId,
      email: email?.trim().toLowerCase() || null,
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

// ── Ops roster / reminders ─────────────────────────────────────────────────

/** Best available email for an RSVP: the one captured at RSVP time, else the
 *  Stripe subscription email (rows that pre-date migration 0016, or the rare
 *  WorkOS user without an email). */
const rsvpEmail = sql<string | null>`coalesce(${eventRsvps.email}, ${subscriptions.email})`;

export interface RosterRow {
  eventId: number;
  userId: string;
  email: string | null;
  businessName: string | null;
  planTier: string | null;
  createdAt: Date;
  remindedAt: Date | null;
  source: string | null;
  utmMedium: string | null;
  utmCampaign: string | null;
  utmContent: string | null;
  ref: string | null;
}

/** Every RSVP (all events when `eventId` is omitted), newest first, joined to
 *  profile + subscription for the ops roster and the CSV export. */
export async function getRoster(eventId?: number): Promise<RosterRow[]> {
  const db = getDb();
  const base = db
    .select({
      eventId: eventRsvps.eventId,
      userId: eventRsvps.userId,
      email: rsvpEmail,
      businessName: userProfiles.businessName,
      planTier: subscriptions.planTier,
      createdAt: eventRsvps.createdAt,
      remindedAt: eventRsvps.remindedAt,
      source: eventRsvps.source,
      utmMedium: eventRsvps.utmMedium,
      utmCampaign: eventRsvps.utmCampaign,
      utmContent: eventRsvps.utmContent,
      ref: eventRsvps.ref,
    })
    .from(eventRsvps)
    .leftJoin(userProfiles, eq(userProfiles.userId, eventRsvps.userId))
    .leftJoin(subscriptions, eq(subscriptions.userId, eventRsvps.userId));
  const filtered = eventId === undefined ? base : base.where(eq(eventRsvps.eventId, eventId));
  return filtered.orderBy(desc(eventRsvps.createdAt));
}

/** RSVPs for an event that have not yet been sent a reminder, with the best
 *  available email (null when we have none — the cron skips those). */
export async function getUnremindedRsvps(
  eventId: number,
): Promise<Array<{ userId: string; email: string | null }>> {
  return getDb()
    .select({ userId: eventRsvps.userId, email: rsvpEmail })
    .from(eventRsvps)
    .leftJoin(subscriptions, eq(subscriptions.userId, eventRsvps.userId))
    .where(and(eq(eventRsvps.eventId, eventId), isNull(eventRsvps.remindedAt)));
}

/** Idempotency marker for the reminder cron. */
export async function markRsvpReminded(userId: string, eventId: number): Promise<void> {
  await getDb()
    .update(eventRsvps)
    .set({ remindedAt: new Date() })
    .where(and(eq(eventRsvps.userId, userId), eq(eventRsvps.eventId, eventId)));
}
