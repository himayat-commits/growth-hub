// /ops/provisioning/[userId] — one onboarding run in full: header facts,
// re-run controls, the durable manual-handoff checklist and the complete
// provisioning_logs timeline. Server component; the two mutation surfaces
// (RerunButtons, TaskToggle) are small client islands.

import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { asc, eq } from 'drizzle-orm';
import { getOpsUser } from '@/lib/auth/ops';
import { getDb } from '@/lib/db';
import { provisioningLogs, subscriptions } from '@/lib/db/schema';
import { listTasksForUser } from '@/lib/db/provisioning-tasks';
import { isStaleRunning, loadOnboardingRow } from '@/lib/wizard/provisioning-store';
import TaskToggle from '../TaskToggle';
import RerunButtons from './RerunButtons';

export const dynamic = 'force-dynamic';

const fmt = (d: Date | string) =>
  new Intl.DateTimeFormat('en-AU', { dateStyle: 'medium', timeStyle: 'short' }).format(
    new Date(d),
  );

const preStyle: React.CSSProperties = {
  fontSize: 11,
  lineHeight: 1.5,
  background: 'rgba(13,63,72,0.04)',
  padding: 12,
  borderRadius: 8,
  overflowX: 'auto',
  margin: '8px 0 0',
  whiteSpace: 'pre-wrap',
  wordBreak: 'break-word',
};

type Params = Promise<{ userId: string }>;

export default async function OpsProvisioningDetailPage({ params }: { params: Params }) {
  const opsUser = await getOpsUser();
  if (!opsUser) redirect('/dashboard');

  const { userId } = await params;

  const row = await loadOnboardingRow(userId);
  if (!row) notFound();

  const db = getDb();
  const [tasks, logs, subRows] = await Promise.all([
    listTasksForUser(userId),
    db
      .select()
      .from(provisioningLogs)
      .where(eq(provisioningLogs.userId, userId))
      .orderBy(asc(provisioningLogs.createdAt)),
    db
      .select({ email: subscriptions.email, planTier: subscriptions.planTier })
      .from(subscriptions)
      .where(eq(subscriptions.userId, userId))
      .limit(1),
  ]);

  const { state, updatedAt } = row;
  const prov = state.provisioning;
  const freshRunning = prov.runStatus === 'running' && !isStaleRunning(state, updatedAt);
  const status =
    prov.runStatus === 'running'
      ? freshRunning
        ? 'running'
        : 'stalled'
      : prov.runStatus === 'provisioned' || prov.runStatus === 'partial' || prov.runStatus === 'failed'
        ? prov.runStatus
        : 'draft';

  const email = subRows[0]?.email ?? (state.adminUser.email || '—');
  const plan = subRows[0]?.planTier ?? state.packageId;
  const latestNotify = [...logs].reverse().find((l) => l.kind === 'notify_ops');
  const openTasks = tasks.filter((t) => t.status === 'open').length;

  return (
    <>
      <div style={{ padding: '0 0 12px' }}>
        <Link href="/ops/provisioning" className="gh-ops-meta" style={{ textDecoration: 'none' }}>
          ← Back to provisioning
        </Link>
      </div>

      <div className="gh-ops-head-inner">
        <h1>{state.business.name || email}</h1>
        <p>
          {email} · plan: {plan} · business #: {prov.businessNumber ?? '—'}
        </p>
      </div>

      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 14,
          flexWrap: 'wrap',
          marginBottom: 24,
        }}
      >
        <span className={`gh-ops-status status-${status}`}>{status}</span>
        <span className="gh-ops-meta">attempts: {prov.attempts ?? 0}</span>
        <span className="gh-ops-meta">last run by: {prov.lastRunBy ?? '—'}</span>
        <span className="gh-ops-meta">
          completed: {prov.completedAt ? fmt(prov.completedAt) : '—'}
        </span>
        {prov.escalatedAt && (
          <span className="gh-ops-meta">escalated: {fmt(prov.escalatedAt)}</span>
        )}
        <RerunButtons userId={userId} running={freshRunning} />
      </div>

      {latestNotify && !latestNotify.ok && (
        <div
          className="gh-ops-section"
          style={{ borderColor: 'var(--plum)', marginBottom: 28 }}
        >
          <p style={{ margin: 0, fontSize: 14, color: 'var(--plum)' }}>
            The latest ops handoff notification failed
            {latestNotify.error ? ` — ${latestNotify.error}` : ''}. The checklist below is
            still saved; use “Resend ops handoff” above to retry the email/webhook.
          </p>
        </div>
      )}

      <section className="gh-ops-section" style={{ marginBottom: 28 }}>
        <h2>
          Manual checklist{' '}
          <span className="gh-ops-meta">
            ({openTasks} open · {tasks.length - openTasks} done)
          </span>
        </h2>
        {tasks.length === 0 ? (
          <p className="gh-ops-meta" style={{ margin: 0 }}>
            No handoff tasks recorded for this user yet.
          </p>
        ) : (
          <div>
            {tasks.map((t, i) => (
              <div
                key={t.id}
                style={{
                  padding: '12px 0',
                  borderBottom: i < tasks.length - 1 ? '1px solid var(--rule)' : undefined,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                  <TaskToggle id={t.id} status={t.status} />
                  <strong style={{ fontSize: 13.5 }}>{t.label}</strong>
                  <span className={`gh-ops-status status-${t.status}`}>{t.status}</span>
                </div>
                <div className="gh-ops-meta" style={{ marginTop: 4 }}>
                  kind: {t.taskKind} · created {fmt(t.createdAt)}
                  {t.doneAt ? ` · done ${fmt(t.doneAt)} by ${t.doneBy ?? '—'}` : ''}
                </div>
                <details>
                  <summary className="gh-ops-meta" style={{ cursor: 'pointer', marginTop: 4 }}>
                    Snapshot
                  </summary>
                  <pre style={preStyle}>{JSON.stringify(t.snapshot, null, 2)}</pre>
                </details>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="gh-ops-section">
        <h2>Run timeline</h2>
        {logs.length === 0 ? (
          <p className="gh-ops-meta" style={{ margin: 0 }}>
            No provisioning API calls logged for this user yet.
          </p>
        ) : (
          <div className="gh-ops-table-wrap" style={{ marginTop: 12 }}>
            <table className="gh-ops-table" style={{ minWidth: 700 }}>
              <thead>
                <tr>
                  <th>When</th>
                  <th>Step</th>
                  <th>Kind</th>
                  <th>Result</th>
                  <th>Error</th>
                  <th>Detail</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((l) => (
                  <tr key={l.id}>
                    <td className="gh-ops-meta">{fmt(l.createdAt)}</td>
                    <td className="gh-ops-meta">{l.step}</td>
                    <td>{l.kind}</td>
                    <td>
                      <span className={`gh-ops-status status-${l.ok ? 'ok' : 'error'}`}>
                        {l.ok ? 'ok' : 'error'}
                      </span>
                    </td>
                    <td
                      className="gh-ops-meta"
                      style={{ maxWidth: 280, whiteSpace: 'normal' }}
                      title={l.error ?? undefined}
                    >
                      {l.error ?? '—'}
                    </td>
                    <td>
                      <details>
                        <summary className="gh-ops-meta" style={{ cursor: 'pointer' }}>
                          payload / response
                        </summary>
                        <pre style={preStyle}>
                          {JSON.stringify({ payload: l.payload, response: l.response }, null, 2)}
                        </pre>
                      </details>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </>
  );
}
