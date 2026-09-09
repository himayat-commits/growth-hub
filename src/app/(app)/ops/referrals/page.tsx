// Ops view of all referrals. Filter by status via ?status=.
// Funnel tiles up top: pending → qualified → credited, plus the A$ total
// currently held as pending credit for Free members.

import Link from 'next/link';
import { desc, eq } from 'drizzle-orm';
import { getDb } from '@/lib/db';
import { referrals, userProfiles } from '@/lib/db/schema';
import { getOpsUser } from '@/lib/auth/ops';
import { getReferralFunnel } from '@/lib/db/referrals';
import ReferralActions from './ReferralActions';

export const dynamic = 'force-dynamic';

const STATUS_ORDER = ['pending', 'qualified', 'credited', 'declined'] as const;
type Status = (typeof STATUS_ORDER)[number];

type Params = Promise<{ status?: string }>;

const aud = (cents: number) => `A$${(cents / 100).toFixed(cents % 100 === 0 ? 0 : 2)}`;

// Per-side credit state → short label for the table.
const SIDE_LABEL: Record<string, string> = {
  none: '—',
  stripe: 'Stripe',
  pending: 'held',
  applied: 'applied',
};

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

  const opsUser = await getOpsUser();
  const isAdmin = opsUser?.role === 'admin';

  const db = getDb();
  const [rows, funnel] = await Promise.all([
    db
      .select({
        id: referrals.id,
        referrerUserId: referrals.referrerUserId,
        referredUserId: referrals.referredUserId,
        referCode: referrals.referCode,
        status: referrals.status,
        creditedAmountCents: referrals.creditedAmountCents,
        referrerCreditState: referrals.referrerCreditState,
        referredCreditState: referrals.referredCreditState,
        createdAt: referrals.createdAt,
        qualifiedAt: referrals.qualifiedAt,
        creditedAt: referrals.creditedAt,
        referrerBiz: userProfiles.businessName,
      })
      .from(referrals)
      .leftJoin(userProfiles, eq(userProfiles.userId, referrals.referrerUserId))
      .where(status ? eq(referrals.status, status) : undefined)
      .orderBy(desc(referrals.createdAt))
      .limit(200),
    getReferralFunnel(),
  ]);

  const tiles: Array<{ label: string; num: string; sub: string; href: string; tone?: 'attention' | 'good' }> = [
    {
      label: 'Pending',
      num: funnel.pending.toLocaleString(),
      sub: 'Signed up, Growth Call not yet completed',
      href: '/ops/referrals?status=pending',
    },
    {
      label: 'Qualified',
      num: funnel.qualified.toLocaleString(),
      sub: 'Call completed — credits not yet issued',
      href: '/ops/referrals?status=qualified',
      tone: funnel.qualified > 0 ? 'attention' : undefined,
    },
    {
      label: 'Credited',
      num: funnel.credited.toLocaleString(),
      sub: `${funnel.declined} declined`,
      href: '/ops/referrals?status=credited',
      tone: 'good',
    },
    {
      label: 'Held credit',
      num: aud(funnel.heldCreditCents),
      sub: 'Owed to Free members; posts to Stripe when they subscribe',
      href: '/ops/referrals',
    },
  ];

  return (
    <>
      <div className="gh-ops-head-inner">
        <h1>Referrals</h1>
        <p>
          Referral attribution + credit. {rows.length} row{rows.length === 1 ? '' : 's'}{' '}
          {status ? `(filtered: ${status})` : ''}.
        </p>
      </div>

      <div className="gh-ops-tiles">
        {tiles.map((t) => (
          <Link key={t.label} href={t.href} className={`gh-ops-tile ${t.tone ?? ''}`}>
            <span className="lbl">{t.label}</span>
            <span className="num">{t.num}</span>
            <span className="sub">{t.sub}</span>
          </Link>
        ))}
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
                <th>Sides</th>
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
                    {r.creditedAmountCents > 0 ? `${aud(r.creditedAmountCents)} each` : '—'}
                  </td>
                  <td
                    className="gh-ops-meta"
                    title="referrer / referred — Stripe = on their balance, held = pending until they subscribe"
                  >
                    {SIDE_LABEL[r.referrerCreditState] ?? r.referrerCreditState} /{' '}
                    {SIDE_LABEL[r.referredCreditState] ?? r.referredCreditState}
                  </td>
                  <td>
                    <ReferralActions id={r.id} currentStatus={r.status as Status} canEdit={isAdmin} />
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
