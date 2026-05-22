// Ops view of all service bookings. Filter by status via ?status=.
// Each row has inline status-update buttons that POST to /api/ops/bookings.

import Link from 'next/link';
import { desc, eq } from 'drizzle-orm';
import { getDb } from '@/lib/db';
import { serviceBookings, userProfiles } from '@/lib/db/schema';
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
  // Left-join to user_profiles so we can show a business name when known.
  // We keep the userId visible regardless — ops will recognise WorkOS ids.
  const rows = await db
    .select({
      id: serviceBookings.id,
      userId: serviceBookings.userId,
      serviceSlug: serviceBookings.serviceSlug,
      serviceTitle: serviceBookings.serviceTitle,
      status: serviceBookings.status,
      notes: serviceBookings.notes,
      datePreference: serviceBookings.datePreference,
      requestedAt: serviceBookings.requestedAt,
      scheduledAt: serviceBookings.scheduledAt,
      businessName: userProfiles.businessName,
    })
    .from(serviceBookings)
    .leftJoin(userProfiles, eq(userProfiles.userId, serviceBookings.userId))
    .where(status ? eq(serviceBookings.status, status) : undefined)
    .orderBy(desc(serviceBookings.requestedAt))
    .limit(200);

  return (
    <>
      <div className="gh-ops-head-inner">
        <h1>Service bookings</h1>
        <p>
          Triage requests, mark scheduled / in-progress / completed. {rows.length} row
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
                <th>Customer</th>
                <th>Date preference</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id}>
                  <td>
                    {new Intl.DateTimeFormat('en-AU', {
                      dateStyle: 'medium',
                      timeStyle: 'short',
                    }).format(r.requestedAt)}
                  </td>
                  <td>
                    <strong>{r.serviceTitle}</strong>
                    <div className="gh-ops-meta">{r.serviceSlug}</div>
                  </td>
                  <td>
                    <strong>{r.businessName ?? '—'}</strong>
                    <div className="gh-ops-meta" title={r.userId}>
                      {r.userId.slice(0, 14)}…
                    </div>
                  </td>
                  <td className="gh-ops-meta">{r.datePreference ?? '—'}</td>
                  <td>
                    <span className={`gh-ops-status status-${r.status}`}>
                      {r.status.replace('_', ' ')}
                    </span>
                  </td>
                  <td>
                    <BookingActions id={r.id} currentStatus={r.status as Status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
