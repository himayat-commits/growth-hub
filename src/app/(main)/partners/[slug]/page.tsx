import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import {
  getPartnerBySlug,
  getPartnerSlugs,
  getPartners,
  getSiteSettings,
  getEventsForPartner,
} from '@/lib/cms';
import { toPublicEvents } from '@/lib/events-data';
import type { Event as PayloadEvent } from '@/payload-types';
import { BreadcrumbListJsonLd } from '@/components/seo/BreadcrumbListJsonLd';
import PartnerMark from '@/components/sections/partners/PartnerMark';
import {
  CATEGORY_LABELS,
  defaultShapeForCategory,
  legacyCategoryFallback,
  type PartnerCategory,
  type PartnerShape,
} from '@/components/sections/partners/shared';
import Contact from '@/components/sections/Contact';
import NewsletterStrip from '@/components/NewsletterStrip';

export const revalidate = 3600;

export async function generateStaticParams() {
  const slugs = await getPartnerSlugs();
  return slugs.map((slug) => ({ slug }));
}

type Params = Promise<{ slug: string }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { slug } = await params;
  const partner = await getPartnerBySlug(slug);
  if (!partner) return { title: 'Partner — Growth Hub by Himayat' };
  const name = String(partner.name ?? '');
  const desc = String(partner.description ?? '');
  return {
    title: `${name} — Growth Hub Partner`,
    description: desc || `${name} is a Growth Hub partner. Learn how we work together.`,
  };
}

export default async function PartnerProfilePage({ params }: { params: Params }) {
  const { slug } = await params;
  const partner = await getPartnerBySlug(slug);
  if (!partner) notFound();

  const [allPartnersResult, siteSettings, partnerEventDocs] = await Promise.all([
    getPartners(),
    getSiteSettings(),
    getEventsForPartner(partner.id, 6),
  ]);
  const partnerEvents = toPublicEvents(partnerEventDocs as PayloadEvent[]);

  const name = String(partner.name ?? '');
  // category fallback chain matches PartnerDirectory: prefer category,
  // fall back to legacy `type` (some unmigrated records), then default.
  const rawCategory =
    (partner as { category?: string | null }).category ??
    legacyCategoryFallback((partner as { type?: string | null }).type ?? null);
  const category: PartnerCategory = (rawCategory ?? 'community-delivery') as PartnerCategory;
  const categoryLabel = CATEGORY_LABELS[category] ?? 'Community & Delivery';
  const shape: PartnerShape =
    ((partner as { shape?: string | null }).shape as PartnerShape | null) ??
    defaultShapeForCategory(category);
  // Real logo (CMS `logo` upload, populated at depth>=1). Falls back to glyph.
  const logo = (partner as { logo?: { url?: string | null; alt?: string | null } | null }).logo;
  const logoUrl = logo && typeof logo === 'object' ? logo.url ?? null : null;
  const logoAlt = logo && typeof logo === 'object' ? logo.alt ?? null : null;

  const region = (partner as { region?: string | null }).region ?? null;
  const since = (partner as { since?: string | null }).since ?? null;
  const contribution = (partner as { contribution?: string | null }).contribution ?? null;
  const howWeWork = (partner as { howWeWork?: string | null }).howWeWork ?? null;
  const website = (partner as { website?: string | null }).website ?? null;

  const related = (allPartnersResult?.docs ?? [])
    .filter((p) => p.id !== partner.id)
    .filter((p) => (p as { category?: string }).category === category)
    .slice(0, 3);

  return (
    <main>
      <BreadcrumbListJsonLd
        crumbs={[
          { name: 'Partners', path: '/partners' },
          { name, path: `/partners/${slug}` },
        ]}
      />
      <section className="hero p-hero partner-profile-hero">
        <div className="wrap">
          <Link href="/partners" className="ed-back">← All partners</Link>
          <div className="hero-eyebrow">
            <span className="dot" />
            {categoryLabel}
            {region ? ` · ${region}` : ''}
            {since ? ` · Since ${since}` : ''}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 18, marginTop: 28, flexWrap: 'wrap' }}>
            <span
              style={{
                display: 'inline-flex',
                width: 64,
                height: 64,
                borderRadius: 16,
                background: logoUrl ? '#fff' : 'rgba(13,63,72,0.05)',
                border: logoUrl ? '1px solid var(--line)' : 'none',
                padding: logoUrl ? 8 : 0,
                boxSizing: 'border-box',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {logoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={logoUrl}
                  alt={logoAlt || `${name} logo`}
                  style={{ width: '100%', height: '100%', objectFit: 'contain', display: 'block' }}
                />
              ) : (
                <PartnerMark shape={shape} size={34} />
              )}
            </span>
            <h1 className="hero-h1" style={{ margin: 0 }}>{name}</h1>
          </div>
          {partner.description && (
            <p className="hero-sub" style={{ marginTop: 28 }}>
              {String(partner.description)}
            </p>
          )}
          <div className="hero-ctas" style={{ marginTop: 36 }}>
            <a className="btn btn-primary" href="#contact">
              Get in touch
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" aria-hidden="true">
                <path d="M3 7h8M7 3l4 4-4 4" />
              </svg>
            </a>
            {website && (
              <a className="btn btn-secondary" href={website} target="_blank" rel="noopener noreferrer">
                Visit {name}
              </a>
            )}
          </div>
        </div>
      </section>

      {(contribution || howWeWork) && (
        <section className="partner-profile-detail">
          <div className="wrap">
            <div className="partner-profile-grid">
              {contribution && (
                <div className="partner-profile-card">
                  <span className="section-label">What they bring</span>
                  <p>{contribution}</p>
                </div>
              )}
              {howWeWork && (
                <div className="partner-profile-card">
                  <span className="section-label">How we work together</span>
                  <p>{howWeWork}</p>
                </div>
              )}
            </div>
          </div>
        </section>
      )}

      {partnerEvents.length > 0 && (
        <section className="partner-profile-events events-list" style={{ paddingTop: 'clamp(72px, 9vw, 120px)' }}>
          <div className="wrap">
            <span className="section-label">Upcoming with {name}</span>
            <h2 className="section-h2" style={{ marginTop: 8 }}>Events {name} is co-hosting.</h2>
            <div className="evlist" style={{ marginTop: 32 }}>
              {partnerEvents.map((r) => (
                <Link className="ev-row" key={r.slug} href={`/events/${r.slug}?utm_source=partner-${slug}&utm_medium=referral`}>
                  <div className="ev-date">
                    <span className="month">{r.monthShort}</span>
                    <span className="day">{r.day === '?' ? <em>?</em> : r.day}</span>
                    <span className="year">{r.year}</span>
                  </div>
                  <div className="ev-main">
                    <span className={'ev-tag ' + r.tagClass}>{r.tag}</span>
                    <h3>{r.title}</h3>
                    <p className="ev-desc">{r.desc}</p>
                  </div>
                  <span className="ev-cta">View event →</span>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {related.length > 0 && (
        <section className="partner-profile-related">
          <div className="wrap">
            <span className="section-label">Other {categoryLabel.toLowerCase()} partners</span>
            <h2 className="section-h2" style={{ marginTop: 8 }}>Also in this category.</h2>
            <div className="dir-grid" style={{ marginTop: 32 }}>
              {related.map((r) => {
                const rSlug = (r as { slug?: string }).slug;
                const rShape = ((r as { shape?: string }).shape as PartnerShape | null) ?? defaultShapeForCategory(category);
                const rRegion = (r as { region?: string }).region ?? null;
                const rSince = (r as { since?: string }).since ?? null;
                const rLogo = (r as { logo?: { url?: string | null; alt?: string | null } | null }).logo;
                const rLogoUrl = rLogo && typeof rLogo === 'object' ? rLogo.url ?? null : null;
                return (
                  <article className="p-card" key={String(r.id)}>
                    <header className="p-card-top">
                      <span className={`p-card-mark${rLogoUrl ? ' has-logo' : ''}`}>
                        {rLogoUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={rLogoUrl} alt={(rLogo && typeof rLogo === 'object' ? rLogo.alt : null) || `${String(r.name)} logo`} loading="lazy" />
                        ) : (
                          <PartnerMark shape={rShape} />
                        )}
                      </span>
                      <div className="p-card-id">
                        <h3>{String(r.name)}</h3>
                        <span className="p-card-meta">
                          {rRegion ?? ''}
                          {rRegion && rSince ? ' · ' : ''}
                          {rSince ? `Since ${rSince}` : ''}
                        </span>
                      </div>
                      <span className="p-card-cat">{categoryLabel}</span>
                    </header>
                    {r.description && <p className="p-card-desc">{String(r.description)}</p>}
                    {rSlug && (
                      <a className="p-card-link" href={`/partners/${rSlug}`}>
                        Read partnership profile
                        <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" aria-hidden="true">
                          <path d="M3 7h8M7 3l4 4-4 4" />
                        </svg>
                      </a>
                    )}
                  </article>
                );
              })}
            </div>
          </div>
        </section>
      )}

      <NewsletterStrip
        source={`partner-${slug}`}
        heading={`Follow what ${name} and Growth Hub are building.`}
        sub="Joint workshops, partner-only events, and case-study updates. One email a month, no drip sequence."
      />

      <Contact
        supportEmail={siteSettings?.supportEmail ?? null}
        phone={siteSettings?.phone ?? null}
        address={siteSettings?.address ?? null}
      />
    </main>
  );
}
