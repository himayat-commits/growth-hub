'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@workos-inc/authkit-nextjs/components';
import { PLANS, calculateDisplayPrice, type BillingInterval, type PlanTier } from '@/lib/plans';

// ── Compare table ─────────────────────────────────────────────────────────────

const TIERS_COMPARE = [
  { name: 'Free', price: '$0' },
  { name: 'Foundations', price: '$299/mo' },
  { name: 'Growth', price: '$499/mo' },
  { name: 'Accelerate', price: '$799/mo' },
  { name: 'Managed Pro', price: '$1,499/mo' },
  { name: 'Managed Elite', price: '$2,499/mo' },
];

const C = '✓', D = '—', M = 'Managed';
// Each row holds 6 cells: [Free, Foundations, Growth, Accelerate, Managed Pro, Managed Elite].
// Free maps to the community-only entry point — webinar, community, in-person events,
// and one complimentary Growth Call. No SaaS modules.
const ROWS: [string, string[] | null][] = [
  ['Support', null],
  ['Support Level',           ['Community',  'Basic email',  'Basic email',  'Basic email',  'Dedicated manager', 'Priority same-day']],
  ['Onboarding Videos',       [D, C, C, C, C, C]],
  ['Weekly Live Webinar',     [C, C, C, C, C, C]],
  ['Community Access',        [C, C, C, C, C, C]],
  ['In-Person Events',        [C, C, C, C, C, C]],
  ['Free Growth Call (30m)',  [C, C, C, C, C, C]],
  ['Work Management Modules', null],
  ['Invoicing',               [D, C, C, C, M, M]],
  ['Timesheets & Docketing',  [D, D, C, C, M, M]],
  ['Scheduling & Rostering',  [D, D, D, C, M, M]],
  ['Marketing Platform Modules', null],
  ['Social AI',               [D, C, C, C, M, M]],
  ['Listing AI',              [D, C, C, C, M, M]],
  ['Messaging',               [D, C, C, C, C, C]],
  ['Reviews AI',              [D, D, C, C, M, M]],
  ['Review Collateral Kit',   [D, D, C, C, C, C]],
  ['Webchat AI (Robin)',      [D, D, D, C, C, C]],
  ['Referrals',               [D, D, 'Add-on $175', 'Add-on $175', C, M]],
  ['Search AI',               [D, D, 'Add-on $99', 'Add-on $99', D, M]],
  ['Insights',                [D, D, D, D, D, M]],
  ['Competitor AI',           [D, D, D, D, D, M]],
  ['Managed Services',        null],
  ['Social Media Posts',      [D, D, D, D, '12/mo', '20/mo + design']],
  ['Review Management',       [D, D, D, D, '24hr response', '24hr response']],
  ['Strategy Calls',          [D, D, D, D, 'Monthly (45m)', 'Fortnightly']],
  ['Account Manager',         [D, D, D, D, C, 'Priority']],
  ['Local SEO',               [D, D, D, D, D, C]],
  ['Google Ads',              [D, D, D, D, D, C]],
  ['Website Updates',         [D, D, D, D, D, '4 hrs/mo']],
  ['Blog Content',            [D, D, D, D, D, '1/mo']],
  ['SMS/Email Campaigns',     [D, D, D, D, D, '2x/mo']],
  ['First Month Setup', null],
  ['Logo Design',             [D, D, D, D, 'Basic', 'Brand setup']],
  ['Website Build',           [D, D, D, D, '1-page', 'Full build']],
];

function CellContent({ v }: { v: string }) {
  if (v === C) return <td className="center check">✓</td>;
  if (v === D) return <td className="center dash">—</td>;
  if (v === M) return <td className="center"><span className="cmp-pill cmp-pill-managed">Managed</span></td>;
  if (v.startsWith('Add-on')) return <td className="center"><span className="cmp-pill cmp-pill-addon">{v}</span></td>;
  return <td className="center">{v}</td>;
}

function ComparisonTable({ open }: { open: boolean }) {
  if (!open) return null;
  return (
    <section className="compare compare-embedded">
      <div className="wrap">
        <div className="compare-card">
          <div className="compare-card-head">
            <h2 className="compare-h2">Everything at a glance</h2>
            <p className="compare-lead">Full feature breakdown across every tier.</p>
          </div>
          <div className="compare-table-wrap">
            <table className="compare-table">
              <thead>
                <tr>
                  <th></th>
                  {TIERS_COMPARE.map((t) => (
                    <th key={t.name}>{t.name}<span className="tier-price">{t.price}</span></th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {ROWS.map((r, i) =>
                  r[1] === null ? (
                    <tr className="group-header" key={i}><td colSpan={7}>{r[0]}</td></tr>
                  ) : (
                    <tr key={i}>
                      <td>{r[0]}</td>
                      {(r[1] as string[]).map((v, j) => <CellContent key={j} v={v} />)}
                    </tr>
                  )
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </section>
  );
}

// ── SVG icons ─────────────────────────────────────────────────────────────────

function ArrowIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" aria-hidden="true">
      <path d="M3 7h8M7 3l4 4-4 4" />
    </svg>
  );
}

function ChevronIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <polyline points="6 9 12 15 18 9" />
    </svg>
  );
}

// ── Props ─────────────────────────────────────────────────────────────────────

export interface PricingPageContentProps {
  heading?: string | null;
  subheading?: string | null;
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function PricingPageContent({ heading, subheading }: PricingPageContentProps = {}) {
  const [interval, setInterval] = useState<BillingInterval>('month');
  const [loading, setLoading] = useState<PlanTier | null>(null);
  const [showCompare, setShowCompare] = useState(false);
  const { user, loading: authLoading } = useAuth();
  const isLoaded = !authLoading;
  const isSignedIn = !!user;
  const router = useRouter();

  const selfTiers: PlanTier[] = ['foundations', 'growth', 'accelerate'];
  const freePlan = PLANS.free;

  async function startCheckout(tier: PlanTier) {
    if (!isLoaded) return;
    if (!isSignedIn) {
      router.push(`/sign-up?redirect_url=${encodeURIComponent('/pricing')}`);
      return;
    }
    setLoading(tier);
    try {
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tier, interval }),
      });
      const data = (await res.json()) as { url?: string; error?: string };
      if (!res.ok || !data.url) throw new Error(data.error ?? 'Checkout failed');
      window.location.href = data.url;
    } catch (err) {
      console.error(err);
      alert(err instanceof Error ? err.message : 'Something went wrong starting checkout.');
      setLoading(null);
    }
  }

  return (
    <>
      <section id="packages" className="pkg">
        <div className="wrap">

          {/* ── Header ── */}
          <div className="pkg-head-centered" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
            <span className="section-label">Pricing</span>
            <h1 className="section-h2" style={{ marginTop: 8 }}>
              {heading ?? 'Choose your level of support.'}
            </h1>
            {subheading && <p style={{ marginTop: 8, color: 'var(--text-muted, #5a6a65)' }}>{subheading}</p>}

            {/* Monthly / Annual toggle */}
            <div className="pkg-toggle-row">
              <div className="pkg-toggle" role="tablist" aria-label="Billing interval">
                <button role="tab" aria-selected={interval === 'month'} className={interval === 'month' ? 'active' : ''} onClick={() => setInterval('month')}>
                  Monthly
                </button>
                <button role="tab" aria-selected={interval === 'year'} className={interval === 'year' ? 'active' : ''} onClick={() => setInterval('year')}>
                  Annual
                  <span style={{ marginLeft: 6, background: 'var(--lime, #c5e84a)', color: 'var(--ink, #1a3530)', borderRadius: 99, padding: '1px 7px', fontSize: '0.7em', fontWeight: 600 }}>
                    2 months free
                  </span>
                </button>
              </div>
            </div>
          </div>

          {/* ── Free entry-point banner ── */}
          {/*
            Sits above the three paid cards. Anchors the price ladder at $0
            so visitors comparison-shopping see the no-card option without
            having to scroll the whole page. Renders the same features list
            from PLANS.free so the source of truth stays in lib/plans.ts.
          */}
          <div className="pkg-free-banner" role="region" aria-label="Free Member tier">
            <div className="pkg-free-copy">
              <div className="pkg-free-tag">Start free · no card needed</div>
              <h3 className="pkg-free-h">{freePlan.name}</h3>
              <p className="pkg-free-p">{freePlan.description}</p>
              <ul className="pkg-free-features">
                {freePlan.features.slice(0, 4).map((f) => (
                  <li key={f}>{f}</li>
                ))}
              </ul>
            </div>
            <div className="pkg-free-cta">
              <div className="pkg-free-price">
                $0<span className="unit">/forever</span>
              </div>
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => router.push('/sign-up?redirect_url=%2Fdashboard')}
                disabled={!isLoaded}
                style={{ opacity: !isLoaded ? 0.6 : 1, cursor: !isLoaded ? 'not-allowed' : 'pointer' }}
              >
                Join free — no card needed
                <ArrowIcon />
              </button>
              <span className="pkg-free-sub">Upgrade to a paid tier any time.</span>
            </div>
          </div>

          {/* ── Cards ── */}
          <div className="pkg-grid">
            {selfTiers.map((tierId) => {
              const tier = PLANS[tierId];
              const { amount, period } = calculateDisplayPrice(tier.monthlyPrice, interval);
              const billedLabel = interval === 'month' ? 'Billed monthly · No lock-in' : 'Billed annually · No lock-in';
              const isLoading = loading === tierId;

              return (
                <div className={`pkg-card ${tier.highlight ? 'featured' : ''}`} key={tierId}>
                  {tier.highlight && <span className="pkg-badge-pop">★ Most popular</span>}
                  <div className="pkg-name">{tier.name}</div>
                  <div className="pkg-tagline">{tier.tagline}</div>
                  <div className="pkg-price">
                    ${amount.toLocaleString()}
                    <span className="unit">{period}</span>
                  </div>
                  <div className="pkg-terms">{billedLabel}</div>
                  <p className="pkg-desc">{tier.description}</p>
                  <ul className="pkg-features">
                    {tier.features.map((f) => <li key={f}>{f}</li>)}
                  </ul>
                  <div className="pkg-addon-slot">
                    {tier.addOnNote && <div className="pkg-addon">{tier.addOnNote}</div>}
                  </div>
                  <div className="pkg-cta">
                    <button
                      type="button"
                      className={`btn ${tier.highlight ? 'btn-lime' : 'btn-primary'}`}
                      onClick={() => startCheckout(tierId)}
                      disabled={isLoading || !isLoaded}
                      style={{ width: '100%', opacity: isLoading || !isLoaded ? 0.6 : 1, cursor: isLoading || !isLoaded ? 'not-allowed' : 'pointer' }}
                    >
                      {isLoading ? 'Loading…' : `Start with ${tier.name}`}
                      {!isLoading && <ArrowIcon />}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

        </div>
      </section>

      {/* Compare Options */}
      <div className="compare-toggle-wrap">
        <button
          type="button"
          className={`compare-toggle ${showCompare ? 'open' : ''}`}
          aria-expanded={showCompare}
          onClick={() => setShowCompare((v) => !v)}
        >
          {showCompare ? 'Hide Comparison' : 'Compare Options'}
          <ChevronIcon />
        </button>
      </div>

      <ComparisonTable open={showCompare} />
    </>
  );
}
