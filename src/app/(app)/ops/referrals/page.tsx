// Ops view of all referrals. Filter by status via ?status=.

import Link from 'next/link';
import { desc, eq } from 'drizzle-orm';
import { getDb } from '@/lib/db';
import { referrals, userProfiles } from '@/lib/db/schema';
import ReferralActions from './ReferralActions';

export const dynamic = 'force-dynamic';

const STATUS_ORDER = ['pending', 'qualified', 'credited', 'declined'] as const;
type Status = (typeof STATUS_ORDER)[number];

type Params = Promise<{ status?: string }>;

export default async function OpsReferralsPage({
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
  const rows = await db
    .select({
      id: referrals.id,
      referrerUserId: referrals.referrerUserId,
      referredUserId: referrals.referredUserId,
      referCode: referrals.referCode,
      status: referrals.status,
      creditedAmountCents: referrals.creditedAmountCents,
      createdAt: referrals.createdAt,
      qualifiedAt: referrals.qualifiedAt,
      creditedAt: referrals.creditedAt,
      referrerBiz: userProfiles.businessName,
    })
    .from(referrals)
    .leftJoin(userProfiles, eq(userProfiles.userId, referrals.referrerUserId))
    .where(status ? eq(referrals.status, status) : undefined)
    .orderBy(desc(referrals.createdAt))
    .limit(200);

  return (
    <>
      <div className="gh-ops-head-inner">
        <h1>Referrals</h1>
        <p>
          Referral attribution + credit. {rows.length} row{rows.length === 1 ? '' : 's'}{' '}
          {status ? `(filtered: ${status})` : ''}.
        </p>
      </div>

      <div className="gh-ops-filterbar">
        <Link href="/ops/referrals" className={'gh-ops-pill' + (!status ? ' is-on' : '')}>
          All
        </Link>
        {STATUS_ORDER.map((s) => (
          <Link
            key={s}
            href={`/ops/referrals?status=${s}`}
            className={'gh-ops-pill' + (status === s ? ' is-on' : '')}
          >
            {s}
          </Link>
        ))}
      </div>

      {rows.length === 0 ? (
        <div className="gh-ops-empty">
          <p>No referrals {status ? `with status "${status}"` : 'yet'}.</p>
        </div>
      ) : (
        <div className="gh-ops-table-wrap">
          <table className="gh-ops-table">
            <thead>
              <tr>
                <th>Created</th>
                <th>Referrer</th>
                <th>Referred user</th>
                <th>Code</th>
                <th>Status</th>
                <th>Credit</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id}>
                  <td>
                    {new Intl.DateTimeFormat('en-AU', { dateStyle: 'medium' }).format(r.createdAt)}
                  </td>
                  <td>
                    <strong>{r.referrerBiz ?? '—'}</strong>
                    <div className="gh-ops-meta" title={r.referrerUserId}>
                      {r.referrerUserId.slice(0, 14)}…
                    </div>
                  </td>
                  <td className="gh-ops-meta" title={r.referredUserId}>
                    {r.referredUserId.slice(0, 14)}…
                  </td>
                  <td className="gh-ops-meta">{r.referCode}</td>
                  <td>
                    <span className={`gh-ops-status status-${r.status}`}>{r.status}</span>
                  </td>
                  <td className="gh-ops-meta">
                    {r.creditedAmountCents > 0
                      ? `A$${(r.creditedAmountCents / 100).toFixed(2)}`
                      : '—'}
                  </td>
                  <td>
                    <ReferralActions id={r.id} currentStatus={r.status as Status} />
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
