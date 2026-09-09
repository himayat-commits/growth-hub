import type { Metadata } from 'next';
import Link from 'next/link';
import { SUMMIT, isSummitPast } from '@/lib/summit';
import ExpoApplyForm from './ExpoApplyForm';

// Two-column layout mirroring the signup pages: event pitch + key facts on the
// left, the application form on the right. Event facts come from the single
// source of truth in src/lib/summit.ts so a date / venue / name change updates
// the landing page and this form together. The roles people can apply for live
// in the form's first step, so they aren't repeated in the left column.

const OG_DESC =
  'Apply to take part in Entrepreneurship for Everyone — a free, all-day small-business summit on 9 July 2026 at the Ann Harding Conference Centre, University of Canberra.';

export const metadata: Metadata = {
  title:
    'Call for stallholders, facilitators & speakers — Entrepreneurship for Everyone | Growth Hub by Himayat',
  description:
    'Apply to host a stall, run a workshop, or speak at Entrepreneurship for Everyone — a free, all-day small-business summit on 9 July 2026 at the Ann Harding Conference Centre, University of Canberra.',
  alternates: { canonical: '/expo/apply' },
  openGraph: {
    title: 'Call for stallholders, facilitators & speakers — Entrepreneurship for Everyone',
    description: OG_DESC,
    url: '/expo/apply',
    type: 'website',
    siteName: 'Growth Hub by Himayat',
    locale: 'en_AU',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Call for stallholders, facilitators & speakers — Entrepreneurship for Everyone',
    description: OG_DESC,
  },
};

export default function ExpoApplyPage() {
  // The summit has run: keep the page (it is linked from HubSpot emails and
  // search results) but stop taking applications for a past event.
  const closed = isSummitPast();
  return (
    <main className="signup-main">
      <div className="wrap">
        <div className="signup-grid">
          {/* Left summary column */}
          <div className="signup-summary">
            <div className="signup-eyebrow">
              {closed
                ? 'Applications closed · thanks to everyone who took part'
                : 'Call for involvement · with CBR Innovation Network'}
            </div>
            <h1 className="signup-title">
              {closed ? 'The 2026 call has closed.' : <>Stallholders, facilitators &amp; speakers.</>}
            </h1>
            <p className="signup-tagline">
              {closed ? (
                <>
                  {SUMMIT.name} ran on {SUMMIT.dateLong}. We&apos;ll open the next call for
                  stallholders, facilitators and speakers here — join the newsletter and
                  we&apos;ll email you first.
                </>
              ) : (
                <>
                  We&apos;re building a free, all-day expo for Canberra small business —
                  and we&apos;d love you to be part of it.
                </>
              )}
            </p>

            <div className="signup-pricecard featured">
              <span className="signup-freetag">{closed ? 'Held 9 July 2026' : 'Free to take part'}</span>
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
              {closed ? (
                <div className="signup-closed" style={{ display: 'grid', gap: 16 }}>
                  <h2 className="section-h2" style={{ margin: 0 }}>Next time, you&apos;re in.</h2>
                  <p>
                    Applications for the 2026 summit are closed. Workshops, webinars and clinics
                    run all year — see what&apos;s on, or drop us a line if you&apos;d like to
                    co-host something sooner.
                  </p>
                  <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                    <Link className="btn btn-primary" href="/events#upcoming">See upcoming events</Link>
                    <a className="btn btn-secondary" href="mailto:hello@himayat.com.au?subject=Co-hosting%20an%20event">Talk to us</a>
                  </div>
                </div>
              ) : (
                <ExpoApplyForm />
              )}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
