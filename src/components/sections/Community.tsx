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

// ── Hardcoded tabs (original rich JSX panels) ────────────────────────────────

const TABS = [
  {
    key: "events",
    label: "In-Person Events",
    badge: "Free & Subscriber",
    locked: false,
    Icon: CalIcon,
    panel: (
      <div className="comm-panel-inner comm-panel-events">
        <div className="comm-panel-left">
          <div className="comm-tag">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M12 21 C 7 15 4 11 4 8 A 8 8 0 0 1 20 8 C 20 11 17 15 12 21 Z" /><circle cx="12" cy="9" r="2.5" />
            </svg>
            In Person · Canberra &amp; Online
          </div>
          <h3>Learn, network and grow together</h3>
          <p>
            We run regular workshops and in-person meetups across Canberra.{" "}
            <strong>Some are free and open to everyone, others are reserved just for subscribers.</strong>{" "}
            Every event is designed to help local business owners build skills, share wins, and connect with a community that&apos;s genuinely in their corner.
          </p>
        </div>
        <div className="comm-panel-right">
          <div className="comm-events-head">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <rect x="3" y="5" width="18" height="16" rx="2" /><path d="M3 9h18M8 3v4M16 3v4" />
            </svg>
            <span>Upcoming Events</span>
          </div>
          <div className="comm-event">
            <span className="comm-event-title">A full calendar — workshops, mixers, clinics and an annual summit.</span>
            <span className="comm-event-loc">Canberra · Mostly free · always inclusive</span>
            <a
              href="/events"
              className="btn btn-secondary"
              style={{ alignSelf: "flex-start", marginTop: 14 }}
            >
              See what&apos;s on
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" aria-hidden="true">
                <path d="M3 7h8M7 3l4 4-4 4" />
              </svg>
            </a>
          </div>
        </div>
      </div>
    ),
  },
  {
    key: "webinar",
    label: "Weekly Live Webinar",
    badge: "Subscribers Only",
    locked: true,
    Icon: WifiIcon,
    panel: (
      <div className="comm-panel-inner comm-panel-split">
        <div className="comm-panel-left">
          <div className="comm-tag">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <rect x="3" y="5" width="18" height="16" rx="2" /><path d="M3 9h18M8 3v4M16 3v4" />
            </svg>
            Live · Every Week
          </div>
          <h3>Weekly live sessions with the Himayat team</h3>
          <p>Part training, part Q&amp;A, part community hangout. Bring your questions, share your wins, and learn what&apos;s working for other local businesses in the network.</p>
        </div>
        <ul className="comm-bullets">
          <li>Platform walkthroughs and feature deep-dives</li>
          <li>Practical digital marketing education</li>
          <li>Live Q&amp;A with the Himayat team</li>
          <li>Recordings available if you can&apos;t make it live</li>
        </ul>
      </div>
    ),
  },
  {
    key: "community",
    label: "Community Access",
    badge: "Subscribers Only",
    locked: true,
    Icon: PeopleIcon,
    panel: (
      <div className="comm-panel-inner comm-panel-split">
        <div className="comm-panel-left">
          <div className="comm-tag">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <circle cx="9" cy="9" r="3" /><path d="M3 19c0-3 3-5 6-5s6 2 6 5" />
            </svg>
            Peer Support · Always On
          </div>
          <h3>A network of owners who back each other</h3>
          <p>You&apos;re never on your own. The moment you sign up, you&apos;re part of a network of Canberra business owners who share advice, refer each other, and celebrate wins together.</p>
        </div>
        <ul className="comm-bullets">
          <li>Private Slack workspace for day-to-day questions</li>
          <li>Facebook group for wider conversation and wins</li>
          <li>WhatsApp group for quick help and local chat</li>
          <li>Member-to-member referrals and introductions</li>
        </ul>
      </div>
    ),
  },
  {
    key: "support",
    label: "Email Support",
    badge: "Subscribers Only",
    locked: true,
    Icon: MailIcon,
    panel: (
      <div className="comm-panel-inner comm-panel-split">
        <div className="comm-panel-left">
          <div className="comm-tag">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <rect x="3" y="5" width="18" height="14" rx="2" /><path d="M3 7l9 7 9-7" />
            </svg>
            48-Hour Response
          </div>
          <h3>Real humans, real help</h3>
          <p>Stuck on something? Email us and a real human from the Himayat team will get back to you. No ticket queues, no offshore call centres, no chatbots pretending to help.</p>
        </div>
        <ul className="comm-bullets">
          <li>Platform access and login help</li>
          <li>Troubleshooting setup issues</li>
          <li>48-hour response time across all tiers</li>
          <li>Escalation to the Himayat team for anything urgent</li>
        </ul>
      </div>
    ),
  },
];

// ── Props (kept for CMS BlockRenderer compatibility) ─────────────────────────

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

// ── Component ─────────────────────────────────────────────────────────────────

export default function Community({ heading, subheading }: CommunityProps) {
  const [active, setActive] = useState(0);

  return (
    <section id="community" className="community">
      <div className="wrap">
        <h2 className="comm-h2">
          {heading ?? "You’re not just buying software."}
          <br />
          {subheading ?? "You’re joining a community that has your back."}
        </h2>

        <div className="comm-tabs" role="tablist">
          {TABS.map((t, i) => (
            <button
              key={t.key}
              role="tab"
              aria-selected={active === i}
              className={`comm-tab ${active === i ? "active" : ""}`}
              onClick={() => setActive(i)}
            >
              <span className="comm-tab-icon" aria-hidden="true">
                <t.Icon />
              </span>
              <span className="comm-tab-label">{t.label}</span>
              <span className={`comm-tab-badge ${t.locked ? "locked" : ""}`}>
                {t.locked && <LockIcon />}
                {t.badge}
              </span>
            </button>
          ))}
        </div>

        <div className="comm-panel" role="tabpanel" key={TABS[active].key}>
          {TABS[active].panel}
        </div>
      </div>
    </section>
  );
}
