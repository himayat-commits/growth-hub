import type { Metadata } from "next";
import Link from "next/link";
import { withAuth } from "@workos-inc/authkit-nextjs";
import { requireSubscription } from "@/lib/subscription";
import { PLANS, ADDONS, getAddOnPriceId, type PlanTier, type AddOnId } from "@/lib/plans";
import PortalModuleGrid from "./PortalModuleGrid";

export const metadata: Metadata = {
  title: "Subscriber Portal — Growth Hub",
  description: "Access your Growth Hub tools, onboarding videos, and community resources.",
};

const ONBOARDING_VIDEO_URL = "https://himayat.com.au/onboarding-videos";
const WEBINAR_URL = "https://himayat.com.au/weekly-webinar";
const PLATFORM_URL = "https://app.birdeye.com";

const COMMUNITY_LINKS = [
  { label: "Slack", href: "https://himayat.slack.com" },
  { label: "Facebook", href: "https://facebook.com/groups/growthhub" },
  { label: "WhatsApp", href: "https://chat.whatsapp.com/growthhub" },
];

/** Resolve which add-on IDs the subscriber has by comparing stored Stripe
 *  price IDs against what the env has configured. Silently skips any
 *  add-on whose env var isn't set. */
function resolveActiveAddOns(priceIds: string[]): AddOnId[] {
  const active: AddOnId[] = [];
  for (const id of Object.keys(ADDONS) as AddOnId[]) {
    try {
      const pid = getAddOnPriceId(id);
      if (priceIds.includes(pid)) active.push(id);
    } catch {
      // env var not set — skip
    }
  }
  return active;
}

// ── SVG atoms ─────────────────────────────────────────────────────────────────

function VideoIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <polygon points="23 7 16 12 23 17 23 7" />
      <rect x="1" y="5" width="15" height="14" rx="2" />
    </svg>
  );
}
function CalendarIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="3" y="4" width="18" height="18" rx="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
    </svg>
  );
}
function PeopleIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );
}
function MailIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
      <polyline points="22,6 12,13 2,6" />
    </svg>
  );
}
function ArrowIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M3 7h8M7 3l4 4-4 4" />
    </svg>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default async function PortalPage() {
  const [sub, auth] = await Promise.all([
    requireSubscription(),
    withAuth(),
  ]);

  const planTier = (sub.planTier as PlanTier | null) ?? "foundations";
  const plan = PLANS[planTier];
  const firstName = auth.user?.firstName ?? null;
  const activeAddOns = resolveActiveAddOns(sub.addOnPriceIds ?? []);

  return (
    <main className="portal-main">
      <div className="wrap">

        {/* ── Back link ── */}
        <Link className="signup-back" href="/dashboard">
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" aria-hidden="true">
            <path d="M11 7H3M7 3 3 7l4 4" />
          </svg>
          Subscription &amp; billing
        </Link>

        {/* ── Header ── */}
        <div className="portal-head">
          <span className="section-label">Subscriber Portal</span>
          <h1 className="portal-h1">
            {firstName ? `Your Growth Hub, ${firstName}.` : "Your Growth Hub."}
          </h1>
          <p className="portal-sub">
            {plan.name} plan · Active — access your tools, videos, and community resources below.
          </p>
          <a
            href={PLATFORM_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-primary portal-platform-btn"
          >
            Open Growth Hub platform <ArrowIcon />
          </a>
        </div>

        {/* ── Module wizard ── */}
        <PortalModuleGrid tier={planTier} activeAddOns={activeAddOns} />

        {/* ── Resources ── */}
        <p className="portal-section-label" style={{ marginTop: 56 }}>Resources</p>
        <div className="portal-res-grid">

          <a href={ONBOARDING_VIDEO_URL} target="_blank" rel="noopener noreferrer" className="portal-res-card portal-res-card--teal">
            <span className="portal-res-icon"><VideoIcon /></span>
            <p className="portal-res-title">Onboarding videos</p>
            <p className="portal-res-desc">
              Short, plain-English walkthroughs for every module. Watch at your own pace — rewatch anytime.
            </p>
          </a>

          <a href={WEBINAR_URL} target="_blank" rel="noopener noreferrer" className="portal-res-card portal-res-card--plum">
            <span className="portal-res-icon"><CalendarIcon /></span>
            <p className="portal-res-title">Weekly live webinar</p>
            <p className="portal-res-desc">
              Part training, part Q&amp;A, part community hangout. Every week — recordings available if you miss it.
            </p>
          </a>

          <div className="portal-res-card portal-res-card--neutral">
            <span className="portal-res-icon"><PeopleIcon /></span>
            <p className="portal-res-title">Community</p>
            <p className="portal-res-desc">
              Connect with other local Canberra business owners. Ask questions, share wins, get referrals.
            </p>
            <div className="portal-res-chips">
              {COMMUNITY_LINKS.map(({ label, href }) => (
                <a key={label} href={href} target="_blank" rel="noopener noreferrer" className="portal-res-chip">
                  {label}
                </a>
              ))}
            </div>
          </div>

          <a href="mailto:hello@himayat.com.au" className="portal-res-card portal-res-card--lime">
            <span className="portal-res-icon"><MailIcon /></span>
            <p className="portal-res-title">Email support</p>
            <p className="portal-res-desc">
              A real person in Canberra reads every message. Reply within 48 hours — usually much faster.
            </p>
            <span className="portal-res-action">hello@himayat.com.au →</span>
          </a>

        </div>

        {/* ── Footer ── */}
        <div className="portal-footer">
          <Link href="/dashboard">Manage subscription →</Link>
          <Link href="/onboarding">Getting started guide →</Link>
          <span className="portal-footer-sep">·</span>
          <a href="mailto:hello@himayat.com.au">hello@himayat.com.au</a>
          <span className="portal-footer-sep">·</span>
          <a href="tel:0251190005">02 5119 0005</a>
        </div>

      </div>
    </main>
  );
}
