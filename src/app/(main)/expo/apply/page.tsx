import type { Metadata } from 'next';
import Link from 'next/link';
import { SUMMIT } from '@/lib/summit';
import HubSpotForm from './HubSpotForm';

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

const ROLES = [
  {
    title: 'Host a stall',
    desc: 'Showcase your product or service at your own table in the expo hall, all day.',
  },
  {
    title: 'Run a workshop',
    desc: 'Teach a hands-on session that helps Canberra small businesses run and grow.',
  },
  {
    title: 'Speak on stage',
    desc: 'Share your story or expertise with a full house of local business owners.',
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
              <div className="signup-price">
                Free<span className="unit"> to take part</span>
              </div>
              <p style={{ fontSize: 13, margin: '8px 0 20px', opacity: 0.7 }}>
                {SUMMIT.name} · {SUMMIT.tagline}
              </p>
              <ul className="signup-features">
                <li>{SUMMIT.dateLong}</li>
                <li>{SUMMIT.time}</li>
                <li>{SUMMIT.venueFull}</li>
              </ul>
            </div>

            <ol className="expo-roles">
              {ROLES.map((role, i) => (
                <li className="expo-role" key={role.title}>
                  <span className="expo-role-num">{i + 1}</span>
                  <div>
                    <p className="expo-role-title">{role.title}</p>
                    <p className="expo-role-desc">{role.desc}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>

          {/* Right form column */}
          <div>
            <div className="signup-formwrap">
              <div className="signup-form-head">
                <p className="signup-form-eyebrow">Apply to take part</p>
                <h2 className="signup-form-title">
                  Three ways in.{' '}
                  <em style={{ color: 'var(--plum)' }}>
                    Tell us how you&apos;d like to help.
                  </em>
                </h2>
                <p className="signup-form-sub">
                  One short form for all three roles — tick whichever fit (you can
                  choose more than one) and we&apos;ll only ask what&apos;s relevant.
                  We read every application and reply within a few business days.
                </p>
              </div>
              <HubSpotForm />
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
