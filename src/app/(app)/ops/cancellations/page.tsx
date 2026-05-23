// Ops view of cancellations. Reason breakdown card at the top, then
// the table sorted newest-first. Joins to user_profiles for the
// business-name column.

import { desc, eq, sql } from 'drizzle-orm';
import { getDb } from '@/lib/db';
import { subscriptionCancellations, userProfiles } from '@/lib/db/schema';

export const dynamic = 'force-dynamic';

const REASON_LABELS: Record<string, string> = {
  'too-expensive': 'Too expensive',
  'not-using': "Not using enough",
  'missing-feature': 'Missing feature',
  'switching-provider': 'Switching provider',
  'business-closing': 'Business closing',
  'temporary-break': 'Temporary break',
  other: 'Other',
  '': 'No reason given',
};

export default async function OpsCancellationsPage() {
  const db = getDb();

  const [rows, breakdown] = await Promise.all([
    db
      .select({
        id: subscriptionCancellations.id,
        userId: subscriptionCancellations.userId,
        planTier: subscriptionCancellations.planTier,
        reason: subscriptionCancellations.reason,
        comment: subscriptionCancellations.comment,
        cancelAt: subscriptionCancellations.cancelAt,
        restoredAt: subscriptionCancellations.restoredAt,
        createdAt: subscriptionCancellations.createdAt,
        businessName: userProfiles.businessName,
      })
      .from(subscriptionCancellations)
      .leftJoin(userProfiles, eq(userProfiles.userId, subscriptionCancellations.userId))
      .orderBy(desc(subscriptionCancellations.createdAt))
      .limit(200),
    // Reason breakdown for the last 90 days. Excludes restored
    // cancellations so we measure "actually left" rather than "changed
    // their mind".
    db
      .select({
        reason: subscriptionCancellations.reason,
        c: sql<number>`count(*)::int`,
      })
      .from(subscriptionCancellations)
      .where(
        sql`${subscriptionCancellations.createdAt} > NOW() - INTERVAL '90 days'
            AND ${subscriptionCancellations.restoredAt} IS NULL`,
      )
      .groupBy(subscriptionCancellations.reason),
  ]);

  const totalActive = breakdown.reduce((sum, b) => sum + b.c, 0);
  const sortedBreakdown = [...breakdown].sort((a, b) => b.c - a.c);

  return (
    <>
      <div className="gh-ops-head-inner">
        <h1>Cancellations</h1>
        <p>
          {rows.length} logged row{rows.length === 1 ? '' : 's'} · {totalActive} active
          cancellations in the last 90 days (excludes restored).
        </p>
      </div>

      {totalActive > 0 && (
        <section className="gh-ops-section" style={{ marginBottom: 28 }}>
          <h2>Reasons — last 90 days</h2>
          <div className="gh-ops-reason-grid">
            {sortedBreakdown.map((b) => {
              const pct = totalActive > 0 ? Math.round((b.c / totalActive) * 100) : 0;
              return (
                <div className="gh-ops-reason-row" key={b.reason || '(blank)'}>
                  <span className="lbl">{REASON_LABELS[b.reason] ?? b.reason}</span>
                  <span className="bar">
                    <span style={{ width: `${pct}%` }} />
                  </span>
                  <span className="num">
                    {b.c} <em>({pct}%)</em>
                  </span>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {rows.length === 0 ? (
        <div className="gh-ops-empty">
          <p>No cancellations logged yet.</p>
        </div>
      ) : (
        <div className="gh-ops-table-wrap">
          <table className="gh-ops-table">
            <thead>
              <tr>
                <th>Logged</th>
                <th>Business</th>
                <th>Plan</th>
                <th>Reason</th>
                <th>Comment</th>
                <th>Access ends</th>
                <th>State</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id}>
                  <td>
                    {new Intl.DateTimeFormat('en-AU', {
                      dateStyle: 'medium',
                      timeStyle: 'short',
                    }).format(r.createdAt)}
                  </td>
                  <td>
                    <strong>{r.businessName ?? '—'}</strong>
                    <div className="gh-ops-meta" title={r.userId}>
                      {r.userId.slice(0, 14)}…
                    </div>
                  </td>
                  <td className="gh-ops-meta">{r.planTier ?? '—'}</td>
                  <td className="gh-ops-meta">
                    {REASON_LABELS[r.reason] ?? (r.reason || '—')}
                  </td>
                  <td
                    className="gh-ops-meta"
                    style={{ maxWidth: 280, whiteSpace: 'normal' }}
                    title={r.comment}
                  >
                    {r.comment || '—'}
                  </td>
                  <td className="gh-ops-meta">
                    {r.cancelAt
                      ? new Intl.DateTimeFormat('en-AU', { dateStyle: 'medium' }).format(r.cancelAt)
                      : '—'}
                  </td>
                  <td>
                    {r.restoredAt ? (
                      <span className="gh-ops-status status-active">Restored</span>
                    ) : (
                      <span className="gh-ops-status status-cancelled">Cancelling</span>
                    )}
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
