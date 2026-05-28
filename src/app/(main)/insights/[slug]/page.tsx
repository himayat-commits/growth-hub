// Insights detail page — long-form article from the Posts collection.
//
// Uses the same LexicalRichText renderer as case studies so authoring is
// consistent across collections. Breadcrumb JSON-LD is added for Google
// rich results; an Article JSON-LD would be a future improvement once
// editors are reliably filling `publishedAt` + `coverImage`.

import type { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { notFound } from 'next/navigation';
import { getPosts, getPostBySlug } from '@/lib/cms';
import LexicalRichText from '@/components/LexicalRichText';
import { BreadcrumbListJsonLd } from '@/components/seo/BreadcrumbListJsonLd';
import { ArticleJsonLd } from '@/components/seo/ArticleJsonLd';

export const revalidate = 3600;

export async function generateStaticParams() {
  // No dedicated slug helper for posts yet — fetch the list (max 100) and
  // map; matches the pattern used for case studies during their initial
  // build-out. Add a `getPostSlugs()` helper when post count exceeds ~100.
  const result = await getPosts(100, 1);
  return (result?.docs ?? [])
    .map((p) => String((p as { slug?: string }).slug ?? ''))
    .filter(Boolean)
    .map((slug) => ({ slug }));
}

type Params = Promise<{ slug: string }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { slug } = await params;
  const doc = await getPostBySlug(slug);
  if (!doc) return { title: 'Insight — Growth Hub by Himayat' };
  const title = String(doc.title ?? '');
  const excerpt = String((doc as { excerpt?: string | null }).excerpt ?? '');
  const path = `/insights/${slug}`;
  return {
    title: `${title} — Growth Hub`,
    description: excerpt || `${title} — practical writing for Canberra small business.`,
    alternates: { canonical: path },
    openGraph: {
      title,
      description: excerpt,
      url: path,
      type: 'article',
      siteName: 'Growth Hub by Himayat',
      locale: 'en_AU',
    },
    twitter: { card: 'summary_large_image', title, description: excerpt },
  };
}

function formatPublishedAt(iso: string | null | undefined): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return new Intl.DateTimeFormat('en-AU', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(d);
}

export default async function InsightDetailPage({ params }: { params: Params }) {
  const { slug } = await params;
  const doc = await getPostBySlug(slug);
  if (!doc) notFound();

  const title = String(doc.title ?? '');
  const excerpt = String((doc as { excerpt?: string | null }).excerpt ?? '');
  const publishedAt = (doc as { publishedAt?: string | null }).publishedAt ?? null;
  const cover = (doc as { coverImage?: { url?: string; alt?: string } | null }).coverImage;

  // Related: most recent other posts. Future: filter by shared tags.
  const allResult = await getPosts(7, 1);
  const related = (allResult?.docs ?? [])
    .filter((p) => p.id !== doc.id)
    .slice(0, 3);

  return (
    <main>
      <BreadcrumbListJsonLd
        crumbs={[
          { name: 'Insights', path: '/insights' },
          { name: title, path: `/insights/${slug}` },
        ]}
      />
      <ArticleJsonLd
        headline={title}
        slug={slug}
        description={excerpt || undefined}
        datePublished={publishedAt}
        dateModified={(doc as { updatedAt?: string | null }).updatedAt ?? publishedAt}
        imageUrl={cover?.url ?? null}
      />

      <section className="hero case-study-hero">
        <div className="wrap">
          <Link href="/insights" className="ed-back" style={{ color: 'var(--plum)' }}>
            ← All insights
          </Link>
          {publishedAt && (
            <div className="hero-eyebrow">
              <span className="dot" />
              {formatPublishedAt(publishedAt)}
            </div>
          )}
          <h1 className="hero-h1" style={{ marginTop: 28 }}>{title}</h1>
          {excerpt && (
            <p
              className="hero-sub"
              style={{ marginTop: 28, color: 'var(--plum)', fontStyle: 'italic' }}
            >
              {excerpt}
            </p>
          )}
        </div>
      </section>

      {cover?.url && (
        <div className="case-study-img-wrap">
          <div className="wrap">
            <Image
              src={cover.url}
              alt={cover.alt ?? title}
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
            content={(doc as { content?: unknown }).content}
            className="case-study-prose"
          />
        </div>
      </article>

      {related.length > 0 && (
        <section className="case-study-related">
          <div className="wrap">
            <span className="section-label">More insights</span>
            <h2 className="section-h2" style={{ marginTop: 8 }}>
              Keep reading.
            </h2>
            <div className="case-study-grid" style={{ marginTop: 32 }}>
              {related.map((r) => {
                const rSlug = String((r as { slug?: string }).slug ?? '');
                const rTitle = String(r.title);
                const rExcerpt = (r as { excerpt?: string | null }).excerpt ?? null;
                return (
                  <Link
                    key={String(r.id)}
                    href={`/insights/${rSlug}`}
                    className="case-study-card"
                  >
                    <h3>{rTitle}</h3>
                    {rExcerpt && <p>{rExcerpt}</p>}
                    <span className="case-study-card-link">Read →</span>
                  </Link>
                );
              })}
            </div>
          </div>
        </section>
      )}
    </main>
  );
}
