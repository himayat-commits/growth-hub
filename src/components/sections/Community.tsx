"use client";

import { useState } from "react";

// ── Icon components ──────────────────────────────────────────────────────────

const CalIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="5" width="18" height="16" rx="2" /><path d="M3 9h18M8 3v4M16 3v4" />
  </svg>
);
const WifiIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <path d="M5 12a7 7 0 0 1 14 0" /><path d="M8.5 12a3.5 3.5 0 0 1 7 0" /><circle cx="12" cy="12" r="1.2" fill="currentColor" /><path d="M2 12a10 10 0 0 1 20 0" />
  </svg>
);
const PeopleIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="9" cy="9" r="3" /><path d="M3 19c0-3 3-5 6-5s6 2 6 5" /><circle cx="17" cy="8" r="2.2" /><path d="M15 19c0-2 1.5-3.6 4-4" />
  </svg>
);
const MailIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="5" width="18" height="14" rx="2" /><path d="M3 7l9 7 9-7" />
  </svg>
);
const LockIcon = () => (
  <svg width="9" height="11" viewBox="0 0 9 11" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <rect x="1" y="5" width="7" height="5.5" rx="1" /><path d="M2.5 5V3.2a2 2 0 0 1 4 0V5" />
  </svg>
);

// Icon mapping by slug
const SLUG_ICONS: Record<string, React.ComponentType> = {
  events: CalIcon,
  webinar: WifiIcon,
  community: PeopleIcon,
  support: MailIcon,
};

// ── Default hardcoded tabs ───────────────────────────────────────────────────

const DEFAULT_TABS = [
  {
    slug: "events",
    label: "In-Person Events",
    badge: "Free & Subscriber",
    locked: false,
    tagLine: "In Person · Canberra & Online",
    panelHeading: "Learn, network and grow together",
    panelDescription:
      "We run regular workshops and in-person meetups across Canberra. Some are free and open to everyone, others are reserved just for subscribers. Every event is designed to help local business owners build skills, share wins, and connect with a community that's genuinely in their corner.",
    features: [],
  },
  {
    slug: "webinar",
    label: "Weekly Live Webinar",
    badge: "Subscribers Only",
    locked: true,
    tagLine: "Live · Every Week",
    panelHeading: "Weekly live sessions with the Himayat team",
    panelDescription:
      "Part training, part Q&A, part community hangout. Bring your questions, share your wins, and learn what's working for other local businesses in the network.",
    features: [
      { text: "Platform walkthroughs and feature deep-dives" },
      { text: "Practical digital marketing education" },
      { text: "Live Q&A with the Himayat team" },
      { text: "Recordings available if you can't make it live" },
    ],
  },
  {
    slug: "community",
    label: "Community Access",
    badge: "Subscribers Only",
    locked: true,
    tagLine: "Peer Support · Always On",
    panelHeading: "A network of owners who back each other",
    panelDescription:
      "You're never on your own. The moment you sign up, you're part of a network of Canberra business owners who share advice, refer each other, and celebrate wins together.",
    features: [
      { text: "Private Slack workspace for day-to-day questions" },
      { text: "Facebook group for wider conversation and wins" },
      { text: "WhatsApp group for quick help and local chat" },
      { text: "Member-to-member referrals and introductions" },
    ],
  },
  {
    slug: "support",
    label: "Email Support",
    badge: "Subscribers Only",
    locked: true,
    tagLine: "48-Hour Response",
    panelHeading: "Real humans, real help",
    panelDescription:
      "Stuck on something? Email us and a real human from the Himayat team will get back to you. No ticket queues, no offshore call centres, no chatbots pretending to help.",
    features: [
      { text: "Platform access and login help" },
      { text: "Troubleshooting setup issues" },
      { text: "48-hour response time across all tiers" },
      { text: "Escalation to the Himayat team for anything urgent" },
    ],
  },
];

// ── Props ────────────────────────────────────────────────────────────────────

export interface CommunityProps {
  heading?: string | null;
  subheading?: string | null;
  tabs?: Array<{
    slug: string;
    label: string;
    badge?: string | null;
    locked?: boolean | null;
    tagLine?: string | null;
    panelHeading?: string | null;
    panelDescription?: string | null;
    features?: Array<{ text: string; id?: string | null }> | null;
    id?: string | null;
  }> | null;
}

export default function Community({ heading, subheading, tabs }: CommunityProps) {
  const [active, setActive] = useState(0);

  const resolvedTabs = tabs && tabs.length > 0 ? tabs : DEFAULT_TABS;
  const activeTab = resolvedTabs[active];
  const TabIcon = SLUG_ICONS[activeTab.slug] ?? CalIcon;

  return (
    <section id="community" className="community">
      <div className="wrap">
        <h2 className="comm-h2">
          {heading ?? "You're not just buying software."}
          {!heading && (
            <>
              <br />
              {subheading ?? "You're joining a community that has your back."}
            </>
          )}
          {heading && subheading && (
            <>
              <br />
              {subheading}
            </>
          )}
        </h2>

        <div className="comm-tabs" role="tablist">
          {resolvedTabs.map((t, i) => {
            const Icon = SLUG_ICONS[t.slug] ?? CalIcon;
            return (
              <button
                key={t.slug}
                role="tab"
                aria-selected={active === i}
                className={`comm-tab ${active === i ? "active" : ""}`}
                onClick={() => setActive(i)}
              >
                <span className="comm-tab-icon" aria-hidden="true">
                  <Icon />
                </span>
                <span className="comm-tab-label">{t.label}</span>
                <span className={`comm-tab-badge ${t.locked ? "locked" : ""}`}>
                  {t.locked && <LockIcon />}
                  {t.badge ?? ""}
                </span>
              </button>
            );
          })}
        </div>

        <div className="comm-panel" role="tabpanel" key={activeTab.slug}>
          <div className="comm-panel-inner comm-panel-split">
            <div className="comm-panel-left">
              {activeTab.tagLine && (
                <div className="comm-tag">
                  <TabIcon />
                  {activeTab.tagLine}
                </div>
              )}
              {activeTab.panelHeading && <h3>{activeTab.panelHeading}</h3>}
              {activeTab.panelDescription && <p>{activeTab.panelDescription}</p>}
            </div>
            {activeTab.features && activeTab.features.length > 0 && (
              <ul className="comm-bullets">
                {activeTab.features.map((f, fi) => (
                  <li key={fi}>{f.text}</li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
