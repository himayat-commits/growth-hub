import type { Metadata } from 'next';
import { ogBase, twitterBase } from '../shared-metadata';
import Link from 'next/link';
import NewsletterStrip from '@/components/NewsletterStrip';
import { GUIDES } from '@/lib/guides';

const TITLE = 'Free guides for small business — Growth Hub by Himayat';
const DESCRIPTION =
  'Plain-English checklists from the Growth Hub Sessions: digital set-up, being found online, practical AI, cyber basics and choosing software. Free, for Canberra owners and sole traders.';

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: '/guides' },
  openGraph: { ...ogBase, title: TITLE, description: DESCRIPTION, url: '/guides' },
  twitter: { ...twitterBase, title: TITLE, description: DESCRIPTION },
};

export default function GuidesPage() {
  const topics = GUIDES.filter((g) => g.area !== 'Build Lab');
  const labPrep = GUIDES.find((g) => g.area === 'Build Lab');

  return (
    <main>
      <section className="site-hero">
        <div className="wrap">
          <span className="section-label">Free guides</span>
          <h1 className="hero-h1" style={{ maxWidth: '16ch' }}>One practical topic. One checklist.</h1>
          <p className="site-lede" style={{ maxWidth: '52ch' }}>
            The checklists we work through at Growth Hub Sessions, written in plain English.
            Read one in ten minutes, then do it over a week. No sign-up, no pitch.
          </p>
        </div>
      </section>

      <section className="site-sec site-sec--white">
        <div className="wrap">
          <div className="site-head">
            <span className="section-label">The five Session topics</span>
            <h2 className="section-h2">Start with the one that&apos;s costing you most</h2>
          </div>
          <div className="site-grid">
            {topics.map((g) => (
              <div className="site-card site-card--egg" key={g.slug}>
                <span className="site-tag site-tag--free">{g.area}</span>
                <h3>{g.title}</h3>
                <p>{g.summary}</p>
                <span className="site-fine">{g.time}</span>
                <Link className="site-link" href={`/guides/${g.slug}`}>Read the guide</Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {labPrep && (
        <section className="site-sec">
          <div className="wrap">
            <div className="site-panel site-panel--plum">
              <div>
                <span className="section-label">Booked a Build Lab?</span>
                <h2 className="section-h2">{labPrep.title}</h2>
              </div>
              <div>
                <p>{labPrep.summary}</p>
                <Link className="btn btn-lime" href={`/guides/${labPrep.slug}`}>Read the prep guide</Link>
              </div>
            </div>
          </div>
        </section>
      )}

      <section className="site-sec site-sec--tight">
        <div className="wrap">
          <div className="site-panel site-panel--lime">
            <h2 className="section-h2">Rather do it in a room, with people beside you?</h2>
            <div>
              <p>Every guide is a Growth Hub Session topic. Sessions are free, monthly and in person.</p>
              <Link className="btn btn-primary" href="/events#whats-on">See Session dates</Link>
            </div>
          </div>
        </div>
      </section>

      <div id="newsletter">
        <NewsletterStrip
          source="guides"
          heading="Get the next guide in your inbox."
          sub="One email a month with what's on next."
        />
      </div>
    </main>
  );
}
