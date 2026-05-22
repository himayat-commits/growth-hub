// Ops overview. At-a-glance numbers across bookings, referrals, signups.
// Pulled server-side via Drizzle so it always reflects current DB state.

import Link from 'next/link';
import { sql, eq, count } from 'drizzle-orm';
import { getDb } from '@/lib/db';
import {
  serviceBookings,
  referrals,
  subscriptions,
  userProfiles,
} from '@/lib/db/schema';

export const dynamic = 'force-dynamic';

export default async function OpsOverviewPage() {
  const db = getDb();

  // Counts that matter at a glance. Everything in parallel.
  const [
    bookingsPending,
    bookingsScheduled,
    bookingsInProgress,
    referralsQualified,
    referralsPending,
    referralsCredited,
    activeSubs,
    profilesTotal,
    profilesRecent,
  ] = await Promise.all([
    db.select({ c: count() }).from(serviceBookings).where(eq(serviceBookings.status, 'requested')),
    db.select({ c: count() }).from(serviceBookings).where(eq(serviceBookings.status, 'scheduled')),
    db.select({ c: count() }).from(serviceBookings).where(eq(serviceBookings.status, 'in_progress')),
    db.select({ c: count() }).from(referrals).where(eq(referrals.status, 'qualified')),
    db.select({ c: count() }).from(referrals).where(eq(referrals.status, 'pending')),
    db.select({ c: count() }).from(referrals).where(eq(referrals.status, 'credited')),
    db.select({ c: count() }).from(subscriptions).where(
      sql`${subscriptions.subscriptionStatus} IN ('active','trialing')`,
    ),
    db.select({ c: count() }).from(userProfiles),
    db.select({ c: count() }).from(userProfiles).where(
      sql`${userProfiles.createdAt} > NOW() - INTERVAL '7 days'`,
    ),
  ]);

  const tiles: Array<{
    label: string;
    num: number;
    sub: string;
    href: string;
    cta: string;
    tone?: 'attention' | 'good';
  }> = [
    {
      label: 'Booking requests',
      num: bookingsPending[0]?.c ?? 0,
      sub: `${bookingsScheduled[0]?.c ?? 0} scheduled · ${bookingsInProgress[0]?.c ?? 0} in progress`,
      href: '/ops/bookings?status=requested',
      cta: 'Triage',
      tone: (bookingsPending[0]?.c ?? 0) > 0 ? 'attention' : undefined,
    },
    {
      label: 'Referrals to approve',
      num: referralsQualified[0]?.c ?? 0,
      sub: `${referralsPending[0]?.c ?? 0} pending · ${referralsCredited[0]?.c ?? 0} credited`,
      href: '/ops/referrals?status=qualified',
      cta: 'Approve',
      tone: (referralsQualified[0]?.c ?? 0) > 0 ? 'attention' : undefined,
    },
    {
      label: 'New signups (7 days)',
      num: profilesRecent[0]?.c ?? 0,
      sub: `${profilesTotal[0]?.c ?? 0} total profiles · ${activeSubs[0]?.c ?? 0} paid`,
      href: '/ops/signups',
      cta: 'See',
      tone: 'good',
    },
  ];

  return (
    <>
      <div className="gh-ops-head-inner">
        <h1>Overview</h1>
        <p>Action queues for the team. Everything updates in real time on refresh.</p>
      </div>

      <div className="gh-ops-tiles">
        {tiles.map((t) => (
          <Link key={t.label} href={t.href} className={`gh-ops-tile ${t.tone ?? ''}`}>
            <span className="lbl">{t.label}</span>
            <span className="num">{t.num.toLocaleString()}</span>
            <span className="sub">{t.sub}</span>
            <span className="cta">{t.cta} →</span>
          </Link>
        ))}
      </div>

      <section className="gh-ops-section">
        <h2>What this console covers</h2>
        <ul>
          <li><strong>Bookings</strong> — service requests from /services. Triage to scheduled, in-progress, completed.</li>
          <li><strong>Referrals</strong> — qualified referrals waiting for credit approval. One-click to mark as credited (no Stripe round-trip — the existing referral-credit job picks them up on the next subscription event).</li>
          <li><strong>Signups</strong> — recent user_profiles rows with their subscription state.</li>
        </ul>
      </section>
    </>
  );
}
