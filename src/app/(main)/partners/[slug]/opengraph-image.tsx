// Dynamic per-partner OG image. Generated on first request, then
// ISR-cached. Mirrors the pattern from /events/[slug]/opengraph-image
// so social shares of /partners/{slug} surface the partner's name +
// category + region instead of the generic site OG.

import { ImageResponse } from 'next/og';
import { getPartnerBySlug } from '@/lib/cms';
import { CATEGORY_LABELS, legacyCategoryFallback, type PartnerCategory } from '@/components/sections/partners/shared';

export const runtime = 'nodejs';
export const contentType = 'image/png';
export const size = { width: 1200, height: 630 };
export const alt = 'Growth Hub partner';

type Params = Promise<{ slug: string }>;

export default async function PartnerOgImage({ params }: { params: Params }) {
  const { slug } = await params;
  const partner = await getPartnerBySlug(slug);

  const name = String(partner?.name ?? 'Growth Hub partner');
  const description = String(partner?.description ?? '');
  const rawCategory =
    (partner as { category?: string | null } | null)?.category ??
    legacyCategoryFallback((partner as { type?: string | null } | null)?.type ?? null);
  const category: PartnerCategory = (rawCategory ?? 'community-delivery') as PartnerCategory;
  const categoryLabel = CATEGORY_LABELS[category] ?? 'Strategic Partner';
  const region = (partner as { region?: string | null } | null)?.region ?? null;
  const since = (partner as { since?: string | null } | null)?.since ?? null;

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: '72px 88px',
          background: '#0D3F48',
          color: '#F3F0E7',
          fontFamily: 'serif',
        }}
      >
        {/* Top row — category chip + wordmark */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              padding: '8px 18px',
              borderRadius: 999,
              border: '1px solid rgba(243,240,231,0.35)',
              fontSize: 22,
              color: '#E3F29C',
              letterSpacing: '0.04em',
            }}
          >
            {categoryLabel}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, fontSize: 26 }}>
            <span style={{ color: '#F3F0E7' }}>Growth Hub</span>
            <span style={{ color: '#E3F29C', fontStyle: 'italic' }}>by Himayat</span>
          </div>
        </div>

        {/* Partner name + truncated description */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <span
            style={{
              fontSize: 88,
              lineHeight: 1.05,
              letterSpacing: '-0.025em',
              maxWidth: '92%',
            }}
          >
            {name}
          </span>
          {description && (
            <span
              style={{
                fontSize: 26,
                lineHeight: 1.45,
                color: 'rgba(243,240,231,0.78)',
                maxWidth: '85%',
                // 2-line clamp via inline flex; ImageResponse doesn't support
                // -webkit-line-clamp so we cap by character count instead.
                display: 'flex',
              }}
            >
              {description.length > 140 ? description.slice(0, 140).trimEnd() + '…' : description}
            </span>
          )}
        </div>

        {/* Bottom row — region + since + tagline */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', fontSize: 22 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {region && (
              <span style={{ color: 'rgba(243,240,231,0.7)' }}>
                {region}
                {since ? ` · Since ${since}` : ''}
              </span>
            )}
          </div>
          <span style={{ color: '#E3F29C', fontStyle: 'italic' }}>
            We don&apos;t grow alone.
          </span>
        </div>
      </div>
    ),
    size,
  );
}
