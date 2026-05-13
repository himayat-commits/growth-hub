'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@clerk/nextjs';
import { PLANS, calculateDisplayPrice, type BillingInterval, type PlanTier } from '@/lib/plans';

// ── Types ─────────────────────────────────────────────────────────────────────

interface ManagedTier {
  name: string;
  tag: string;
  price: number;
  terms: string;
  desc: string;
  features: string[];
  addon?: string;
  cta: string;
  featured?: boolean;
  badge?: string;
}

const MANAGED: ManagedTier[] = [
  {
    name: 'Managed Pro',
    tag: 'We run it. You grow.',
    price: 1499,
    terms: 'Billed monthly · 6-month minimum',
    desc: 'Expert hands on your digital marketing — without hiring a team.',
    features: [
      'Full Accelerate platform access',
      '12 managed social posts/month',
      'Review response management (24hr)',
      'Monthly strategy call & dedicated manager',
      'First month bonus: logo + 1-page website',
    ],
    cta: 'Enquire Now',
  },
  {
    name: 'Managed Elite',
    tag: 'Your entire online growth engine.',
    price: 2499,
    terms: 'Billed monthly · 6-month minimum',
    desc: 'Hands-off digital marketing with full competitive intelligence.',
    features: [
      'Everything in Managed Pro',
      '20 social posts/mo + custom design',
      'Search AI + Competitor AI + Insights',
      'Local SEO + Google Ads management',
      'Fortnightly strategy + full brand & website build',
    ],
    cta: 'Enquire Now',
    featured: true,
    badge: 'All-in',
  },
];

// ── Compare table ─────────────────────────────────────────────────────────────

const TIERS_COMPARE = [
  { name: 'Foundations', price: '$299/mo' },
  { name: 'Growth', price: '$499/mo' },
  { name: 'Accelerate', price: '$799/mo' },
  { name: 'Managed Pro', price: '$1,499/mo' },
  { name: 'Managed Elite', price: '$2,499/mo' },
];

const C = '✓', D = '—', M = 'Managed';
const ROWS: [string, string[] | null][] = [
  ['Support', null],
  ['Support Level', ['Basic email', 'Basic email', 'Basic email', 'Dedicated manager', 'Priority same-day']],
  ['Onboarding Videos', [C, C, C, C, C]],
  ['Weekly Live Webinar', [C, C, C, C, C]],
  ['Community Access', [C, C, C, C, C]],
  ['In-Person Events', [C, C, C, C, C]],
  ['Work Management Modules', null],
  ['Invoicing', [C, C, C, M, M]],
  ['Timesheets & Docketing', [D, C, C, M, M]],
  ['Scheduling & Rostering', [D, D, C, M, M]],
  ['Marketing Platform Modules', null],
  ['Social AI', [C, C, C, M, M]],
  ['Listing AI', [C, C, C, M, M]],
  ['Messaging', [C, C, C, C, C]],
  ['Reviews AI', [D, C, C, M, M]],
  ['Review Collateral Kit', [D, C, C, C, C]],
  ['Webchat AI (Robin)', [D, D, C, C, C]],
  ['Referrals', [D, 'Add-on $175', 'Add-on $175', C, M]],
  ['Search AI', [D, 'Add-on $99', 'Add-on $99', D, M]],
  ['Insights', [D, D, D, D, M]],
  ['Competitor AI', [D, D, D, D, M]],
  ['Managed Services', null],
  ['Social Media Posts', [D, D, D, '12/mo', '20/mo + design']],
  ['Review Management', [D, D, D, '24hr response', '24hr response']],
  ['Strategy Calls', [D, D, D, 'Monthly (45m)', 'Fortnightly']],
  ['Account Manager', [D, D, D, C, 'Priority']],
  ['Local SEO', [D, D, D, D, C]],
  ['Google Ads', [D, D, D, D, C]],
  ['Website Updates', [D, D, D, D, '4 hrs/mo']],
  ['Blog Content', [D, D, D, D, '1/mo']],
  ['SMS/Email Campaigns', [D, D, D, D, '2x/mo']],
  ['First Month Setup', null],
  ['Logo Design', [D, D, D, 'Basic', 'Brand setup']],
  ['Website Build', [D, D, D, '1-page', 'Full build']],
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
                    <tr className="group-header" key={i}><td colSpan={6}>{r[0]}</td></tr>
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
  const [mode, setMode] = useState<'self' | 'managed'>('self');
  const [interval, setInterval] = useState<BillingInterval>('month');
  const [loading, setLoading] = useState<PlanTier | null>(null);
  const [showCompare, setShowCompare] = useState(false);
  const { isLoaded, isSignedIn } = useUser();
  const router = useRouter();

  const selfTiers: PlanTier[] = ['foundations', 'growth', 'accelerate'];

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

            {/* Self-Service / Done For You toggle */}
            <div className="pkg-toggle-row">
              <div className="pkg-toggle" role="tablist">
                <button role="tab" aria-selected={mode === 'self'} className={mode === 'self' ? 'active' : ''} onClick={() => setMode('self')}>
                  Self-Service
                </button>
                <button role="tab" aria-selected={mode === 'managed'} className={mode === 'managed' ? 'active' : ''} onClick={() => setMode('managed')}>
                  Done For You
                </button>
              </div>
              <span className="pkg-info" tabIndex={0} role="button" aria-label="More information about pricing tiers">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <circle cx="12" cy="12" r="10" /><line x1="12" y1="16" x2="12" y2="12" /><line x1="12" y1="8" x2="12.01" y2="8" />
                </svg>
                <span className="pkg-info-tip" role="tooltip">
                  Three self-service tiers to grow at your own pace, or two managed options where we handle everything.
                </span>
              </span>
            </div>

            {/* Monthly / Annual toggle — only shown for Self-Service */}
            {mode === 'self' && (
              <div className="pkg-toggle-row" style={{ marginTop: 12 }}>
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
            )}
          </div>

          {/* ── Cards ── */}
          {mode === 'self' ? (
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
                        {isLoading ? 'Loading…' : `${tier.name === 'Foundations' ? 'Start with Foundations' : tier.name === 'Growth' ? 'Start with Growth' : 'Start with Accelerate'}`}
                        {!isLoading && <ArrowIcon />}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="pkg-grid managed">
              {MANAGED.map((t) => (
                <div className={`pkg-card ${t.featured ? 'featured' : ''}`} key={t.name}>
                  {t.badge && <span className="pkg-badge-pop">★ {t.badge}</span>}
                  <div className="pkg-name">{t.name}</div>
                  <div className="pkg-tagline">{t.tag}</div>
                  <div className="pkg-price">
                    ${t.price.toLocaleString()}
                    <span className="unit">/month</span>
                  </div>
                  <div className="pkg-terms">{t.terms}</div>
                  <p className="pkg-desc">{t.desc}</p>
                  <ul className="pkg-features">
                    {t.features.map((f) => <li key={f}>{f}</li>)}
                  </ul>
                  <div className="pkg-addon-slot" />
                  <div className="pkg-cta">
                    <a className={`btn ${t.featured ? 'btn-lime' : 'btn-primary'}`} href="/#contact">
                      {t.cta} <ArrowIcon />
                    </a>
                  </div>
                </div>
              ))}
            </div>
          )}

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
