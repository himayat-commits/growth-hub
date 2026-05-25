import type { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { notFound } from 'next/navigation';
import {
  getCaseStudies,
  getCaseStudyBySlug,
  getCaseStudySlugs,
  getSiteSettings,
} from '@/lib/cms';
import LexicalRichText from '@/components/LexicalRichText';
import Contact from '@/components/sections/Contact';
import TrackOnMount from '@/components/TrackOnMount';
import { BreadcrumbListJsonLd } from '@/components/seo/BreadcrumbListJsonLd';

export const revalidate = 3600;

export async function generateStaticParams() {
  const slugs = await getCaseStudySlugs();
  return slugs.map((slug) => ({ slug }));
}

type Params = Promise<{ slug: string }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { slug } = await params;
  const doc = await getCaseStudyBySlug(slug);
  if (!doc) return { title: 'Case study — Growth Hub by Himayat' };
  const title = String(doc.title ?? '');
  const outcome = String((doc as { outcome?: string }).outcome ?? '');
  return {
    title: `${title} — Growth Hub case study`,
    description: outcome || `How ${doc.client} grew with Growth Hub.`,
  };
}

export default async function CaseStudyPage({ params }: { params: Params }) {
  const { slug } = await params;
  const doc = await getCaseStudyBySlug(slug);
  if (!doc) notFound();

  const [othersResult, siteSettings] = await Promise.all([
    getCaseStudies(),
    getSiteSettings(),
  ]);
  const related = (othersResult?.docs ?? []).filter((d) => d.id !== doc.id).slice(0, 3);

  const title = String(doc.title ?? '');
  const client = String((doc as { client?: string }).client ?? '');
  const outcome = String((doc as { outcome?: string }).outcome ?? '');
  const image = (doc as { image?: { url?: string; alt?: string } | null }).image;

  return (
    <main>
      {/* Fires `case_study_open` once on mount with slug + client + outcome
          so PostHog can rank which case studies pull the most traffic. */}
      <TrackOnMount
        event="case_study_open"
        properties={{ slug, client, outcome: outcome ? outcome.slice(0, 80) : undefined }}
      />
      <BreadcrumbListJsonLd
        crumbs={[
          { name: 'Case studies', path: '/case-studies' },
          { name: title, path: `/case-studies/${slug}` },
        ]}
      />
      <section className="hero case-study-hero">
        <div className="wrap">
          <Link href="/case-studies" className="ed-back" style={{ color: 'var(--plum)' }}>
            ← All case studies
          </Link>
          <div className="hero-eyebrow">
            <span className="dot" />
            Case study · {client}
          </div>
          <h1 className="hero-h1" style={{ marginTop: 28 }}>{title}</h1>
          {outcome && (
            <p className="hero-sub" style={{ marginTop: 28, color: 'var(--plum)', fontStyle: 'italic' }}>
              {outcome}
            </p>
          )}
        </div>
      </section>

      {image?.url && (
        <div className="case-study-img-wrap">
          <div className="wrap">
            <Image
              src={image.url}
              alt={image.alt ?? title}
              width={1320}
              height={742}
              priority
              sizes="(max-width: 1320px) 100vw, 1320px"
              style={{ width: '100%', height: 'auto', borderRadius: 24 }}
            />
          </div>
        </div>
      )}

      <article className="case-study-body">
        <div className="wrap">
          <LexicalRichText
            content={(doc as { body?: unknown }).body}
            className="case-study-prose"
          />
        </div>
      </article>

      {related.length > 0 && (
        <section className="case-study-related">
          <div className="wrap">
            <span className="section-label">More stories</span>
            <h2 className="section-h2" style={{ marginTop: 8 }}>Other case studies.</h2>
            <div className="case-study-grid" style={{ marginTop: 32 }}>
              {related.map((r) => (
                <Link
                  key={String(r.id)}
                  href={`/case-studies/${r.slug}`}
                  className="case-study-card"
                >
                  <span className="section-label" style={{ marginBottom: 8 }}>
                    {String((r as { client?: string }).client ?? '')}
                  </span>
                  <h3>{String(r.title)}</h3>
                  {(r as { outcome?: string }).outcome && (
                    <p>{String((r as { outcome?: string }).outcome)}</p>
                  )}
                  <span className="case-study-card-link">
                    Read the story →
                  </span>
                </Link>
              ))}
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
