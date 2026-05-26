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
        <section style={{ padding: '80px 0' }}>
          <div className="wrap">
            <p style={{ color: 'rgba(243,240,231,0.65)' }}>
              The first articles are landing soon. Bookmark this page.
            </p>
          </div>
        </section>
      ) : (
        <section style={{ paddingTop: 'clamp(48px, 6vw, 80px)' }}>
          <div className="wrap">
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
                gap: 28,
              }}
            >
              {posts.map((p) => {
                const slug = String((p as { slug?: string }).slug ?? '');
                const title = String(p.title);
                const excerpt = String((p as { excerpt?: string | null }).excerpt ?? '');
                const publishedAt = (p as { publishedAt?: string | null }).publishedAt ?? null;
                const cover =
                  (p as { coverImage?: { url?: string; alt?: string } | null }).coverImage;
                return (
                  <Link
                    key={slug}
                    href={`/insights/${slug}`}
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      padding: 24,
                      borderRadius: 16,
                      background: 'rgba(243,240,231,0.04)',
                      border: '1px solid rgba(243,240,231,0.10)',
                      textDecoration: 'none',
                      color: 'inherit',
                      gap: 16,
                    }}
                  >
                    {cover?.url && (
                      <div
                        style={{
                          aspectRatio: '16/9',
                          borderRadius: 10,
                          overflow: 'hidden',
                          position: 'relative',
                        }}
                      >
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
                      <span
                        style={{
                          fontSize: 12,
                          letterSpacing: '0.08em',
                          textTransform: 'uppercase',
                          color: 'rgba(243,240,231,0.55)',
                        }}
                      >
                        {formatPublishedAt(publishedAt)}
                      </span>
                    )}
                    <h3 style={{ margin: 0, fontSize: 22, lineHeight: 1.25 }}>{title}</h3>
                    {excerpt && (
                      <p style={{ margin: 0, color: 'rgba(243,240,231,0.75)' }}>{excerpt}</p>
                    )}
                    <span style={{ marginTop: 'auto', color: '#E3F29C', fontSize: 14 }}>
                      Read →
                    </span>
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
