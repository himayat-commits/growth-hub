// /ops/inbox — strategist inbox: list of assigned members with last-message preview.
// Strategists see only their users. Unrecognised ops users see everyone.
// ?filter=unanswered narrows to threads where the last message is from the
// member (fromTeam=false) and is older than 24 h.

import Link from 'next/link';
import { redirect } from 'next/navigation';
import { desc, eq, sql } from 'drizzle-orm';
import { getOpsUser } from '@/lib/auth/ops';
import { getOpsStrategistSlug } from '@/lib/auth/ops-inbox';
import { getDb } from '@/lib/db';
import { userProfiles, subscriptions } from '@/lib/db/schema';

export const dynamic = 'force-dynamic';

const UNANSWERED_HOURS = 24;

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export default async function OpsInboxPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const opsUser = await getOpsUser();
  if (!opsUser) redirect('/dashboard');

  const sp = await searchParams;
  const filterUnanswered = sp.filter === 'unanswered';

  // Resolve the ops user's strategist slug (if any) so we can scope the list.
  // Same helper the thread view + reply API use to enforce access.
  const mySlug = await getOpsStrategistSlug(opsUser.email);

  const db = getDb();

  // 1. Fetch members assigned to this strategist (or all if unrecognised ops).
  const memberRows = await db
    .select({
      userId: userProfiles.userId,
      businessName: userProfiles.businessName,
      assignedStrategistId: userProfiles.assignedStrategistId,
      email: subscriptions.email,
      planTier: subscriptions.planTier,
      subscriptionStatus: subscriptions.subscriptionStatus,
    })
    .from(userProfiles)
    .leftJoin(subscriptions, eq(subscriptions.userId, userProfiles.userId))
    .where(mySlug ? eq(userProfiles.assignedStrategistId, mySlug) : undefined)
    .orderBy(desc(userProfiles.createdAt))
    .limit(500);

  if (memberRows.length === 0) {
    return (
      <div className="gh-ops-inbox-wrap">
        <div className="gh-ops-head-inner">
          <h1>Inbox</h1>
          <p>No members assigned to you yet.</p>
        </div>
      </div>
    );
  }

  // 2. Fetch the last message per member using DISTINCT ON.
  // Raw SQL — Drizzle doesn't expose DISTINCT ON in the select builder.
  const userIds = memberRows.map((r) => r.userId);

  type LastMsgRow = {
    userId: string;
    fromTeam: boolean;
    body: string;
    createdAt: Date;
  };

  const lastMsgResult = await db.execute<LastMsgRow>(sql`
    SELECT DISTINCT ON (user_id) user_id AS "userId", from_team AS "fromTeam",
           body, created_at AS "createdAt"
    FROM   messages
    WHERE  user_id = ANY(ARRAY[${sql.join(userIds.map((id) => sql`${id}`), sql`, `)}])
    ORDER  BY user_id, created_at DESC
  `);

  // Build a map for O(1) lookup.
  const lastMsg: Record<string, LastMsgRow> = {};
  for (const row of lastMsgResult.rows) {
    lastMsg[row.userId] = row;
  }

  // eslint-disable-next-line react-hooks/purity
  const now = Date.now();
  const unansweredMs = UNANSWERED_HOURS * 60 * 60 * 1000;

  // Compute per-row flags.
  type MemberItem = (typeof memberRows)[number] & {
    lastMsg: LastMsgRow | undefined;
    isUnanswered: boolean;
  };

  const items: MemberItem[] = memberRows.map((r) => {
    const lm = lastMsg[r.userId];
    const isUnanswered =
      !!lm &&
      !lm.fromTeam &&
      now - new Date(lm.createdAt).getTime() > unansweredMs;
    return { ...r, lastMsg: lm, isUnanswered };
  });

  // 3. Apply filter.
  const visible = filterUnanswered ? items.filter((r) => r.isUnanswered) : items;
  const unansweredCount = items.filter((r) => r.isUnanswered).length;

  return (
    <div className="gh-ops-inbox-wrap">
      <div className="gh-ops-head-inner">
        <h1>Inbox</h1>
        <p>
          {mySlug
            ? `Messages from your ${memberRows.length} assigned member${memberRows.length !== 1 ? 's' : ''}.`
            : `All member threads — ${memberRows.length} member${memberRows.length !== 1 ? 's' : ''}.`}
        </p>
      </div>

      {/* Filter chips */}
      <div className="gh-ops-inbox-chips">
        <Link
          href="/ops/inbox"
          className={`gh-ops-chip${!filterUnanswered ? ' is-on' : ''}`}
        >
          All
          <span className="gh-ops-chip-count">{items.length}</span>
        </Link>
        <Link
          href="/ops/inbox?filter=unanswered"
          className={`gh-ops-chip${filterUnanswered ? ' is-on' : ''}`}
        >
          Unanswered (&gt;{UNANSWERED_HOURS}h)
          <span className="gh-ops-chip-count">{unansweredCount}</span>
        </Link>
      </div>

      {visible.length === 0 ? (
        <div className="gh-ops-empty">
          <p>No {filterUnanswered ? 'unanswered threads' : 'members'} to show.</p>
        </div>
      ) : (
        <div className="gh-ops-inbox-list">
          {visible.map((r) => {
            const displayName = r.businessName ?? r.email ?? r.userId;
            const lm = r.lastMsg;
            const preview = lm
              ? lm.body.slice(0, 100) + (lm.body.length > 100 ? '…' : '')
              : 'No messages yet';
            const ago = lm ? relativeTime(new Date(lm.createdAt)) : '';

            return (
              <Link
                key={r.userId}
                href={`/ops/inbox/${encodeURIComponent(r.userId)}`}
                className={`gh-ops-inbox-row${r.isUnanswered ? ' is-unanswered' : ''}`}
              >
                <div className="gh-ops-inbox-row-main">
                  <div className="gh-ops-inbox-row-hd">
                    <span className="gh-ops-inbox-name">{displayName}</span>
                    {r.isUnanswered && (
                      <span className="gh-ops-badge unanswered">Unanswered</span>
                    )}
                    {r.planTier && (
                      <span className={`gh-ops-status status-${r.subscriptionStatus ?? 'active'}`}>
                        {r.planTier}
                      </span>
                    )}
                  </div>
                  <div className="gh-ops-inbox-preview">
                    {lm && !lm.fromTeam && <span className="who">Member: </span>}
                    {lm && lm.fromTeam && <span className="who">You: </span>}
                    {preview}
                  </div>
                </div>
                <div className="gh-ops-inbox-row-meta">
                  {r.email && <span>{r.email}</span>}
                  {ago && <span>{ago}</span>}
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}

function relativeTime(d: Date): string {
  const diff = Date.now() - d.getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const days = Math.floor(h / 24);
  return `${days}d ago`;
}
