// Recent signups — user_profiles joined with subscriptions so ops sees
// who's on free vs paid + when they joined + how complete their profile is.
// Now also shows the assigned strategist + lets ops reassign inline.

import { desc, eq } from 'drizzle-orm';
import { getDb } from '@/lib/db';
import { userProfiles, subscriptions } from '@/lib/db/schema';
import { getActiveStrategists } from '@/lib/cms';
import { getOpsUser } from '@/lib/auth/ops';
import AssignStrategist, { type StrategistOption } from './AssignStrategist';

export const dynamic = 'force-dynamic';

export default async function OpsSignupsPage() {
  const opsUser = await getOpsUser();
  const isAdmin = opsUser?.role === 'admin';

  const db = getDb();
  const [rows, strategists] = await Promise.all([
    db
      .select({
        userId: userProfiles.userId,
        businessName: userProfiles.businessName,
        stage: userProfiles.stage,
        industry: userProfiles.industry,
        city: userProfiles.city,
        profileCompletePct: userProfiles.profileCompletePct,
        referCode: userProfiles.referCode,
        assignedStrategistId: userProfiles.assignedStrategistId,
        createdAt: userProfiles.createdAt,
        email: subscriptions.email,
        planTier: subscriptions.planTier,
        subscriptionStatus: subscriptions.subscriptionStatus,
      })
      .from(userProfiles)
      .leftJoin(subscriptions, eq(subscriptions.userId, userProfiles.userId))
      .orderBy(desc(userProfiles.createdAt))
      .limit(200),
    getActiveStrategists(),
  ]);

  const options: StrategistOption[] = strategists
    .map((s) => ({
      slug: (s as { slug?: string | null }).slug ?? '',
      name: (s as { name?: string | null }).name ?? '',
    }))
    .filter((o) => o.slug && o.name);

  return (
    <>
      <div className="gh-ops-head-inner">
        <h1>Recent signups</h1>
        <p>
          Most recent 200 user profiles joined with their subscription state. Sorted by signup
          date (newest first).
        </p>
      </div>

      {rows.length === 0 ? (
        <div className="gh-ops-empty">
          <p>No signups yet.</p>
        </div>
      ) : (
        <div className="gh-ops-table-wrap">
          <table className="gh-ops-table">
            <thead>
              <tr>
                <th>Signed up</th>
                <th>Business</th>
                <th>Email</th>
                <th>Stage</th>
                <th>City</th>
                <th>Profile</th>
                <th>Plan</th>
                <th>Strategist</th>
                <th>Ref code</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.userId}>
                  <td>
                    {new Intl.DateTimeFormat('en-AU', { dateStyle: 'medium' }).format(r.createdAt)}
                  </td>
                  <td>
                    <strong>{r.businessName ?? '—'}</strong>
                    <div className="gh-ops-meta" title={r.userId}>
                      {r.userId.slice(0, 14)}…
                    </div>
                  </td>
                  <td className="gh-ops-meta">{r.email ?? '—'}</td>
                  <td className="gh-ops-meta">{r.stage ?? '—'}</td>
                  <td className="gh-ops-meta">{r.city ?? '—'}</td>
                  <td>
                    <span className="gh-ops-progress" aria-label={`${r.profileCompletePct}% complete`}>
                      <span style={{ width: `${r.profileCompletePct}%` }} />
                      <em>{r.profileCompletePct}%</em>
                    </span>
                  </td>
                  <td>
                    {r.planTier ? (
                      <span className={`gh-ops-status status-${r.subscriptionStatus ?? 'active'}`}>
                        {r.planTier}
                        {r.subscriptionStatus && r.subscriptionStatus !== 'active'
                          ? ` · ${r.subscriptionStatus}`
                          : ''}
                      </span>
                    ) : (
                      <span className="gh-ops-meta">free</span>
                    )}
                  </td>
                  <td>
                    <AssignStrategist
                      userId={r.userId}
                      currentSlug={r.assignedStrategistId}
                      options={options}
                      canEdit={isAdmin}
                    />
                  </td>
                  <td className="gh-ops-meta">{r.referCode ?? '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
