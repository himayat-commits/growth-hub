// /ops/events — event attendee roster.
//
// Lists every event that has at least one RSVP, with the members who RSVP'd
// (business name, email, plan) and the marketing attribution captured at RSVP
// time. Read-only. This is the prerequisite for event-recap sends and capacity
// decisions, and it finally surfaces the attribution data the RSVP API records.
//
// Member RSVPs only — public `mailto:` RSVPs bypass the DB and aren't tracked.

import type { Metadata } from 'next';
import { desc, eq } from 'drizzle-orm';
import { getDb } from '@/lib/db';
import { eventRsvps, userProfiles, subscriptions } from '@/lib/db/schema';
import { getPublicEvents } from '@/lib/cms';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Event RSVPs — Ops',
  robots: { index: false, follow: false },
};

interface Attendee {
  userId: string;
  businessName: string | null;
  email: string | null;
  planTier: string | null;
  createdAt: Date;
  source: string | null;
  utmCampaign: string | null;
  ref: string | null;
}

function fmtDate(d: Date | string | null): string {
  if (!d) return '—';
  return new Intl.DateTimeFormat('en-AU', { dateStyle: 'medium' }).format(new Date(d));
}

export default async function OpsEventsPage() {
  const db = getDb();
  const [rsvps, events] = await Promise.all([
    db
      .select({
        eventId: eventRsvps.eventId,
        userId: eventRsvps.userId,
        createdAt: eventRsvps.createdAt,
        source: eventRsvps.source,
        utmCampaign: eventRsvps.utmCampaign,
        ref: eventRsvps.ref,
        businessName: userProfiles.businessName,
        email: subscriptions.email,
        planTier: subscriptions.planTier,
      })
      .from(eventRsvps)
      .leftJoin(userProfiles, eq(userProfiles.userId, eventRsvps.userId))
      .leftJoin(subscriptions, eq(subscriptions.userId, eventRsvps.userId))
      .orderBy(desc(eventRsvps.createdAt)),
    getPublicEvents(),
  ]);

  // Event id → title/date, for labelling each roster group. getPublicEvents
  // returns Payload's typed Event[], so we read fields directly.
  const eventMeta = new Map<number, { title: string; date: string | null }>();
  for (const e of events) {
    const id = Number(e.id);
    if (!Number.isFinite(id)) continue;
    eventMeta.set(id, {
      title: e.title || `Event #${id}`,
      date: e.date ?? null,
    });
  }

  // Group RSVPs by event (rows already sorted newest-RSVP-first).
  const byEvent = new Map<number, Attendee[]>();
  for (const r of rsvps) {
    const list = byEvent.get(r.eventId) ?? [];
    list.push(r);
    byEvent.set(r.eventId, list);
  }

  // One group per event that has RSVPs, ordered by event date (newest first;
  // unknown/deleted-event dates sort last).
  const groups = Array.from(byEvent.entries())
    .map(([eventId, attendees]) => {
      const meta = eventMeta.get(eventId);
      return {
        eventId,
        title: meta?.title ?? `Unknown event #${eventId}`,
        date: meta?.date ?? null,
        attendees,
      };
    })
    .sort((a, b) => {
      const ta = a.date ? new Date(a.date).getTime() : 0;
      const tb = b.date ? new Date(b.date).getTime() : 0;
      return tb - ta;
    });

  const totalRsvps = rsvps.length;
  const distinctMembers = new Set(rsvps.map((r) => r.userId)).size;

  return (
    <>
      <div className="gh-ops-head-inner">
        <h1>Event RSVPs</h1>
        <p>
          {totalRsvps} RSVP{totalRsvps === 1 ? '' : 's'} from {distinctMembers} member
          {distinctMembers === 1 ? '' : 's'} across {groups.length} event
          {groups.length === 1 ? '' : 's'}. Member RSVPs only — public mailto RSVPs aren’t tracked here.
        </p>
      </div>

      {groups.length === 0 ? (
        <div className="gh-ops-empty">
          <p>No RSVPs yet.</p>
        </div>
      ) : (
        groups.map((g) => (
          <div key={g.eventId} style={{ marginBottom: 28 }}>
            <div className="gh-ops-head-inner" style={{ marginBottom: 8 }}>
              <h2 style={{ fontSize: 16 }}>
                {g.title}
                <span className="gh-ops-meta" style={{ marginLeft: 10, fontWeight: 400 }}>
                  {fmtDate(g.date)} · {g.attendees.length} attendee
                  {g.attendees.length === 1 ? '' : 's'}
                </span>
              </h2>
            </div>
            <div className="gh-ops-table-wrap">
              <table className="gh-ops-table">
                <thead>
                  <tr>
                    <th>Business</th>
                    <th>Email</th>
                    <th>Plan</th>
                    <th>RSVP’d</th>
                    <th>Source</th>
                  </tr>
                </thead>
                <tbody>
                  {g.attendees.map((a) => (
                    <tr key={`${g.eventId}-${a.userId}`}>
                      <td>
                        <strong>{a.businessName ?? '—'}</strong>
                        <div className="gh-ops-meta" title={a.userId}>
                          {a.userId.slice(0, 14)}…
                        </div>
                      </td>
                      <td className="gh-ops-meta">{a.email ?? '—'}</td>
                      <td className="gh-ops-meta">{a.planTier ?? 'free'}</td>
                      <td className="gh-ops-meta">{fmtDate(a.createdAt)}</td>
                      <td className="gh-ops-meta">
                        {[a.source, a.utmCampaign, a.ref].filter(Boolean).join(' · ') || '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ))
      )}
    </>
  );
}
