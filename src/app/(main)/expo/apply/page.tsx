import type { Metadata } from 'next';
import Link from 'next/link';
import { SUMMIT } from '@/lib/summit';
import ExpoApplyForm from './ExpoApplyForm';

// Two-column layout mirroring the signup pages: event pitch + key facts on
// the left, the HubSpot application form on the right. Event facts come from
// the single source of truth in src/lib/summit.ts so a date / venue / name
// change updates the landing page and this form together.

const OG_DESC =
  'Apply to take part in Entrepreneurship for Everyone — a free, all-day small-business summit on 9 July 2026 at CBR Innovation Network, Canberra.';

export const metadata: Metadata = {
  title:
    'Call for stallholders, facilitators & speakers — Entrepreneurship for Everyone | Growth Hub by Himayat',
  description:
    'Apply to host a stall, run a workshop, or speak at Entrepreneurship for Everyone — a free, all-day small-business summit on 9 July 2026 at CBR Innovation Network, Canberra.',
  alternates: { canonical: '/expo/apply' },
  openGraph: {
    title: 'Call for stallholders, facilitators & speakers — Entrepreneurship for Everyone',
    description: OG_DESC,
    url: '/expo/apply',
    type: 'website',
    siteName: 'Growth Hub by Himayat',
    locale: 'en_AU',
    images: [{ url: '/og-image.png', width: 1200, height: 630 }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Call for stallholders, facilitators & speakers — Entrepreneurship for Everyone',
    description: OG_DESC,
  },
};

// Three peer roles, not a sequence — the form lets people pick more than one,
// so they read as equal options (a storefront, a workshop tool, a mic) rather
// than numbered steps.
const ROLES = [
  {
    title: 'Host a stall',
    desc: 'Showcase your product or service at your own table in the expo hall, all day.',
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path d="M4 20V9l8-5 8 5v11" />
        <path d="M9 20v-5h6v5" />
      </svg>
    ),
  },
  {
    title: 'Run a workshop',
    desc: 'Teach a hands-on session that helps Canberra small businesses run and grow.',
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
      </svg>
    ),
  },
  {
    title: 'Speak on stage',
    desc: 'Share your story or expertise with a full house of local business owners.',
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
        <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
        <line x1="12" y1="19" x2="12" y2="23" />
        <line x1="8" y1="23" x2="16" y2="23" />
      </svg>
    ),
  },
];

export default function ExpoApplyPage() {
  return (
    <main className="signup-main">
      <div className="wrap">
        <Link href={SUMMIT.path} className="signup-back">
          ← Back to the event
        </Link>

        <div className="signup-grid">
          {/* Left summary column */}
          <div className="signup-summary">
            <div className="signup-eyebrow">
              Call for involvement · with CBR Innovation Network
            </div>
            <h1 className="signup-title">
              Stallholders, facilitators &amp; speakers.
            </h1>
            <p className="signup-tagline">
              We&apos;re building a free, all-day expo for Canberra small business —
              and we&apos;d love you to be part of it.
            </p>

            <div className="signup-pricecard featured">
              <span className="signup-freetag">Free to take part</span>
              <p className="signup-pricecard-name">{SUMMIT.name}</p>
              <p className="signup-pricecard-tagline">{SUMMIT.tagline}</p>
              <ul className="signup-features">
                <li>{SUMMIT.dateLong}</li>
                <li>{SUMMIT.time}</li>
                <li>{SUMMIT.venueFull}</li>
              </ul>
            </div>

            <ul className="expo-roles">
              {ROLES.map((role) => (
                <li className="expo-role" key={role.title}>
                  <span className="expo-role-icon" aria-hidden="true">
                    {role.icon}
                  </span>
                  <div>
                    <p className="expo-role-title">{role.title}</p>
                    <p className="expo-role-desc">{role.desc}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>

          {/* Right form column */}
          <div>
            <div className="signup-formwrap signup-formwrap--steps">
              <ExpoApplyForm />
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
