"use client";

import { useState } from "react";
import type { PlanTier, AddOnId } from "@/lib/plans";

// ── Module definitions ────────────────────────────────────────────────────────

type ModuleRequires = { tier: PlanTier } | { addOn: AddOnId } | null;

interface PortalModule {
  id: string;
  name: string;
  tagline: string;
  desc: string;
  requires: ModuleRequires; // null = all tiers
  icon: React.ReactNode;
  steps: Array<{ text: string }>;
  videoUrl?: string;
}

function IconSocial() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
    </svg>
  );
}
function IconListing() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
    </svg>
  );
}
function IconMessaging() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </svg>
  );
}
function IconInvoice() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" />
    </svg>
  );
}
function IconTimesheets() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
      <path d="M8 14h.01M12 14h.01M16 14h.01M8 18h.01M12 18h.01" />
    </svg>
  );
}
function IconReviews() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
    </svg>
  );
}
function IconCollateral() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" />
      <rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" />
    </svg>
  );
}
function IconSearch() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
    </svg>
  );
}
function IconScheduling() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );
}
function IconWebchat() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M12 2a10 10 0 0 1 10 10c0 5.52-4.48 10-10 10a9.96 9.96 0 0 1-5.19-1.45L2 21l1.45-4.81A9.96 9.96 0 0 1 2 12 10 10 0 0 1 12 2z" />
      <path d="M8 10h.01M12 10h.01M16 10h.01" />
    </svg>
  );
}
function IconCampaigns() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
      <polyline points="22,6 12,13 2,6" />
    </svg>
  );
}
function IconReferrals() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
      <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
    </svg>
  );
}
function IconChevron({ open }: { open: boolean }) {
  return (
    <svg
      width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor"
      strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"
      style={{ transform: open ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.2s" }}
    >
      <path d="M4 6l4 4 4-4" />
    </svg>
  );
}
function IconLock() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  );
}
function IconArrow() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M3 7h8M7 3l4 4-4 4" />
    </svg>
  );
}

// ── Module data ───────────────────────────────────────────────────────────────

const ALL_MODULES: PortalModule[] = [
  {
    id: "social_ai",
    name: "Social AI",
    tagline: "Content creation & scheduling",
    desc: "AI writes and schedules your social posts across every platform — set it once and let it run.",
    requires: null,
    icon: <IconSocial />,
    steps: [
      { text: "Connect your Facebook, Instagram, and Google Business profiles" },
      { text: "Set your posting schedule (recommended: 3–4 posts/week)" },
      { text: "Review your first batch of AI-generated content" },
      { text: "Approve and schedule — the AI handles the rest" },
    ],
    videoUrl: "https://himayat.com.au/onboarding-videos#social-ai",
  },
  {
    id: "listing_ai",
    name: "Listing AI",
    tagline: "50+ directory management",
    desc: "Your business name, address, and hours stay accurate across 50+ directories automatically.",
    requires: null,
    icon: <IconListing />,
    steps: [
      { text: "Enter your business name, address, phone, and hours" },
      { text: "Let Listing AI scan for inconsistent listings" },
      { text: "Approve the corrections — synced everywhere" },
      { text: "Turn on auto-sync to keep listings current" },
    ],
    videoUrl: "https://himayat.com.au/onboarding-videos#listing-ai",
  },
  {
    id: "messaging",
    name: "Messaging",
    tagline: "Unified inbox for all channels",
    desc: "Every customer message — Facebook, Google, SMS, webchat — in a single inbox your team shares.",
    requires: null,
    icon: <IconMessaging />,
    steps: [
      { text: "Connect your messaging channels (Facebook, Google, SMS)" },
      { text: "Set up auto-responses for after-hours enquiries" },
      { text: "Add team members to share the inbox" },
      { text: "Respond to your first message from the unified view" },
    ],
    videoUrl: "https://himayat.com.au/onboarding-videos#messaging",
  },
  {
    id: "invoicing",
    name: "Invoicing",
    tagline: "Branded invoices from Growth Hub",
    desc: "Generate professional invoices with your branding and send them directly — no double-entry into accounting tools.",
    requires: null,
    icon: <IconInvoice />,
    steps: [
      { text: "Upload your logo and set your business details" },
      { text: "Create your first invoice template" },
      { text: "Send your first invoice to a customer" },
      { text: "Set up payment reminders for overdue invoices" },
    ],
    videoUrl: "https://himayat.com.au/onboarding-videos#invoicing",
  },
  {
    id: "timesheets",
    name: "Timesheets & Docketing",
    tagline: "Digital forms, timesheets, and job records",
    desc: "Replaces paper checklists, food safety logs, intake forms, and SWMS records with audit-ready digital records.",
    requires: { tier: "growth" },
    icon: <IconTimesheets />,
    steps: [
      { text: "Choose a template (food safety log, timesheet, job report, or custom)" },
      { text: "Customise fields to match your business workflows" },
      { text: "Share the form link with staff or clients" },
      { text: "Review completed records in your dashboard" },
    ],
    videoUrl: "https://himayat.com.au/onboarding-videos#timesheets",
  },
  {
    id: "reviews_ai",
    name: "Reviews AI",
    tagline: "Automated review generation & responses",
    desc: "Sends review requests after every job and writes personalised responses to every review you receive.",
    requires: { tier: "growth" },
    icon: <IconReviews />,
    steps: [
      { text: "Connect your Google Business Profile and Facebook page" },
      { text: "Set your review request message (Growth Hub provides a default)" },
      { text: "Enable auto-send: review requests go out after every transaction" },
      { text: "Turn on AI responses so every review gets a reply within 24 hours" },
    ],
    videoUrl: "https://himayat.com.au/onboarding-videos#reviews-ai",
  },
  {
    id: "collateral",
    name: "Review Collateral Kit",
    tagline: "QR cards, window badges, email templates",
    desc: "Printable and digital assets that prompt customers to leave reviews at the moment they're happiest.",
    requires: { tier: "growth" },
    icon: <IconCollateral />,
    steps: [
      { text: "Download your personalised QR card (links directly to your Google review page)" },
      { text: "Print the table card or window badge for your premises" },
      { text: "Add the review request signature block to your emails" },
      { text: "Share the digital version via WhatsApp or SMS after jobs" },
    ],
    videoUrl: "https://himayat.com.au/onboarding-videos#collateral",
  },
  {
    id: "search_ai",
    name: "Search AI",
    tagline: "Local search visibility",
    desc: "Tracks your search rankings, identifies gaps, and publishes optimised content to help local customers find you.",
    requires: { addOn: "search_ai" },
    icon: <IconSearch />,
    steps: [
      { text: "Run your first local search audit" },
      { text: "Review your keyword gaps vs competitors" },
      { text: "Publish your first AI-generated SEO post" },
      { text: "Set up weekly ranking reports" },
    ],
    videoUrl: "https://himayat.com.au/onboarding-videos#search-ai",
  },
  {
    id: "scheduling",
    name: "Scheduling + Rostering",
    tagline: "Drag-and-drop job scheduling",
    desc: "Real-time wage cost forecasting, leave management, and Fair Work compliant records — replaces spreadsheets and group chats.",
    requires: { tier: "accelerate" },
    icon: <IconScheduling />,
    steps: [
      { text: "Add your team members and their roles/rates" },
      { text: "Create your first job or shift on the schedule board" },
      { text: "Set up leave approval workflows" },
      { text: "Enable wage cost forecasting to see your weekly labour budget" },
    ],
    videoUrl: "https://himayat.com.au/onboarding-videos#scheduling",
  },
  {
    id: "webchat",
    name: "Webchat AI — Robin",
    tagline: "24/7 lead capture via your website",
    desc: "Robin answers questions and captures leads around the clock — even when you're closed or with a customer.",
    requires: { tier: "accelerate" },
    icon: <IconWebchat />,
    steps: [
      { text: "Install the Robin chat widget on your website (one line of code)" },
      { text: "Customise Robin's greeting and FAQs for your business" },
      { text: "Set up lead capture: name, email, and enquiry type" },
      { text: "Connect Robin leads to your Messaging inbox" },
    ],
    videoUrl: "https://himayat.com.au/onboarding-videos#webchat",
  },
  {
    id: "campaigns",
    name: "Campaign Templates",
    tagline: "SMS & email automation",
    desc: "Pre-built campaigns for follow-ups, re-engagement, and seasonal promotions — ready to send in minutes.",
    requires: { tier: "accelerate" },
    icon: <IconCampaigns />,
    steps: [
      { text: "Choose a campaign template (re-engagement, promo, follow-up)" },
      { text: "Customise the message and timing" },
      { text: "Import your customer list or pull from Messaging contacts" },
      { text: "Schedule and send — track opens and clicks in your dashboard" },
    ],
    videoUrl: "https://himayat.com.au/onboarding-videos#campaigns",
  },
  {
    id: "referrals",
    name: "Referrals",
    tagline: "Word-of-mouth, automated",
    desc: "Turns happy customers into active referrers with a trackable referral program that rewards both sides.",
    requires: { addOn: "referrals" },
    icon: <IconReferrals />,
    steps: [
      { text: "Set your referral reward (discount, credit, or gift)" },
      { text: "Customise your referral landing page" },
      { text: "Send your first referral invitations to existing customers" },
      { text: "Track referral conversions and reward payouts" },
    ],
    videoUrl: "https://himayat.com.au/onboarding-videos#referrals",
  },
];

// ── Tier ordering ─────────────────────────────────────────────────────────────

// Free Members rank below every paid tier. Modules with a `requires.tier`
// gate render as locked for them, matching the Foundations preview state.
const TIER_ORDER: Record<PlanTier, number> = { free: -1, foundations: 0, growth: 1, accelerate: 2 };
const TIER_NAMES: Record<PlanTier, string> = { free: "Free", foundations: "Foundations", growth: "Growth", accelerate: "Accelerate" };

function isModuleActive(mod: PortalModule, tier: PlanTier, activeAddOns: AddOnId[]): boolean {
  if (!mod.requires) return true;
  if ("tier" in mod.requires) return TIER_ORDER[tier] >= TIER_ORDER[mod.requires.tier];
  if ("addOn" in mod.requires) return activeAddOns.includes(mod.requires.addOn);
  return false;
}

function lockLabel(mod: PortalModule): string {
  if (!mod.requires) return "";
  if ("tier" in mod.requires) return `Available on ${TIER_NAMES[mod.requires.tier]}+`;
  if ("addOn" in mod.requires) return "Add-on required";
  return "";
}

// ── Component ─────────────────────────────────────────────────────────────────

interface Props {
  tier: PlanTier;
  activeAddOns: AddOnId[];
  /** Resolved Birdeye destination for "Open in platform" links. Deep-links
   *  to the user's business dashboard when provisioned, else the generic
   *  login. Passed from /services via getBirdeyeDashboardUrl(). */
  dashboardUrl: string;
  /** Whether the user's Birdeye account actually exists. When explicitly
   *  false (and setupHref is set), module cards link to the wizard instead
   *  of a platform login that would dead-end. Absent = legacy behavior. */
  provisioned?: boolean;
  /** Where "Finish setup first" sends a not-yet-provisioned user. */
  setupHref?: string;
}

export default function PortalModuleGrid({ tier, activeAddOns, dashboardUrl, provisioned, setupHref }: Props) {
  const [openId, setOpenId] = useState<string | null>(null);

  const activeModules = ALL_MODULES.filter((m) => isModuleActive(m, tier, activeAddOns));
  const lockedModules = ALL_MODULES.filter((m) => !isModuleActive(m, tier, activeAddOns));

  const toggle = (id: string) => setOpenId((prev) => (prev === id ? null : id));

  return (
    <div className="portal-modules">
      {/* Active modules */}
      <p className="portal-section-label">
        Your {activeModules.length} active module{activeModules.length !== 1 ? "s" : ""}
        <span className="portal-section-hint"> — click any card to see setup steps</span>
      </p>
      <div className="portal-grid">
        {activeModules.map((mod) => {
          const isOpen = openId === mod.id;
          return (
            <div
              key={mod.id}
              className={`portal-card${isOpen ? " is-open" : ""}`}
              onClick={() => toggle(mod.id)}
              role="button"
              tabIndex={0}
              aria-expanded={isOpen}
              onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); toggle(mod.id); } }}
            >
              <div className="portal-card-top">
                <span className="portal-card-icon">{mod.icon}</span>
                <div className="portal-card-info">
                  <p className="portal-card-name">{mod.name}</p>
                  <p className="portal-card-tagline">{mod.tagline}</p>
                </div>
                <span className="portal-card-chevron"><IconChevron open={isOpen} /></span>
              </div>
              <p className="portal-card-desc">{mod.desc}</p>

              {isOpen && (
                <div className="portal-card-steps" onClick={(e) => e.stopPropagation()}>
                  <p className="portal-steps-heading">Getting started</p>
                  <ol className="portal-step-list">
                    {mod.steps.map((s, i) => (
                      <li key={i} className="portal-step-item">
                        <span className="portal-step-num">{i + 1}</span>
                        <span>{s.text}</span>
                      </li>
                    ))}
                  </ol>
                  <div className="portal-card-links">
                    {provisioned === false && setupHref ? (
                      <a href={setupHref} className="portal-card-link primary">
                        Finish setup first <IconArrow />
                      </a>
                    ) : (
                      <a
                        href={dashboardUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="portal-card-link primary"
                      >
                        Open in platform <IconArrow />
                      </a>
                    )}
                    {mod.videoUrl && (
                      <a
                        href={mod.videoUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="portal-card-link secondary"
                      >
                        Watch walkthrough
                      </a>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Locked modules */}
      {lockedModules.length > 0 && (
        <>
          <p className="portal-section-label portal-section-label--locked">
            {lockedModules.length} more module{lockedModules.length !== 1 ? "s" : ""} available on higher tiers
          </p>
          <div className="portal-grid portal-grid--locked">
            {lockedModules.map((mod) => (
              <div key={mod.id} className="portal-card locked" aria-disabled="true">
                <div className="portal-card-top">
                  <span className="portal-card-icon">{mod.icon}</span>
                  <div className="portal-card-info">
                    <p className="portal-card-name">{mod.name}</p>
                    <p className="portal-card-tagline">{mod.tagline}</p>
                  </div>
                  <span className="portal-lock-icon"><IconLock /></span>
                </div>
                <p className="portal-card-desc">{mod.desc}</p>
                <span className="portal-upgrade-badge">{lockLabel(mod)}</span>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
