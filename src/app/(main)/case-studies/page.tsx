import type { Metadata } from 'next';
import Link from 'next/link';
import { getCaseStudies, getSiteSettings } from '@/lib/cms';
import Contact from '@/components/sections/Contact';

export const metadata: Metadata = {
  title: 'Case studies — Growth Hub by Himayat',
  description:
    'Real Canberra businesses, real outcomes. How Growth Hub members built reputation, found customers, and grew with a community in their corner.',
};

export const revalidate = 3600;

export default async function CaseStudiesIndexPage() {
  const [studiesResult, siteSettings] = await Promise.all([
    getCaseStudies(),
    getSiteSettings(),
  ]);
  const studies = studiesResult?.docs ?? [];

  return (
    <main>
      <section className="hero case-study-index-hero">
        <div className="wrap">
          <div className="hero-eyebrow">
            <span className="dot" />
            Case studies
          </div>
          <h1 className="hero-h1">
            Real businesses.<br />
            <span style={{ color: 'var(--plum)', fontStyle: 'italic' }}>Real outcomes.</span>
          </h1>
          <p className="hero-sub">
            How Canberra small businesses grew with Growth Hub. No marketing speak —
            just the things they tried, what worked, and what changed.
          </p>
        </div>
      </section>

      <section className="case-study-list">
        <div className="wrap">
          {studies.length === 0 ? (
            <div className="case-study-empty">
              <h2 className="section-h2">First stories coming soon.</h2>
              <p className="section-lead" style={{ marginTop: 12 }}>
                We&apos;re writing them up now. In the meantime, the homepage
                testimonials give a flavour of what members have built with us.
              </p>
              <Link href="/#testimonials" className="btn btn-primary" style={{ marginTop: 24 }}>
                Read homepage testimonials
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" aria-hidden="true">
                  <path d="M3 7h8M7 3l4 4-4 4" />
                </svg>
              </Link>
            </div>
          ) : (
            <div className="case-study-grid">
              {studies.map((s) => (
                <Link
                  key={String(s.id)}
                  href={`/case-studies/${s.slug}`}
                  className="case-study-card"
                >
                  <span className="section-label" style={{ marginBottom: 8 }}>
                    {String((s as { client?: string }).client ?? '')}
                  </span>
                  <h3>{String(s.title)}</h3>
                  {(s as { outcome?: string }).outcome && (
                    <p>{String((s as { outcome?: string }).outcome)}</p>
                  )}
                  <span className="case-study-card-link">Read the story →</span>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>

      <Contact
        supportEmail={siteSettings?.supportEmail ?? null}
        phone={siteSettings?.phone ?? null}
        address={siteSettings?.address ?? null}
      />
    </main>
  );
}
