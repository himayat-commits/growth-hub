import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { withAuth } from '@workos-inc/authkit-nextjs';
import { PageHeader } from '@/components/dashboard/PageHeader';
import { IcoCog } from '@/components/dashboard/Icons';
import { getThread, markThreadRead, TEAM_AUTHOR_NAME, getUnreadMessageCount } from '@/lib/db/messages';
import MessageComposer from './MessageComposer';

export const metadata: Metadata = {
  title: 'Messages — Growth Hub',
};

export const dynamic = 'force-dynamic';

function dayHeader(iso: Date): string {
  const today = new Date();
  const d = new Date(iso);
  const sameDay = d.toDateString() === today.toDateString();
  if (sameDay) {
    return `Today · ${d.toLocaleTimeString('en-AU', { hour: 'numeric', minute: '2-digit' })}`;
  }
  return new Intl.DateTimeFormat('en-AU', {
    weekday: 'long',
    day: 'numeric',
    month: 'short',
    hour: 'numeric',
    minute: '2-digit',
  }).format(d);
}

export default async function MessagesPage() {
  const { user } = await withAuth();
  if (!user) redirect('/sign-in?redirect_url=/messages');

  // Mark every team message as read the moment the user opens the inbox.
  // Has to happen before getThread so the returned rows reflect the new state.
  const unreadBefore = await getUnreadMessageCount(user.id);
  if (unreadBefore > 0) {
    await markThreadRead(user.id);
  }
  const thread = await getThread(user.id);

  const lastTeamMsg = [...thread].reverse().find((m) => m.fromTeam);

  return (
    <>
      <PageHeader
        kicker="Inbox"
        title="Messages"
        sub="Talk to the Growth Hub team. We reply within 1 business day."
        actions={
          <button className="gh-btn ghost" type="button">
            <IcoCog />
            Notification settings
          </button>
        }
      />

      <div className="gh-msg-frame">
        <div className="gh-msg-side">
          <div className="gh-msg-side-hd">
            <div className="gh-msg-side-h">All conversations</div>
          </div>
          <div className="gh-msg-list">
            <button className="gh-msg-thread is-active" type="button">
              <div className="gh-avatar" style={{ background: 'var(--teal)', width: 34, height: 34, fontSize: 12 }}>GH</div>
              <div>
                <div className="gh-msg-thread-name">{TEAM_AUTHOR_NAME}</div>
                <div className="gh-msg-thread-preview">
                  {lastTeamMsg
                    ? lastTeamMsg.body.slice(0, 70) + (lastTeamMsg.body.length > 70 ? '…' : '')
                    : 'Reply here when you have a question.'}
                </div>
              </div>
              <div className="gh-msg-thread-time">
                {lastTeamMsg
                  ? new Intl.DateTimeFormat('en-AU', { day: 'numeric', month: 'short' }).format(
                      lastTeamMsg.createdAt,
                    )
                  : ''}
              </div>
            </button>
          </div>
          <div style={{ padding: '12px 16px', borderTop: '1px solid var(--rule)', fontSize: 12, color: 'var(--ink-50)' }}>
            Reaching out for a service? Message a Strategist after your Growth Call.
          </div>
        </div>

        <div className="gh-msg-pane">
          <div className="gh-msg-pane-hd">
            <div className="gh-avatar" style={{ background: 'var(--teal)' }}>GH</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 14, fontWeight: 600 }}>{TEAM_AUTHOR_NAME}</div>
              <div style={{ fontSize: 12, color: 'var(--ink-50)' }}>
                Usually replies within 1 business day · Online
              </div>
            </div>
          </div>

          <div className="gh-msg-pane-body">
            {thread.length === 0 ? (
              <div
                style={{
                  textAlign: 'center',
                  color: 'var(--ink-50)',
                  fontSize: 13,
                  padding: '40px 20px',
                }}
              >
                Start the conversation — we read every message ourselves.
              </div>
            ) : (
              thread.map((m, i) => {
                // Render a date divider before the first message of each new day.
                const prev = thread[i - 1];
                const showDay =
                  !prev ||
                  new Date(prev.createdAt).toDateString() !==
                    new Date(m.createdAt).toDateString();
                return (
                  <div key={m.id}>
                    {showDay && (
                      <div
                        style={{
                          textAlign: 'center',
                          fontSize: 11,
                          color: 'var(--ink-50)',
                          letterSpacing: '0.18em',
                          textTransform: 'uppercase',
                          margin: '14px 0 6px',
                        }}
                      >
                        {dayHeader(m.createdAt)}
                      </div>
                    )}
                    <div
                      className="gh-msg-bubble"
                      style={
                        m.fromTeam
                          ? undefined
                          : {
                              background: 'var(--lime)',
                              marginLeft: 'auto',
                              maxWidth: '80%',
                            }
                      }
                    >
                      {m.authorName && (
                        <span className="who">{m.authorName}</span>
                      )}
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

          <MessageComposer />
        </div>
      </div>
    </>
  );
}
