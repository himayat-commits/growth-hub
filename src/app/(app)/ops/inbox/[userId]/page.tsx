// /ops/inbox/[userId] — thread view for a specific member.
// Server component; OpsReplyComposer handles client-side sending.

import Link from 'next/link';
import { redirect } from 'next/navigation';
import { eq } from 'drizzle-orm';
import { getOpsUser } from '@/lib/auth/ops';
import { canAccessMemberThread } from '@/lib/auth/ops-inbox';
import { getDb } from '@/lib/db';
import { userProfiles, subscriptions } from '@/lib/db/schema';
import { getThread } from '@/lib/db/messages';
import OpsReplyComposer from './OpsReplyComposer';

export const dynamic = 'force-dynamic';

function dayHeader(d: Date): string {
  const today = new Date();
  const sameDay = d.toDateString() === today.toDateString();
  if (sameDay) {
    return `Today · ${d.toLocaleTimeString('en-AU', { hour: 'numeric', minute: '2-digit' })}`;
  }
  return new Intl.DateTimeFormat('en-AU', {
    weekday: 'long', day: 'numeric', month: 'short',
    hour: 'numeric', minute: '2-digit',
  }).format(d);
}

type Params = Promise<{ userId: string }>;

export default async function OpsInboxThreadPage({ params }: { params: Params }) {
  const opsUser = await getOpsUser();
  if (!opsUser) redirect('/dashboard');

  const { userId } = await params;

  // Strategists may only open threads for members assigned to them.
  // (Admin/owner ops users with no strategist record still see everyone.)
  if (!(await canAccessMemberThread(opsUser, userId))) redirect('/ops/inbox');

  const db = getDb();
  const [thread, profileRows, subRows] = await Promise.all([
    getThread(userId),
    db.select({
      businessName: userProfiles.businessName,
      assignedStrategistId: userProfiles.assignedStrategistId,
    }).from(userProfiles).where(eq(userProfiles.userId, userId)).limit(1),
    db.select({ email: subscriptions.email })
      .from(subscriptions).where(eq(subscriptions.userId, userId)).limit(1),
  ]);

  const memberEmail = subRows[0]?.email ?? userId;
  const memberName = profileRows[0]?.businessName ?? memberEmail;
  const strategistSlug = profileRows[0]?.assignedStrategistId ?? '—';

  return (
    <div className="gh-ops-inbox-wrap">
      {/* Back link */}
      <div style={{ padding: '12px 0 0' }}>
        <Link href="/ops/inbox" className="gh-ops-meta" style={{ textDecoration: 'none' }}>
          ← Back to inbox
        </Link>
      </div>

      {/* Thread header */}
      <div className="gh-ops-inbox-thread-hd">
        <div>
          <div style={{ fontWeight: 600, fontSize: 15 }}>{memberName}</div>
          <div className="gh-ops-meta">
            {memberEmail} · strategist: {strategistSlug}
          </div>
        </div>
        {subRows[0]?.email && (
          <a href={`mailto:${subRows[0].email}`} className="gh-btn ghost" style={{ fontSize: 12 }}>
            Email directly →
          </a>
        )}
      </div>

      {/* Messages */}
      <div className="gh-ops-inbox-thread-body">
        {thread.length === 0 ? (
          <div style={{ textAlign: 'center', color: 'var(--ink-50)', padding: '40px 20px', fontSize: 13 }}>
            No messages yet for this member.
          </div>
        ) : (
          thread.map((m, i) => {
            const prev = thread[i - 1];
            const showDay =
              !prev ||
              new Date(prev.createdAt).toDateString() !== new Date(m.createdAt).toDateString();
            return (
              <div key={m.id}>
                {showDay && (
                  <div style={{
                    textAlign: 'center', fontSize: 11, color: 'var(--ink-50)',
                    letterSpacing: '0.18em', textTransform: 'uppercase',
                    margin: '14px 0 6px',
                  }}>
                    {dayHeader(new Date(m.createdAt))}
                  </div>
                )}
                <div
                  className="gh-msg-bubble"
                  style={m.fromTeam ? undefined : {
                    background: 'var(--lime)', marginLeft: 'auto', maxWidth: '80%',
                  }}
                >
                  {m.authorName && <span className="who">{m.authorName}</span>}
                  {m.body.split('\n').map((line, j) => (
                    <span key={j}>
                      {line}
                      {j < m.body.split('\n').length - 1 && <br />}
                    </span>
                  ))}
                </div>
              </div>
            );
          })
        )}
      </div>

      <OpsReplyComposer userId={userId} />
    </div>
  );
}
