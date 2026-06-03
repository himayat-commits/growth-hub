import type { Metadata } from 'next';
import Link from 'next/link';
import { SUMMIT } from '@/lib/summit';
import HubSpotForm from './HubSpotForm';

// Event facts come from the single source of truth in src/lib/summit.ts so a
// date / venue / name change updates the landing page and this form together.
const EVENT = {
  title: SUMMIT.name,
  partner: 'with CBR Innovation Network',
  dateLong: SUMMIT.dateLong,
  time: SUMMIT.time,
  location: SUMMIT.venueFull,
};

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

export default function ExpoApplyPage() {
  return (
    <main>
      {/* HERO */}
      <section className="hero event-hero" id="top">
        <div className="wrap">
          <Link
            href={SUMMIT.path}
            className="ed-back"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              color: 'var(--plum)',
              fontSize: 14,
              marginBottom: 24,
            }}
          >
            ← Back to the event
          </Link>
          <div className="hero-eyebrow">
            <span className="dot" />
            Call for involvement · {EVENT.partner}
          </div>
          <h1 className="hero-h1">
            Stallholders, facilitators <span className="grow">&amp; speakers.</span>
          </h1>
          <p className="hero-sub">
            We&apos;re building a free, all-day expo for Canberra small business — and
            we&apos;d love you to be part of it. Apply to host a stall, run a workshop, or
            take the stage as a speaker at <strong>{EVENT.title}</strong>.
          </p>

          <div className="event-keyfacts">
            <div className="event-keyfact"><span className="lbl">When</span><span className="val">{EVENT.dateLong}</span></div>
            <div className="event-keyfact"><span className="lbl">Time</span><span className="val">{EVENT.time}</span></div>
            <div className="event-keyfact"><span className="lbl">Where</span><span className="val">{EVENT.location}</span></div>
            <div className="event-keyfact"><span className="lbl">To take part</span><span className="val"><em>Free</em></span></div>
          </div>
        </div>
      </section>

      {/* APPLICATION FORM */}
      <section className="contact" id="apply">
        <div className="wrap contact-wrap">
          <div className="contact-head">
            <span className="contact-eyebrow">
              <span className="dot" /> Apply to take part
            </span>
            <h2 className="contact-h2">
              Three ways in.<br />
              <em className="contact-h2-em">Tell us how you&apos;d like to help.</em>
            </h2>
            <p className="contact-lede">
              One short form for all three roles — tick whichever fit (you can choose more
              than one) and we&apos;ll only ask what&apos;s relevant. We read every
              application and reply within a few business days.
            </p>
          </div>

          <div className="contact-letter">
            <HubSpotForm />
          </div>
        </div>
      </section>
    </main>
  );
}
