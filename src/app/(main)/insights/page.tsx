// Insights hub — surfaces the Posts collection for SEO.
//
// Audience: SMB owners searching for "AI for tradies in Canberra",
// "migrant founder funding ACT", "small business marketing case study".
// Long-form content is the primary organic-acquisition channel the
// existing PostHog/HubSpot stack doesn't yet have.
//
// Why `/insights` not `/blog`: "blog" reads as company-news; "insights"
// signals practical takeaways, which matches the brand voice. The Posts
// collection's admin preview URL still points at `/blog/{slug}` — that's
// just an editor convenience and the file convention; the canonical
// public URL is `/insights/{slug}`.

import type { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { getPosts } from '@/lib/cms';
import NewsletterStrip from '@/components/NewsletterStrip';

export const metadata: Metadata = {
  title: 'Insights — Growth Hub by Himayat',
  description:
    'Practical writing for Canberra small business — AI, marketing, funding, and the day-to-day of running a growing operation.',
  alternates: { canonical: '/insights' },
};

export const revalidate = 3600;

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

export default async function InsightsHubPage() {
  const result = await getPosts(24, 1);
  const posts = result?.docs ?? [];

  return (
    <main>
      {/* HERO */}
      <section className="hero">
        <div className="wrap">
          <div className="hero-eyebrow">
            <span className="dot" />
            Insights · long-form
          </div>
          <h1 className="hero-h1">
            Practical writing for Canberra <span className="grow">small business</span>.
          </h1>
          <p className="hero-sub">
            AI, marketing, funding, and the day-to-day of running a growing operation.
            Written by the team and the founders we work with.
          </p>
        </div>
      </section>

      {posts.length === 0 ? (
        <section className="post-list">
          <div className="wrap">
            <div className="posts-empty">
              <h2>The first articles are landing soon.</h2>
              <p>
                We&apos;re writing practical guides on AI, marketing and funding for Canberra
                small businesses. Subscribe below and they&apos;ll land in your inbox first.
              </p>
            </div>
          </div>
        </section>
      ) : (
        <section className="post-list">
          <div className="wrap">
            <div className="post-grid">
              {posts.map((p) => {
                const slug = String((p as { slug?: string }).slug ?? '');
                const title = String(p.title);
                const excerpt = String((p as { excerpt?: string | null }).excerpt ?? '');
                const publishedAt = (p as { publishedAt?: string | null }).publishedAt ?? null;
                const cover =
                  (p as { coverImage?: { url?: string; alt?: string } | null }).coverImage;
                return (
                  <Link key={slug} href={`/insights/${slug}`} className="post-card">
                    {cover?.url && (
                      <div className="post-card-img">
                        <Image
                          src={cover.url}
                          alt={cover.alt ?? title}
                          fill
                          sizes="(max-width: 768px) 100vw, 33vw"
                          style={{ objectFit: 'cover' }}
                        />
                      </div>
                    )}
                    {publishedAt && (
                      <span className="post-card-date">{formatPublishedAt(publishedAt)}</span>
                    )}
                    <h3>{title}</h3>
                    {excerpt && <p>{excerpt}</p>}
                    <span className="post-card-link">Read →</span>
                  </Link>
                );
              })}
            </div>
          </div>
        </section>
      )}

      <NewsletterStrip
        source="insights"
        heading="New articles, straight to your inbox."
        sub="One monthly email with the latest insights, workshops and member wins. No drip sequence."
      />
    </main>
  );
}
