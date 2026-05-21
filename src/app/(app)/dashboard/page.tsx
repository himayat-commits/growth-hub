import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { withAuth } from '@workos-inc/authkit-nextjs';
import { ensureUserRecord } from '@/lib/auth/ensure-user-record';
import { getSubscription, getEffectivePlan } from '@/lib/subscription';
import { PLANS } from '@/lib/plans';
import { getFeaturedResources, getUpcomingEvents } from '@/lib/cms';
import { getUserRsvpSet } from '@/lib/db/rsvps';
import { getNotifications } from '@/lib/db/notifications';
import { getUnreadMessageCount, getThread } from '@/lib/db/messages';
import { getActiveBookings, statusLabel } from '@/lib/db/bookings';
import { eq } from 'drizzle-orm';
import { getDb } from '@/lib/db';
import { onboardingStates } from '@/lib/db/schema';
import type { Notification } from '@/lib/db/schema';
import type { WizardState } from '@/lib/wizard/state';
import { stepsForPackage } from '@/lib/wizard/state';
import { isStepComplete } from '@/lib/wizard/initial-state';
import type { PackageId } from '@/lib/wizard/packages';
import {
  IcoBriefcase,
  IcoCal,
  IcoMsg,
  IcoSpark,
  IcoGift,
  IcoArrow,
} from '@/components/dashboard/Icons';

export const metadata: Metadata = {
  title: 'Dashboard — Growth Hub',
};

// Notification "kind" → tone + icon used in the dashboard card. The
// inbox view (Phase 5+) renders the same notifications with richer chrome.
function notificationTone(kind: string): 'plum' | 'lav' | 'teal' {
  switch (kind) {
    case 'welcome':
    case 'message_received':
      return 'plum';
    case 'subscription_active':
    case 'event_reminder':
      return 'lav';
    case 'birdeye_provisioned':
    case 'new_resource':
    case 'referral_signed_up':
    default:
      return 'teal';
  }
}

function notificationIcon(tone: 'plum' | 'lav' | 'teal') {
  return tone === 'plum'
    ? <IcoSpark />
    : tone === 'lav'
      ? <IcoCal />
      : <IcoGift />;
}

/** Friendly relative time ("Just now", "5m ago", "2h ago", "3d ago"). */
function relativeTime(date: Date): string {
  const diffMs = Date.now() - date.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  if (diffSec < 60) return 'Just now';
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  const diffDay = Math.floor(diffHr / 24);
  if (diffDay < 7) return `${diffDay}d ago`;
  return new Intl.DateTimeFormat('en-AU', { day: 'numeric', month: 'short' }).format(date);
}

// Tone → CSS class on the dashboard "tag-on-img" pill. Keeps the visual
// language consistent with the resource grid on /resources.
function toneClass(tone: string | null | undefined): string {
  if (tone === 'lime' || tone === 'teal' || tone === 'plum' || tone === 'lav') return tone;
  return '';
}

interface ChecklistItem {
  id: string;
  name: string;
  meta: string;
  state: 'done' | 'current' | 'todo';
  href: string | null;
  action?: string;
}

export default async function DashboardPage() {
  const { user } = await withAuth();
  if (!user) redirect('/sign-in?redirect_url=/dashboard');

  const profile = await ensureUserRecord({
    id: user.id,
    firstName: user.firstName,
    lastName: user.lastName,
    email: user.email,
  });

  const [
    sub,
    featuredResources,
    upcomingEvents,
    rsvpSet,
    notifications,
    thread,
    unreadMsgCount,
    obRows,
    activeBookings,
  ] = await Promise.all([
    getSubscription(),
    getFeaturedResources(3),
    getUpcomingEvents(50),
    getUserRsvpSet(user.id),
    getNotifications(user.id, 3),
    getThread(user.id),
    getUnreadMessageCount(user.id),
    getDb()
      .select()
      .from(onboardingStates)
      .where(eq(onboardingStates.userId, user.id))
      .limit(1),
    getActiveBookings(user.id),
  ]);
  const wizardState = obRows[0]?.state as WizardState | undefined;
  const tier = getEffectivePlan(sub);
  const plan = PLANS[tier];

  // The user's next 1-2 upcoming sessions (events they've RSVP'd to).
  const myUpcoming = upcomingEvents
    .filter((e) => rsvpSet.has(Number(e.id)))
    .slice(0, 2);

  // Latest team message — shown in the dashboard Messages preview card.
  const latestTeamMessage = [...thread]
    .reverse()
    .find((m) => m.fromTeam);
  const unreadNotifCount = notifications.filter((n: Notification) => !n.readAt).length;

  const greet = user.firstName || user.email?.split('@')[0] || 'there';
  const memberSince = new Intl.DateTimeFormat('en-AU', { dateStyle: 'long' }).format(
    profile.createdAt,
  );

  // Build the dashboard checklist. Step status comes from real profile state
  // where possible (Phases 3-4 will wire steps 4 and 5 to real bookings /
  // resource visits — for now they stay as todo with a CTA).
  const profileDone = profile.profileCompletePct >= 60;
  const goalsDone = (profile.helpAreas?.length ?? 0) > 0;
  const checklist: ChecklistItem[] = [
    {
      id: 'signup',
      name: 'Create your Growth Hub account',
      meta: 'Today',
      state: 'done',
      href: null,
    },
    {
      id: 'profile',
      name: 'Complete your profile',
      meta: `Name, business, photo · ${profile.profileCompletePct}% done`,
      state: profileDone ? 'done' : 'current',
      href: '/profile',
      action: profileDone ? undefined : 'Continue',
    },
    {
      id: 'goals',
      name: 'Tell us about your goals',
      meta: 'So we can match you to the right supports',
      state: goalsDone ? 'done' : profileDone ? 'current' : 'todo',
      href: '/profile',
      action: goalsDone ? undefined : 'Start',
    },
    {
      id: 'call',
      name: 'Book your free 30-min Growth Call',
      meta: '1:1 with a Growth Strategist',
      state: 'todo',
      href: '/services',
      action: 'Book',
    },
    {
      id: 'library',
      name: 'Browse the Resource Library',
      meta: 'Templates, guides & playbooks',
      state: 'todo',
      href: '/resources',
      action: 'Explore',
    },
  ];

  // Paid users get an extra checklist item for the Birdeye provisioning
  // wizard. State + meta reflect real wizard progress in Neon.
  if (tier !== 'free') {
    const provisioned = !!wizardState?.provisioning?.businessNumber;
    const wizardPkg = (wizardState?.packageId as PackageId | undefined) ?? (tier as PackageId);
    const steps = stepsForPackage(wizardPkg);
    const completedSteps = wizardState
      ? steps.filter((s) => isStepComplete(wizardState, s.key)).length
      : 0;
    const nextStep = wizardState
      ? steps.find((s) => s.key !== 'review' && !isStepComplete(wizardState, s.key))
      : steps[0];
    const wizardHref = `/onboarding/${nextStep?.key ?? 'confirm'}`;

    let state: 'done' | 'current' | 'todo';
    let meta: string;
    let action: string | undefined;
    if (provisioned) {
      state = 'done';
      meta = `Birdeye business #${wizardState?.provisioning?.businessNumber ?? ''}`;
    } else if (completedSteps > 0) {
      state = 'current';
      meta = `${completedSteps} of ${steps.length} wizard steps complete`;
      action = 'Resume';
    } else {
      state = 'todo';
      meta = `${steps.length}-step wizard · ~15 minutes`;
      action = 'Start setup';
    }
    checklist.splice(3, 0, {
      id: 'birdeye',
      name: 'Set up your Birdeye account',
      meta,
      state,
      href: wizardHref,
      action,
    });
  }

  const done = checklist.filter((s) => s.state === 'done').length;
  const total = checklist.length;
  const pct = Math.round((done / total) * 100);
  const NUMBER_WORDS: Record<number, string> = {
    5: 'Five',
    6: 'Six',
    7: 'Seven',
  };
  const totalWord = NUMBER_WORDS[total] ?? String(total);
  const heading = `${totalWord} quick steps to unlock the Growth Hub.`;

  return (
    <>
      {/* Welcome */}
      <div className="gh-welcome">
        <div>
          <h1 className="gh-welcome-h">
            <span className="hand">Welcome,</span>
            {greet}.
          </h1>
          <div className="gh-welcome-sub">
            {tier === 'free'
              ? "Let's get your account set up so we can match you to the right supports."
              : `You're on the ${plan.name} plan. Everything in your account is here.`}
          </div>
        </div>
        <div className="gh-welcome-meta">
          Member since<b>{memberSince}</b>
        </div>
      </div>

      {/* Onboarding hero */}
      <div className="gh-onboard">
        <div className="gh-onboard-l">
          <span className="gh-onboard-kicker">Getting started</span>
          <h2 className="gh-onboard-h">{heading}</h2>
          <p className="gh-onboard-p">
            Finish these and we&apos;ll surface coaching, courses and events matched to your goals
            — not a generic feed.
          </p>
          <div className="gh-progress">
            <div className="gh-progress-bar">
              <div className="gh-progress-fill" style={{ width: `${pct}%` }} />
            </div>
            <div className="gh-progress-count">
              <b>
                {done} of {total}
              </b>{' '}
              · {pct}% complete
            </div>
          </div>
          <Link
            href={
              checklist.find((s) => s.state === 'current' || s.state === 'todo')?.href ?? '/profile'
            }
            className="gh-onboard-cta"
          >
            Continue setup
            <IcoArrow />
          </Link>
        </div>

        <ul className="gh-checklist">
          {checklist.map((s) => (
            <li
              key={s.id}
              className={
                s.state === 'done' ? 'is-done' : s.state === 'current' ? 'is-current' : ''
              }
            >
              <div className="check">
                {s.state === 'done' && (
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M5 12l4 4 10-10" />
                  </svg>
                )}
              </div>
              <div className="gh-step-name">
                {s.name}
                <span className="meta">{s.meta}</span>
              </div>
              {s.href && s.action && (
                <Link href={s.href} className="gh-step-action">
                  {s.action}
                </Link>
              )}
            </li>
          ))}
        </ul>
      </div>

      {/* Active services + Upcoming sessions */}
      <div className="gh-row-2">
        <div className="gh-card">
          <div className="gh-card-hd">
            <div className="gh-card-h">Active services</div>
            <Link href="/services" className="gh-card-link">
              View all →
            </Link>
          </div>
          {activeBookings.length === 0 ? (
            <div className="gh-empty">
              <div className="gh-empty-ic">
                <IcoBriefcase />
              </div>
              <div className="gh-empty-h">No active services yet</div>
              <p className="gh-empty-p">
                Browse our digital growth services — website builds, marketing coaching, ops
                support and more.
              </p>
              <div style={{ display: 'flex', gap: 8, marginTop: 6 }}>
                <Link href="/services#services">
                  <button className="gh-empty-cta" type="button">
                    Browse services
                  </button>
                </Link>
                <Link href="/plan">
                  <button className="gh-empty-cta ghost" type="button">
                    See pricing
                  </button>
                </Link>
              </div>
            </div>
          ) : (
            <ul className="gh-list">
              {activeBookings.slice(0, 3).map((b) => (
                <li key={b.id}>
                  <div className="gh-list-ic">
                    <IcoBriefcase />
                  </div>
                  <div className="gh-list-body">
                    <div className="gh-list-h">{b.serviceTitle}</div>
                    <p className="gh-list-p">
                      {statusLabel(b.status)}
                      {b.datePreference ? ` · ${b.datePreference}` : ''}
                    </p>
                  </div>
                  <Link
                    href={`/services/${b.serviceSlug}`}
                    className="gh-list-time"
                    style={{ color: 'var(--teal)', textDecoration: 'none' }}
                  >
                    View
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="gh-card">
          <div className="gh-card-hd">
            <div className="gh-card-h">Upcoming sessions</div>
            <Link href="/my-events" className="gh-card-link">
              My calendar →
            </Link>
          </div>
          {myUpcoming.length === 0 ? (
            <div className="gh-empty">
              <div className="gh-empty-ic">
                <IcoCal />
              </div>
              <div className="gh-empty-h">Your calendar is clear</div>
              <p className="gh-empty-p">
                Browse events and register for the next webinar, workshop or meet-up.
              </p>
              <Link href="/my-events">
                <button className="gh-empty-cta" type="button">
                  See what&apos;s on
                </button>
              </Link>
            </div>
          ) : (
            <ul className="gh-list">
              {myUpcoming.map((e) => {
                const dt = new Date(e.date as string);
                const dateLabel = new Intl.DateTimeFormat('en-AU', {
                  weekday: 'short',
                  day: 'numeric',
                  month: 'short',
                }).format(dt);
                return (
                  <li key={e.id}>
                    <div className="gh-list-ic">
                      <IcoCal />
                    </div>
                    <div className="gh-list-body">
                      <div className="gh-list-h">{e.title}</div>
                      <p className="gh-list-p">
                        {dateLabel}
                        {e.time ? ` · ${e.time}` : ''}
                      </p>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>

      {/* Notifications + Messages + Refer */}
      <div className="gh-row-3">
        <div className="gh-card">
          <div className="gh-card-hd">
            <div className="gh-card-h">
              Notifications
              {unreadNotifCount > 0 && (
                <span className="gh-pill plum">{unreadNotifCount} new</span>
              )}
            </div>
          </div>
          {notifications.length === 0 ? (
            <div className="gh-empty" style={{ minHeight: 0, padding: '20px 18px' }}>
              <div className="gh-empty-h">No notifications yet</div>
              <p className="gh-empty-p">
                We&apos;ll ping you here when something needs your attention — new resources,
                upcoming events, billing changes.
              </p>
            </div>
          ) : (
            <ul className="gh-list">
              {notifications.map((n) => {
                const tone = notificationTone(n.kind);
                const Item = (
                  <>
                    <div className={`gh-list-ic ${tone}`}>{notificationIcon(tone)}</div>
                    <div className="gh-list-body">
                      <div className="gh-list-h">{n.title}</div>
                      <p className="gh-list-p">{n.body}</p>
                    </div>
                    <div className="gh-list-time">{relativeTime(n.createdAt)}</div>
                  </>
                );
                return (
                  <li key={n.id}>
                    {n.href ? (
                      <Link href={n.href} style={{ display: 'contents', color: 'inherit', textDecoration: 'none' }}>
                        {Item}
                      </Link>
                    ) : (
                      Item
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        <div className="gh-card">
          <div className="gh-card-hd">
            <div className="gh-card-h">Messages</div>
            <Link href="/messages" className="gh-card-link">
              Open inbox
            </Link>
          </div>
          {latestTeamMessage ? (
            <div className="gh-empty" style={{ minHeight: 0, padding: '20px 18px' }}>
              <div className="gh-empty-ic">
                <IcoMsg />
              </div>
              <div className="gh-empty-h">
                {unreadMsgCount > 0
                  ? `${unreadMsgCount} unread message${unreadMsgCount === 1 ? '' : 's'}`
                  : 'Caught up'}
              </div>
              <p className="gh-empty-p">
                {latestTeamMessage.body.slice(0, 140)}
                {latestTeamMessage.body.length > 140 ? '…' : ''}
              </p>
              <Link href="/messages">
                <button className="gh-empty-cta ghost" type="button">
                  Open message
                </button>
              </Link>
            </div>
          ) : (
            <div className="gh-empty" style={{ minHeight: 0, padding: '20px 18px' }}>
              <div className="gh-empty-ic">
                <IcoMsg />
              </div>
              <div className="gh-empty-h">Your inbox is clear</div>
              <p className="gh-empty-p">
                The Growth Hub team will reach out after you finish onboarding or book your first
                Growth Call.
              </p>
            </div>
          )}
        </div>

        <div className="gh-card gh-refer">
          <div className="gh-card-hd">
            <div className="gh-card-h" style={{ color: 'var(--plum)' }}>
              Refer a friend
              <span className="gh-pill lav">2× credit</span>
            </div>
          </div>
          <h3 className="gh-refer-h">Know a small operator who&apos;d grow with us?</h3>
          <p className="gh-refer-p">
            When they sign up and book a Growth Call, you both get a $50 service credit. No cap.
          </p>
          {profile.referCode && (
            <div className="gh-refer-code">
              Your code <code>{profile.referCode}</code>
            </div>
          )}
          <Link href="/benefits" className="gh-refer-link">
            Copy invite link
            <IcoArrow />
          </Link>
        </div>
      </div>

      {/* Suggested resources */}
      {featuredResources.length > 0 && (
        <div className="gh-suggest">
          <div className="gh-card-hd">
            <div className="gh-card-h">Suggested first reads</div>
            <Link href="/resources" className="gh-card-link">
              All resources →
            </Link>
          </div>
          <div className="gh-suggest-grid">
            {featuredResources.map((r) => {
              const thumb = r.thumbnail as { url?: string } | string | null | undefined;
              const thumbUrl = typeof thumb === 'object' && thumb?.url ? thumb.url : null;
              return (
                <Link
                  key={r.id}
                  href={(r.url as string | undefined) ?? '/resources'}
                  target={r.url ? '_blank' : undefined}
                  rel={r.url ? 'noopener noreferrer' : undefined}
                  className="gh-suggest-item"
                  style={{ textDecoration: 'none', color: 'inherit' }}
                >
                  <div className="gh-img-thumb">
                    {thumbUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={thumbUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      <div className="gh-img-placeholder" />
                    )}
                    <span className={`tag-on-img ${toneClass(r.tone as string | null)}`}>
                      {r.tag}
                    </span>
                  </div>
                  <h4 className="gh-suggest-h">{r.title}</h4>
                  <div className="gh-suggest-meta">
                    <span>{r.meta ?? r.tag}</span>
                    <span className="dot" />
                    <span>{r.free ? 'Free' : 'Member'}</span>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      )}
    </>
  );
}
