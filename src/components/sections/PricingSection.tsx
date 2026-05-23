"use client";

import { useState } from "react";
import Link from "next/link";
import { track } from "@/lib/analytics";

interface Tier {
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
  slug?: string;
}

const SELF: Tier[] = [
  {
    name: "Foundations",
    tag: "Get online. Get noticed.",
    price: 299,
    terms: "Billed monthly · No lock-in",
    desc: "The essential digital presence for businesses building their online footprint.",
    features: [
      "Invoicing",
      "Social AI: content creation & scheduling",
      "Listing AI: 50+ directory management",
      "Messaging: unified inbox for all channels",
      "Community + weekly webinars included",
    ],
    cta: "Start with Foundations",
    slug: "foundations",
  },
  {
    name: "Growth",
    tag: "Build trust. Build reputation.",
    price: 499,
    terms: "Billed monthly · No lock-in",
    desc: "The reputation engine for businesses ready to grow through trust.",
    features: [
      "Everything in Foundations",
      "Timesheets & Docketing",
      "Reviews AI: automated generation & responses",
      "Review Collateral Kit: QR cards, badges, templates",
    ],
    addon: "Add Search AI from $99/mo",
    cta: "Start with Growth",
    featured: true,
    badge: "Most popular",
    slug: "growth",
  },
  {
    name: "Accelerate",
    tag: "Convert visitors into customers.",
    price: 799,
    terms: "Billed monthly · No lock-in",
    desc: "The full conversion engine for turning visibility into revenue.",
    features: [
      "Everything in Growth",
      "Scheduling + Rostering",
      "Webchat AI (Robin): 24/7 lead capture",
      "Campaign Templates: SMS & email automation",
    ],
    addon: "Add Referrals from $175/mo",
    cta: "Start with Accelerate",
    slug: "accelerate",
  },
];

const MANAGED: Tier[] = [
  {
    name: "Managed Pro",
    tag: "We run it. You grow.",
    price: 1499,
    terms: "Billed monthly · 6-month minimum",
    desc: "Expert hands on your digital marketing — without hiring a team.",
    features: [
      "Full Accelerate platform access",
      "12 managed social posts/month",
      "Review response management (24hr)",
      "Monthly strategy call & dedicated manager",
      "First month bonus: logo + 1-page website",
    ],
    cta: "Enquire Now",
  },
  {
    name: "Managed Elite",
    tag: "Your entire online growth engine.",
    price: 2499,
    terms: "Billed monthly · 6-month minimum",
    desc: "Hands-off digital marketing with full competitive intelligence.",
    features: [
      "Everything in Managed Pro",
      "20 social posts/mo + custom design",
      "Search AI + Competitor AI + Insights",
      "Local SEO + Google Ads management",
      "Fortnightly strategy + full brand & website build",
    ],
    cta: "Enquire Now",
    featured: true,
    badge: "All-in",
  },
];

const TIERS_COMPARE = [
  { name: "Foundations", price: "$299/mo" },
  { name: "Growth", price: "$499/mo" },
  { name: "Accelerate", price: "$799/mo" },
  { name: "Managed Pro", price: "$1,499/mo" },
  { name: "Managed Elite", price: "$2,499/mo" },
];

const C = "✓", D = "—", M = "Managed";
const ROWS: [string, string[] | null][] = [
  ["Support", null],
  ["Support Level", ["Basic email", "Basic email", "Basic email", "Dedicated manager", "Priority same-day"]],
  ["Onboarding Videos", [C, C, C, C, C]],
  ["Weekly Live Webinar", [C, C, C, C, C]],
  ["Community Access", [C, C, C, C, C]],
  ["In-Person Events", [C, C, C, C, C]],
  ["Work Management Modules", null],
  ["Invoicing", [C, C, C, M, M]],
  ["Timesheets & Docketing", [D, C, C, M, M]],
  ["Scheduling & Rostering", [D, D, C, M, M]],
  ["Marketing Platform Modules", null],
  ["Social AI", [C, C, C, M, M]],
  ["Listing AI", [C, C, C, M, M]],
  ["Messaging", [C, C, C, C, C]],
  ["Reviews AI", [D, C, C, M, M]],
  ["Review Collateral Kit", [D, C, C, C, C]],
  ["Webchat AI (Robin)", [D, D, C, C, C]],
  ["Referrals", [D, "Add-on $175", "Add-on $175", C, M]],
  ["Search AI", [D, "Add-on $99", "Add-on $99", D, M]],
  ["Insights", [D, D, D, D, M]],
  ["Competitor AI", [D, D, D, D, M]],
  ["Managed Services", null],
  ["Social Media Posts", [D, D, D, "12/mo", "20/mo + design"]],
  ["Review Management", [D, D, D, "24hr response", "24hr response"]],
  ["Strategy Calls", [D, D, D, "Monthly (45m)", "Fortnightly"]],
  ["Account Manager", [D, D, D, C, "Priority"]],
  ["Local SEO", [D, D, D, D, C]],
  ["Google Ads", [D, D, D, D, C]],
  ["Website Updates", [D, D, D, D, "4 hrs/mo"]],
  ["Blog Content", [D, D, D, D, "1/mo"]],
  ["SMS/Email Campaigns", [D, D, D, D, "2x/mo"]],
  ["First Month Setup", null],
  ["Logo Design", [D, D, D, "Basic", "Brand setup"]],
  ["Website Build", [D, D, D, "1-page", "Full build"]],
];

function CellContent({ v }: { v: string }) {
  if (v === C) return <td className="center check">✓</td>;
  if (v === D) return <td className="center dash">—</td>;
  if (v === M) return <td className="center"><span className="cmp-pill cmp-pill-managed">Managed</span></td>;
  if (v.startsWith("Add-on")) return <td className="center"><span className="cmp-pill cmp-pill-addon">{v}</span></td>;
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
                    <th key={t.name}>
                      {t.name}
                      <span className="tier-price">{t.price}</span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {ROWS.map((r, i) =>
                  r[1] === null ? (
                    <tr className="group-header" key={i}>
                      <td colSpan={6}>{r[0]}</td>
                    </tr>
                  ) : (
                    <tr key={i}>
                      <td>{r[0]}</td>
                      {(r[1] as string[]).map((v, j) => (
                        <CellContent key={j} v={v} />
                      ))}
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

function ArrowIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
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

export interface PricingSectionProps {
  heading?: string | null;
  subheading?: string | null;
}

export default function PricingSection({ heading, subheading }: PricingSectionProps = {}) {
  const [mode, setMode] = useState<"self" | "managed">("self");
  const [showCompare, setShowCompare] = useState(false);
  const tiers = mode === "self" ? SELF : MANAGED;

  return (
    <>
      <section id="packages" className="pkg">
        <div className="wrap">
          <div className="pkg-head-centered" style={{ display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center" }}>
            <span className="section-label">Pricing</span>
            <h2 className="section-h2" style={{ marginTop: 8 }}>{heading ?? "Choose your level of support."}</h2>
            {subheading && <p style={{ marginTop: 8 }}>{subheading}</p>}
            <div className="pkg-toggle-row">
              <div className="pkg-toggle" role="tablist">
                <button
                  role="tab"
                  aria-selected={mode === "self"}
                  className={mode === "self" ? "active" : ""}
                  onClick={() => {
                    setMode("self");
                    track('pricing_interval_toggle', { location: 'home', mode: 'self' });
                  }}
                >
                  Self-Service
                </button>
                <button
                  role="tab"
                  aria-selected={mode === "managed"}
                  className={mode === "managed" ? "active" : ""}
                  onClick={() => {
                    setMode("managed");
                    track('pricing_interval_toggle', { location: 'home', mode: 'managed' });
                  }}
                >
                  Done For You
                </button>
              </div>
              <span className="pkg-info" tabIndex={0} role="button" aria-label="More information about pricing tiers">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="16" x2="12" y2="12" />
                  <line x1="12" y1="8" x2="12.01" y2="8" />
                </svg>
                <span className="pkg-info-tip" role="tooltip">
                  Three self-service tiers to grow at your own pace, or two managed options where we handle everything.
                </span>
              </span>
            </div>
          </div>

          {/* Free-tier entry banner — only on the Self-Service ladder.
              Anchors the price ladder at $0 so visitors comparison-shopping
              see the no-card option without scrolling further. Reuses the
              same .pkg-free-banner styles as /pricing for consistency. */}
          {mode === "self" && (
            <div className="pkg-free-banner" role="region" aria-label="Free Member tier">
              <div className="pkg-free-copy">
                <div className="pkg-free-tag">Start free · no card needed</div>
                <h3 className="pkg-free-h">Free Member</h3>
                <p className="pkg-free-p">
                  Community access, the public resource library, and one complimentary 30-minute Growth Call. Upgrade to a paid tier whenever you&apos;re ready.
                </p>
                <ul className="pkg-free-features">
                  <li>Public resource library</li>
                  <li>Community forum access</li>
                  <li>1 free Growth Call (30 min)</li>
                  <li>Weekly group webinars</li>
                </ul>
              </div>
              <div className="pkg-free-cta">
                <div className="pkg-free-price">
                  $0<span className="unit">/forever</span>
                </div>
                <Link
                  className="btn btn-primary"
                  href="/sign-up?redirect_url=%2Fdashboard"
                  onClick={() => track('free_tier_join', { location: 'home' })}
                >
                  Join free — no card needed <ArrowIcon />
                </Link>
                <span className="pkg-free-sub">Upgrade to a paid tier any time.</span>
              </div>
            </div>
          )}

          <div className={`pkg-grid ${mode === "managed" ? "managed" : ""}`}>
            {tiers.map((t) => (
              <div className={`pkg-card ${t.featured ? "featured" : ""}`} key={t.name}>
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
                <div className="pkg-addon-slot">
                  {t.addon && <div className="pkg-addon">+ {t.addon}</div>}
                </div>
                <div className="pkg-cta">
                  {t.slug ? (
                    <Link
                      className={`btn ${t.featured ? "btn-lime" : "btn-primary"}`}
                      href={`/signup/${t.slug}`}
                      onClick={() =>
                        track('cta_click_upgrade', {
                          location: 'home',
                          tier: t.slug,
                          mode,
                        })
                      }
                    >
                      {t.cta} <ArrowIcon />
                    </Link>
                  ) : (
                    <a
                      className={`btn ${t.featured ? "btn-lime" : "btn-primary"}`}
                      href="/#contact"
                      onClick={() =>
                        track('cta_click_upgrade', {
                          location: 'home',
                          tier: t.name,
                          mode,
                        })
                      }
                    >
                      {t.cta} <ArrowIcon />
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <div className="compare-toggle-wrap">
        <button
          type="button"
          className={`compare-toggle ${showCompare ? "open" : ""}`}
          aria-expanded={showCompare}
          onClick={() => {
            const next = !showCompare;
            setShowCompare(next);
            if (next) track('pricing_compare_open', { location: 'home' });
          }}
        >
          {showCompare ? "Hide Comparison" : "Compare Options"}
          <ChevronIcon />
        </button>
      </div>

      <ComparisonTable open={showCompare} />
    </>
  );
}
