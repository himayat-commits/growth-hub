import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { withAuth } from '@workos-inc/authkit-nextjs';
import { ensureUserRecord } from '@/lib/auth/ensure-user-record';
import { getSubscription, getEffectivePlan } from '@/lib/subscription';
import { PLANS } from '@/lib/plans';
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

// Static post-signup notifications. Phase 5 replaces these with rows from
// the notifications table; for now they cover the welcome moment that
// every new user sees.
const STATIC_NOTIFICATIONS = [
  {
    id: 'n1',
    tone: 'plum',
    title: 'Welcome to The Growth Hub',
    body: 'Your account is live. Complete your profile to unlock tailored recommendations.',
    time: 'Just now',
  },
  {
    id: 'n2',
    tone: 'lav',
    title: 'Your free Growth Call is waiting',
    body: 'Every new member gets a complimentary 30-minute strategy call. Pick a time that suits you.',
    time: 'Just now',
  },
  {
    id: 'n3',
    tone: 'teal',
    title: 'Member benefits unlocked',
    body: 'You now have access to the resource library, weekly webinars and community events.',
    time: 'Just now',
  },
];

// Suggested first reads — Phase 3 replaces with real Payload Resources.
const STATIC_SUGGESTED = [
  {
    tag: 'Guide',
    title: 'First steps: define your offer in one sentence',
    meta: '5-min read',
    tagClass: '',
  },
  {
    tag: 'Template',
    title: 'One-page business canvas — Growth Hub edition',
    meta: 'PDF · Editable',
    tagClass: 'lime',
  },
  {
    tag: 'Webinar',
    title: 'Marketing without burnout — for small operators',
    meta: 'Thu 21 May · 12:30pm',
    tagClass: 'teal',
  },
];

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

  const sub = await getSubscription();
  const tier = getEffectivePlan(sub);
  const plan = PLANS[tier];

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

  const done = checklist.filter((s) => s.state === 'done').length;
  const total = checklist.length;
  const pct = Math.round((done / total) * 100);

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
          <h2 className="gh-onboard-h">Five quick steps to unlock the Growth Hub.</h2>
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
          <div className="gh-empty">
            <div className="gh-empty-ic">
              <IcoBriefcase />
            </div>
            <div className="gh-empty-h">No active services yet</div>
            <p className="gh-empty-p">
              Browse our digital growth services — website builds, marketing coaching, ops support
              and more.
            </p>
            <div style={{ display: 'flex', gap: 8, marginTop: 6 }}>
              <Link href="/services">
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
        </div>

        <div className="gh-card">
          <div className="gh-card-hd">
            <div className="gh-card-h">Upcoming sessions</div>
            <Link href="/events" className="gh-card-link">
              My calendar →
            </Link>
          </div>
          <div className="gh-empty">
            <div className="gh-empty-ic">
              <IcoCal />
            </div>
            <div className="gh-empty-h">Your calendar is clear</div>
            <p className="gh-empty-p">
              Start with a free 30-minute Growth Call. We&apos;ll map your first three moves
              together.
            </p>
            <Link href="/services">
              <button className="gh-empty-cta" type="button">
                Book Growth Call
              </button>
            </Link>
          </div>
        </div>
      </div>

      {/* Notifications + Messages + Refer */}
      <div className="gh-row-3">
        <div className="gh-card">
          <div className="gh-card-hd">
            <div className="gh-card-h">
              Notifications
              <span className="gh-pill plum">3 new</span>
            </div>
          </div>
          <ul className="gh-list">
            {STATIC_NOTIFICATIONS.map((n) => (
              <li key={n.id}>
                <div className={`gh-list-ic ${n.tone === 'plum' ? 'plum' : n.tone === 'lav' ? 'lav' : ''}`}>
                  {n.tone === 'plum' ? <IcoSpark /> : n.tone === 'lav' ? <IcoCal /> : <IcoGift />}
                </div>
                <div className="gh-list-body">
                  <div className="gh-list-h">{n.title}</div>
                  <p className="gh-list-p">{n.body}</p>
                </div>
                <div className="gh-list-time">{n.time}</div>
              </li>
            ))}
          </ul>
        </div>

        <div className="gh-card">
          <div className="gh-card-hd">
            <div className="gh-card-h">Messages</div>
            <Link href="/messages" className="gh-card-link">
              Open inbox
            </Link>
          </div>
          <div className="gh-empty" style={{ minHeight: 0, padding: '20px 18px' }}>
            <div className="gh-empty-ic">
              <IcoMsg />
            </div>
            <div className="gh-empty-h">1 unread message</div>
            <p className="gh-empty-p">
              A welcome note from the Growth Hub team is waiting. Your Strategist will reach out
              after your first call.
            </p>
            <Link href="/messages">
              <button className="gh-empty-cta ghost" type="button">
                Open message
              </button>
            </Link>
          </div>
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
      <div className="gh-suggest">
        <div className="gh-card-hd">
          <div className="gh-card-h">Suggested first reads</div>
          <Link href="/resources" className="gh-card-link">
            All resources →
          </Link>
        </div>
        <div className="gh-suggest-grid">
          {STATIC_SUGGESTED.map((s, i) => (
            <Link
              key={i}
              href="/resources"
              className="gh-suggest-item"
              style={{ textDecoration: 'none', color: 'inherit' }}
            >
              <div className="gh-img-thumb">
                <div className="gh-img-placeholder" />
                <span className={`tag-on-img ${s.tagClass}`}>{s.tag}</span>
              </div>
              <h4 className="gh-suggest-h">{s.title}</h4>
              <div className="gh-suggest-meta">
                <span>{s.meta}</span>
                <span className="dot" />
                <span>Free</span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </>
  );
}
