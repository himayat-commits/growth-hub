// /ops/provisioning — every onboarding run at a glance. JSONB projections
// only (never the full state blob per row), joined to subscriptions for
// email/plan. Rows link through to the per-user detail view.

import Link from 'next/link';
import { redirect } from 'next/navigation';
import { count, desc, eq, sql } from 'drizzle-orm';
import { getOpsUser } from '@/lib/auth/ops';
import { getDb } from '@/lib/db';
import { onboardingStates, provisioningTasks, subscriptions } from '@/lib/db/schema';
import { countOpenTasksByUser } from '@/lib/db/provisioning-tasks';
import { STALE_RUNNING_MS } from '@/lib/wizard/provisioning-store';

export const dynamic = 'force-dynamic';

type DisplayStatus = 'provisioned' | 'partial' | 'failed' | 'running' | 'stalled' | 'draft';

// 'running' is only trusted while the row's updatedAt is fresh — a run
// bumps it on every step, so a stale one means the function died mid-run.
function displayStatus(runStatus: string | null, updatedAt: Date): DisplayStatus {
  if (runStatus === 'running') {
    return updatedAt.getTime() < Date.now() - STALE_RUNNING_MS ? 'stalled' : 'running';
  }
  if (runStatus === 'provisioned' || runStatus === 'partial' || runStatus === 'failed') {
    return runStatus;
  }
  return 'draft';
}

export default async function OpsProvisioningPage() {
  const opsUser = await getOpsUser();
  if (!opsUser) redirect('/dashboard');

  const db = getDb();
  const [rows, openTasks, partialRuns, stalledRuns, notifyFailedRes] = await Promise.all([
    db
      .select({
        userId: onboardingStates.userId,
        updatedAt: onboardingStates.updatedAt,
        businessName: sql<string | null>`${onboardingStates.state}->'business'->>'name'`,
        runStatus: sql<string | null>`${onboardingStates.state}->'provisioning'->>'runStatus'`,
        businessNumber: sql<string | null>`${onboardingStates.state}->'provisioning'->>'businessNumber'`,
        attempts: sql<number | null>`(${onboardingStates.state}->'provisioning'->>'attempts')::int`,
        lastRunBy: sql<string | null>`${onboardingStates.state}->'provisioning'->>'lastRunBy'`,
        email: subscriptions.email,
        planTier: subscriptions.planTier,
      })
      .from(onboardingStates)
      .leftJoin(subscriptions, eq(subscriptions.userId, onboardingStates.userId))
      .orderBy(desc(onboardingStates.updatedAt))
      .limit(200),
    db.select({ c: count() }).from(provisioningTasks).where(eq(provisioningTasks.status, 'open')),
    db.select({ c: count() }).from(onboardingStates).where(
      sql`${onboardingStates.state}->'provisioning'->>'runStatus' = 'partial'`,
    ),
    db.select({ c: count() }).from(onboardingStates).where(
      sql`${onboardingStates.state}->'provisioning'->>'runStatus' = 'running'
          AND ${onboardingStates.updatedAt} < NOW() - INTERVAL '10 minutes'`,
    ),
    // Users whose LATEST notify_ops attempt failed — the handoff email/webhook
    // never landed, so the checklist below is the only trace of the work.
    db.execute(sql`
      SELECT count(*)::int AS c FROM (
        SELECT DISTINCT ON (user_id) ok
        FROM provisioning_logs
        WHERE kind = 'notify_ops'
        ORDER BY user_id, created_at DESC
      ) latest
      WHERE latest.ok = false
    `),
  ]);

  const openByUser = await countOpenTasksByUser(rows.map((r) => r.userId));
  const notifyFailed = Number((notifyFailedRes.rows[0] as { c?: number } | undefined)?.c ?? 0);

  const tiles: Array<{ label: string; num: number; sub: string }> = [
    {
      label: 'Open handoff tasks',
      num: openTasks[0]?.c ?? 0,
      sub: 'Manual steps waiting on ops',
    },
    {
      label: 'Partial runs',
      num: partialRuns[0]?.c ?? 0,
      sub: 'Account exists, some steps failed',
    },
    {
      label: 'Stalled runs',
      num: stalledRuns[0]?.c ?? 0,
      sub: 'Running >10 min with no progress',
    },
    {
      label: 'Handoff notify failures',
      num: notifyFailed,
      sub: 'Latest notify_ops attempt failed',
    },
  ];

  return (
    <>
      <div className="gh-ops-head-inner">
        <h1>Provisioning</h1>
        <p>
          Most recent 200 onboarding runs, newest activity first. Click a business for the
          handoff checklist, run timeline and re-run controls.
        </p>
      </div>

      <div className="gh-ops-tiles">
        {tiles.map((t) => (
          <div key={t.label} className={`gh-ops-tile ${t.num > 0 ? 'attention' : ''}`}>
            <span className="lbl">{t.label}</span>
            <span className="num">{t.num.toLocaleString()}</span>
            <span className="sub">{t.sub}</span>
          </div>
        ))}
      </div>

      {rows.length === 0 ? (
        <div className="gh-ops-empty">
          <p>No onboarding runs yet.</p>
        </div>
      ) : (
        <div className="gh-ops-table-wrap">
          <table className="gh-ops-table">
            <thead>
              <tr>
                <th>Updated</th>
                <th>Business</th>
                <th>Email</th>
                <th>Plan</th>
                <th>Status</th>
                <th>Business #</th>
                <th>Attempts</th>
                <th>Last run by</th>
                <th>Open tasks</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => {
                const status = displayStatus(r.runStatus, r.updatedAt);
                const open = openByUser[r.userId] ?? 0;
                return (
                  <tr key={r.userId}>
                    <td>
                      {new Intl.DateTimeFormat('en-AU', {
                        dateStyle: 'medium',
                        timeStyle: 'short',
                      }).format(r.updatedAt)}
                    </td>
                    <td>
                      <Link href={`/ops/provisioning/${encodeURIComponent(r.userId)}`}>
                        <strong>{r.businessName || '—'}</strong>
                      </Link>
                      <div className="gh-ops-meta" title={r.userId}>
                        {r.userId.slice(0, 14)}…
                      </div>
                    </td>
                    <td className="gh-ops-meta">{r.email ?? '—'}</td>
                    <td className="gh-ops-meta">{r.planTier ?? '—'}</td>
                    <td>
                      <span className={`gh-ops-status status-${status}`}>{status}</span>
                    </td>
                    <td className="gh-ops-meta">{r.businessNumber ?? '—'}</td>
                    <td className="gh-ops-meta">{r.attempts ?? 0}</td>
                    <td className="gh-ops-meta">{r.lastRunBy ?? '—'}</td>
                    <td>
                      {open > 0 ? (
                        <span className="gh-ops-status status-open">{open} open</span>
                      ) : (
                        <span className="gh-ops-meta">—</span>
                      )}
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
