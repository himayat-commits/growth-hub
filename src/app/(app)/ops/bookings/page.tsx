// Ops view of all service bookings. Filter by status via ?status=.
// Each row shows the triage intake (need, preferred slots, plan, profile
// signals) and links to the member 360; inline actions PATCH
// /api/ops/bookings/[id].

import Link from 'next/link';
import { desc, eq } from 'drizzle-orm';
import { getDb } from '@/lib/db';
import { serviceBookings, subscriptions, userProfiles } from '@/lib/db/schema';
import { needLabel, parseSlots, formatSlot } from '@/lib/advisory/needs';
import BookingActions from './BookingActions';

export const dynamic = 'force-dynamic';

const STATUS_ORDER = ['requested', 'scheduled', 'in_progress', 'completed', 'cancelled'] as const;
type Status = (typeof STATUS_ORDER)[number];

type Params = Promise<{ status?: string }>;

export default async function OpsBookingsPage({
  searchParams,
}: {
  searchParams: Params;
}) {
  const { status: rawStatus } = await searchParams;
  const status =
    rawStatus && (STATUS_ORDER as readonly string[]).includes(rawStatus)
      ? (rawStatus as Status)
      : null;

  const db = getDb();
  // Left-join profile + subscription so the adviser sees who they're
  // talking to without opening three pages (F4.3). Free members have no
  // subscriptions row — email falls back to the WorkOS id in that case.
  const rows = await db
    .select({
      id: serviceBookings.id,
      userId: serviceBookings.userId,
      serviceSlug: serviceBookings.serviceSlug,
      serviceTitle: serviceBookings.serviceTitle,
      status: serviceBookings.status,
      notes: serviceBookings.notes,
      datePreference: serviceBookings.datePreference,
      need: serviceBookings.need,
      preferredSlots: serviceBookings.preferredSlots,
      preSessionNotes: serviceBookings.preSessionNotes,
      outcome: serviceBookings.outcome,
      nextStep: serviceBookings.nextStep,
      strategistSlug: serviceBookings.strategistSlug,
      statusChangedBy: serviceBookings.statusChangedBy,
      requestedAt: serviceBookings.requestedAt,
      scheduledAt: serviceBookings.scheduledAt,
      businessName: userProfiles.businessName,
      stage: userProfiles.stage,
      industry: userProfiles.industry,
      helpAreas: userProfiles.helpAreas,
      email: subscriptions.email,
      planTier: subscriptions.planTier,
      subscriptionStatus: subscriptions.subscriptionStatus,
    })
    .from(serviceBookings)
    .leftJoin(userProfiles, eq(userProfiles.userId, serviceBookings.userId))
    .leftJoin(subscriptions, eq(subscriptions.userId, serviceBookings.userId))
    .where(status ? eq(serviceBookings.status, status) : undefined)
    .orderBy(desc(serviceBookings.requestedAt))
    .limit(200);

  const fmt = new Intl.DateTimeFormat('en-AU', { dateStyle: 'medium', timeStyle: 'short' });

  return (
    <>
      <div className="gh-ops-head-inner">
        <h1>Service bookings</h1>
        <p>
          Triage requests: schedule, complete with an outcome, or cancel. {rows.length} row
          {rows.length === 1 ? '' : 's'} {status ? `(filtered: ${status})` : ''}.
        </p>
      </div>

      <div className="gh-ops-filterbar">
        <Link href="/ops/bookings" className={'gh-ops-pill' + (!status ? ' is-on' : '')}>
          All
        </Link>
        {STATUS_ORDER.map((s) => (
          <Link
            key={s}
            href={`/ops/bookings?status=${s}`}
            className={'gh-ops-pill' + (status === s ? ' is-on' : '')}
          >
            {s.replace('_', ' ')}
          </Link>
        ))}
      </div>

      {rows.length === 0 ? (
        <div className="gh-ops-empty">
          <p>No bookings {status ? `with status "${status}"` : 'yet'}.</p>
        </div>
      ) : (
        <div className="gh-ops-table-wrap">
          <table className="gh-ops-table">
            <thead>
              <tr>
                <th>Requested</th>
                <th>Service</th>
                <th>Member</th>
                <th>Need &amp; availability</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => {
                const slots = parseSlots(r.preferredSlots);
                const plan =
                  r.planTier && (r.subscriptionStatus === 'active' || r.subscriptionStatus === 'trialing')
                    ? r.planTier
                    : 'free';
                return (
                  <tr key={r.id}>
                    <td>
                      {fmt.format(r.requestedAt)}
                      {r.scheduledAt && (
                        <div className="gh-ops-meta">scheduled {fmt.format(r.scheduledAt)}</div>
                      )}
                    </td>
                    <td>
                      <strong>{r.serviceTitle}</strong>
                      <div className="gh-ops-meta">
                        {r.serviceSlug} · #{r.id}
                        {r.strategistSlug ? ` · ${r.strategistSlug}` : ''}
                      </div>
                    </td>
                    <td>
                      <Link href={`/ops/members/${encodeURIComponent(r.userId)}`}>
                        <strong>{r.businessName ?? r.email ?? r.userId.slice(0, 14) + '…'}</strong>
                      </Link>
                      <div className="gh-ops-meta" title={r.userId}>
                        {r.email ?? 'free member (no billing email)'} · {plan}
                      </div>
                      <div className="gh-ops-meta">
                        {[r.stage, r.industry].filter(Boolean).join(' · ') || 'profile incomplete'}
                        {r.helpAreas?.length ? ` · ${r.helpAreas.join(', ')}` : ''}
                      </div>
                    </td>
                    <td>
                      <div>{needLabel(r.need)}</div>
                      {slots.length > 0 ? (
                        <ul className="gh-ops-meta" style={{ margin: '4px 0 0', paddingLeft: 14 }}>
                          {slots.map((s, i) => (
                            <li key={i}>{formatSlot(s)}</li>
                          ))}
                        </ul>
                      ) : (
                        <div className="gh-ops-meta">{r.datePreference ?? 'no availability given'}</div>
                      )}
                      {r.notes && (
                        <div className="gh-ops-meta" style={{ marginTop: 4, whiteSpace: 'pre-wrap' }}>
                          “{r.notes.length > 160 ? r.notes.slice(0, 160) + '…' : r.notes}”
                        </div>
                      )}
                    </td>
                    <td>
                      <span className={`gh-ops-status status-${r.status}`}>
                        {r.status.replace('_', ' ')}
                      </span>
                      {r.statusChangedBy && (
                        <div className="gh-ops-meta" style={{ marginTop: 4 }}>
                          by {r.statusChangedBy}
                        </div>
                      )}
                    </td>
                    <td>
                      <BookingActions
                        id={r.id}
                        currentStatus={r.status as Status}
                        preSessionNotes={r.preSessionNotes}
                        outcome={r.outcome}
                        nextStep={r.nextStep}
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
