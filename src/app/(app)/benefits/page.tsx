import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { withAuth } from '@workos-inc/authkit-nextjs';
import { PageHeader } from '@/components/dashboard/PageHeader';
import { ensureUserRecord } from '@/lib/auth/ensure-user-record';
import { getReferralStats } from '@/lib/db/referrals';
import { getSubscription, getEffectivePlan } from '@/lib/subscription';
import {
  IcoCal,
  IcoBook,
  IcoMegaphone,
  IcoPeople,
  IcoGift,
  IcoShield,
} from '@/components/dashboard/Icons';
import ReferralCopyButton from './ReferralCopyButton';

// Small inline lock used on paid-only benefits. Standalone so we don't
// bloat Icons.tsx for a single-use glyph.
const LockGlyph = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <rect x="4" y="11" width="16" height="10" rx="2" />
    <path d="M8 11V7a4 4 0 1 1 8 0v4" />
  </svg>
);

export const metadata: Metadata = {
  title: 'Member benefits — Growth Hub',
};

// Site URL is used to build the referral invite link. Lives on apex (where
// "Join free" / "Choose a plan" live) — clicks resolve to /sign-up?ref=…
function getSiteUrl(): string {
  return process.env.NEXT_PUBLIC_SITE_URL ?? 'https://thegrowthhub.com.au';
}

export default async function BenefitsPage() {
  const { user } = await withAuth();
  if (!user) redirect('/sign-in?redirect_url=/benefits');

  const [profile, referralStats, sub] = await Promise.all([
    ensureUserRecord({
      id: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
    }),
    getReferralStats(user.id),
    getSubscription(),
  ]);
  const tier = getEffectivePlan(sub);
  const isPaid = tier !== 'free';

  const referCode = profile.referCode ?? `GROW-${user.id.slice(-6).toUpperCase()}-${new Date().getFullYear()}`;
  const totalCreditDollars = (referralStats.totalCreditCents / 100).toFixed(0);
  const hasReferrals = referralStats.total > 0;
  const inviteLink = `${getSiteUrl()}/sign-up?ref=${encodeURIComponent(referCode)}`;
  const emailSubject = encodeURIComponent('Thought you might like The Growth Hub');
  const emailBody = encodeURIComponent(
    `Hi — I've been using The Growth Hub by Himayat. Free to join, and they give us both a $50 credit if you sign up through this link:\n\n${inviteLink}\n\nNo pressure — just thought it might be useful.`,
  );

  const benefits: Array<{
    tone: 'lime' | '' | 'cream' | 'plum';
    Icon: () => React.JSX.Element;
    title: string;
    p: string;
    tag: string;
    href?: string;
    paidOnly?: boolean;
  }> = [
    {
      tone: 'lime',
      Icon: IcoCal,
      title: '1 free Growth Call',
      p: 'A complimentary 30-minute 1:1 with a Strategist. Use it whenever you\'re stuck.',
      tag: 'Available now',
      href: '/services',
      paidOnly: true,
    },
    {
      tone: '',
      Icon: IcoBook,
      title: 'Resource library',
      p: 'Guides, templates and short courses on running a small business. Updated weekly.',
      tag: 'Browse the library',
      href: '/resources',
    },
    {
      tone: 'cream',
      Icon: IcoMegaphone,
      title: 'Weekly group webinars',
      p: 'A new session every Thursday at 12:30pm. Free for members, recordings included.',
      tag: 'See what\'s on',
      href: '/my-events',
    },
    {
      tone: 'plum',
      Icon: IcoPeople,
      title: 'Community access',
      p: 'A small, quiet group of operators across Sydney and beyond. No sales, no noise.',
      tag: 'Joins on profile complete',
    },
    {
      tone: 'lime',
      Icon: IcoGift,
      title: 'Refer & earn',
      p: 'Each friend who joins and books a Growth Call earns you both A$50 in service credit.',
      tag: `Your code: ${referCode}`,
      href: '#refer',
    },
    {
      tone: '',
      Icon: IcoShield,
      title: 'Member-only pricing',
      p: '10-20% off every Growth Hub service, and partner offers from our trusted referrers.',
      tag: 'Applies at checkout',
      href: '/plan',
      paidOnly: true,
    },
  ];

  return (
    <>
      <PageHeader
        kicker="The perks"
        title="Your member benefits"
        sub="Everything that comes with being part of The Growth Hub — free and paid plans alike."
        actions={
          <Link href="/plan">
            <button className="gh-btn" type="button">
              Upgrade to unlock more
            </button>
          </Link>
        }
      />

      <div
        id="refer"
        className="gh-card gh-refer"
        style={{ flexDirection: 'row', alignItems: 'center', padding: 28 }}
      >
        <div style={{ flex: 1, position: 'relative' }}>
          <div className="gh-card-h" style={{ color: 'var(--plum)' }}>
            Refer a friend
            <span className="gh-pill lav">2× credit</span>
          </div>
          {hasReferrals ? (
            <h3 className="gh-refer-h" style={{ marginTop: 8 }}>
              {referralStats.total} friend{referralStats.total === 1 ? '' : 's'} referred · A${totalCreditDollars} earned.
            </h3>
          ) : (
            <h3 className="gh-refer-h" style={{ marginTop: 8 }}>
              You both get A$50 in service credit.
            </h3>
          )}
          {hasReferrals && (referralStats.pending > 0 || referralStats.qualified > 0) && (
            <div
              style={{
                display: 'flex',
                gap: 14,
                margin: '8px 0 12px',
                fontSize: 13,
                color: 'var(--ink-70)',
              }}
            >
              {referralStats.pending > 0 && (
                <span>
                  <strong>{referralStats.pending}</strong> awaiting Growth Call
                </span>
              )}
              {referralStats.qualified > 0 && (
                <span>
                  <strong>{referralStats.qualified}</strong> qualified — credit issues on next paid plan
                </span>
              )}
              {referralStats.credited > 0 && (
                <span>
                  <strong>{referralStats.credited}</strong> credited
                </span>
              )}
            </div>
          )}
          <p className="gh-refer-p" style={{ marginTop: 6 }}>
            Share your code with a friend who runs a small business. When they sign up and book
            their Growth Call, the credit lands in both accounts. No cap.
          </p>
          <div className="gh-refer-code" style={{ marginTop: 14 }}>
            Your code <code>{referCode}</code>
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, position: 'relative' }}>
          <ReferralCopyButton link={inviteLink} />
          <a
            href={`mailto:?subject=${emailSubject}&body=${emailBody}`}
            className="gh-btn ghost"
            style={{ borderColor: 'rgba(95,48,75,0.3)', color: 'var(--plum)', textAlign: 'center' }}
          >
            Email a friend
          </a>
        </div>
      </div>

      <div className="gh-grid-3">
        {benefits.map((b) => {
          const locked = !!b.paidOnly && !isPaid;
          const effectiveHref = locked ? '/plan' : b.href;
          const tag = locked ? (
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
              <LockGlyph />
              Upgrade to unlock
            </span>
          ) : (
            b.tag
          );
          const inner = (
            <>
              <div className={`gh-benefit-ic ${b.tone}`}>
                <b.Icon />
              </div>
              <h3 className="gh-benefit-h">{b.title}</h3>
              <p className="gh-benefit-p">{b.p}</p>
              <div className="gh-benefit-tag">{tag}</div>
            </>
          );
          const className = locked ? 'gh-benefit gh-benefit--locked' : 'gh-benefit';
          return effectiveHref ? (
            <Link
              key={b.title}
              href={effectiveHref}
              className={className}
              style={{ textDecoration: 'none', color: 'inherit', display: 'block' }}
            >
              {inner}
            </Link>
          ) : (
            <div key={b.title} className={className}>
              {inner}
            </div>
          );
        })}
      </div>
    </>
  );
}
