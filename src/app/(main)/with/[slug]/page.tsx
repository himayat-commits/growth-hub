// Partner micro-site at /with/[partner-slug].
//
// Distinct from /partners/[slug]:
//   - /partners/[slug] is the directory profile — "who is this partner".
//   - /with/[slug]    is a co-branded campaign surface — "here's what
//     Growth Hub × [Partner] is doing right now". One URL the partner can
//     hand to their audience that lights up everything joint we've built.
//
// Sections, in order:
//   1. Hero lock-up (Growth Hub × Partner with partner mark)
//   2. Upcoming co-hosted events (host=partner or in partners[])
//   3. Joint case studies (case_study.client === partner.name)
//   4. Co-branded CTA (newsletter + contact)
//
// Pulls from the existing CMS helpers so the partner edits once in Payload
// and both this surface and /partners/[slug] update together.

import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import {
  getPartnerBySlug,
  getPartnerSlugs,
  getEventsForPartner,
  getCaseStudiesByClient,
} from '@/lib/cms';
import { toPublicEvents } from '@/lib/events-data';
import type { Event as PayloadEvent } from '@/payload-types';
import PartnerMark from '@/components/sections/partners/PartnerMark';
import {
  CATEGORY_LABELS,
  defaultShapeForCategory,
  legacyCategoryFallback,
  type PartnerCategory,
  type PartnerShape,
} from '@/components/sections/partners/shared';
import NewsletterStrip from '@/components/NewsletterStrip';
import { BreadcrumbListJsonLd } from '@/components/seo/BreadcrumbListJsonLd';

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
  const path = `/with/${slug}`;
  const title = `Growth Hub × ${name}`;
  const description =
    `What we're building together with ${name} — co-hosted events, joint case studies, and how to get involved.`;
  return {
    title,
    description,
    alternates: { canonical: path },
    openGraph: {
      title,
      description,
      url: path,
      type: 'website',
      siteName: 'Growth Hub by Himayat',
      locale: 'en_AU',
    },
    twitter: { card: 'summary_large_image', title, description },
  };
}

export default async function PartnerMicrositePage({ params }: { params: Params }) {
  const { slug } = await params;
  const partner = await getPartnerBySlug(slug);
  if (!partner) notFound();

  const partnerName = String(partner.name ?? '');

  const [eventDocs, caseStudyDocs] = await Promise.all([
    getEventsForPartner(partner.id, 6),
    getCaseStudiesByClient(partnerName),
  ]);

  const events = toPublicEvents(eventDocs as PayloadEvent[]);
  // Same category fallback chain as /partners/[slug] keeps the mark/glyph
  // consistent across both surfaces if a partner's category was migrated
  // from the legacy `type` field.
  const rawCategory =
    (partner as { category?: string | null }).category ??
    legacyCategoryFallback((partner as { type?: string | null }).type ?? null);
  const category: PartnerCategory = (rawCategory ?? 'community-delivery') as PartnerCategory;
  const categoryLabel = CATEGORY_LABELS[category] ?? 'Community & Delivery';
  const shape: PartnerShape =
    ((partner as { shape?: string | null }).shape as PartnerShape | null) ??
    defaultShapeForCategory(category);

  const website = (partner as { website?: string | null }).website ?? null;
  const description = (partner as { description?: string | null }).description ?? null;
  const contribution = (partner as { contribution?: string | null }).contribution ?? null;

  // UTM-tag every outbound to /events and /case-studies so we can answer
  // "how many RSVPs came from a partner micro-site share?" on PostHog.
  const tag = `?utm_source=with-${slug}&utm_medium=partner-microsite`;

  return (
    <main>
      <BreadcrumbListJsonLd
        crumbs={[
          { name: 'Partners', path: '/partners' },
          { name: partnerName, path: `/with/${slug}` },
        ]}
      />

      {/* HERO — Growth Hub × Partner lock-up */}
      <section className="hero partner-profile-hero">
        <div className="wrap">
          <Link href={`/partners/${slug}`} className="ed-back">
            ← Partner profile
          </Link>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 18,
              marginTop: 28,
              flexWrap: 'wrap',
            }}
          >
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
            <h1 className="hero-h1" style={{ margin: 0 }}>
              Growth Hub <span className="grow">×</span> {partnerName}
            </h1>
          </div>

          <div className="hero-eyebrow" style={{ marginTop: 20 }}>
            <span className="dot" />
            {categoryLabel} partnership
          </div>

          {description && (
            <p className="hero-sub" style={{ marginTop: 22 }}>
              {description}
            </p>
          )}

          <div className="hero-ctas" style={{ marginTop: 32 }}>
            {events.length > 0 && (
              <Link className="btn btn-primary" href="#upcoming">
                See upcoming events ({events.length})
              </Link>
            )}
            {website && (
              <a
                className="btn btn-secondary"
                href={website}
                target="_blank"
                rel="noopener noreferrer"
              >
                Visit {partnerName}
              </a>
            )}
          </div>
        </div>
      </section>

      {/* WHAT WE BRING TO EACH OTHER */}
      {contribution && (
        <section className="partner-profile-detail">
          <div className="wrap">
            <div className="partner-profile-grid">
              <div className="partner-profile-card">
                <span className="section-label">What {partnerName} brings</span>
                <p>{contribution}</p>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* UPCOMING EVENTS */}
      {events.length > 0 && (
        <section className="events-list" id="upcoming" style={{ paddingTop: 'clamp(72px, 9vw, 120px)' }}>
          <div className="wrap">
            <span className="section-label">Upcoming together</span>
            <h2 className="section-h2">Events {partnerName} is co-hosting.</h2>
            <div className="evlist" style={{ marginTop: 32 }}>
              {events.map((e) => (
                <Link className="ev-row" key={e.slug} href={`/events/${e.slug}${tag}`}>
                  <div className="ev-date">
                    <span className="month">{e.monthShort}</span>
                    <span className="day">{e.day === '?' ? <em>?</em> : e.day}</span>
                    <span className="year">{e.year}</span>
                  </div>
                  <div className="ev-main">
                    <span className={'ev-tag ' + e.tagClass}>{e.tag}</span>
                    <h3>{e.title}</h3>
                    <p className="ev-desc">{e.desc}</p>
                  </div>
                  <span className="ev-cta">View event →</span>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* JOINT CASE STUDIES */}
      {caseStudyDocs.length > 0 && (
        <section className="case-study-related" style={{ paddingTop: 'clamp(72px, 9vw, 120px)' }}>
          <div className="wrap">
            <span className="section-label">What we&apos;ve built together</span>
            <h2 className="section-h2" style={{ marginTop: 8 }}>
              Joint case studies.
            </h2>
            <div className="case-study-grid" style={{ marginTop: 32 }}>
              {caseStudyDocs.map((cs) => {
                const csSlug = String((cs as { slug?: string }).slug ?? '');
                const csTitle = String(cs.title);
                const csOutcome = (cs as { outcome?: string }).outcome;
                return (
                  <Link
                    key={String(cs.id)}
                    href={`/case-studies/${csSlug}${tag}`}
                    className="case-study-card"
                  >
                    <span className="section-label" style={{ marginBottom: 8 }}>
                      {partnerName}
                    </span>
                    <h3>{csTitle}</h3>
                    {csOutcome && <p>{csOutcome}</p>}
                    <span className="case-study-card-link">Read the story →</span>
                  </Link>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* CO-BRANDED NEWSLETTER */}
      <NewsletterStrip
        source={`with-${slug}`}
        heading={`Follow what ${partnerName} and Growth Hub are building.`}
        sub="Joint workshops, partner-only events, and case-study updates. One email a month."
      />
    </main>
  );
}
