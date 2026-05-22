import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import {
  getPartnerBySlug,
  getPartnerSlugs,
  getPartners,
  getSiteSettings,
} from '@/lib/cms';
import PartnerMark from '@/components/sections/partners/PartnerMark';
import {
  CATEGORY_LABELS,
  defaultShapeForCategory,
  legacyCategoryFallback,
  type PartnerCategory,
  type PartnerShape,
} from '@/components/sections/partners/shared';
import Contact from '@/components/sections/Contact';

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

  const [allPartnersResult, siteSettings] = await Promise.all([
    getPartners(),
    getSiteSettings(),
  ]);

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
                background: 'rgba(243,240,231,0.08)',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <PartnerMark shape={shape} />
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
                return (
                  <article className="p-card" key={String(r.id)}>
                    <header className="p-card-top">
                      <span className="p-card-mark"><PartnerMark shape={rShape} /></span>
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

      <Contact
        supportEmail={siteSettings?.supportEmail ?? null}
        phone={siteSettings?.phone ?? null}
        address={siteSettings?.address ?? null}
      />
    </main>
  );
}
