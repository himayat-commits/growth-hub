import type { Metadata } from 'next';
import { SUMMIT } from '@/lib/summit';
import ExpoApplyForm from './ExpoApplyForm';

// Two-column layout mirroring the signup pages: event pitch + key facts on the
// left, the application form on the right. Event facts come from the single
// source of truth in src/lib/summit.ts so a date / venue / name change updates
// the landing page and this form together. The roles people can apply for live
// in the form's first step, so they aren't repeated in the left column.

const OG_DESC =
  'Apply to take part in Entrepreneurship for Everyone — a free, all-day small-business summit on 9 July 2026 at CBR Innovation Network, Canberra.';

export const metadata: Metadata = {
  title:
    'Call for stallholders, facilitators & advisors — Entrepreneurship for Everyone | Growth Hub by Himayat',
  description:
    'Apply to host a stall, run a workshop, or staff a help desk at Entrepreneurship for Everyone — a free, all-day small-business summit on 9 July 2026 at CBR Innovation Network, Canberra.',
  alternates: { canonical: '/expo/apply' },
  openGraph: {
    title: 'Call for stallholders, facilitators & advisors — Entrepreneurship for Everyone',
    description: OG_DESC,
    url: '/expo/apply',
    type: 'website',
    siteName: 'Growth Hub by Himayat',
    locale: 'en_AU',
    images: [{ url: '/og-image.png', width: 1200, height: 630 }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Call for stallholders, facilitators & advisors — Entrepreneurship for Everyone',
    description: OG_DESC,
  },
};

export default function ExpoApplyPage() {
  return (
    <main className="signup-main">
      <div className="wrap">
        <div className="signup-grid">
          {/* Left summary column */}
          <div className="signup-summary">
            <div className="signup-eyebrow">
              Call for involvement · with CBR Innovation Network
            </div>
            <h1 className="signup-title">
              Stallholders, facilitators &amp; advisors.
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
