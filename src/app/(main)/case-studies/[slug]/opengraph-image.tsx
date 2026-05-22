// Dynamic per-case-study OG image. Mirrors the pattern from the
// events + partners variants so social shares of a case study
// surface the client name + outcome instead of the generic site OG.

import { ImageResponse } from 'next/og';
import { getCaseStudyBySlug } from '@/lib/cms';

export const runtime = 'nodejs';
export const contentType = 'image/png';
export const size = { width: 1200, height: 630 };
export const alt = 'Growth Hub case study';

type Params = Promise<{ slug: string }>;

export default async function CaseStudyOgImage({ params }: { params: Params }) {
  const { slug } = await params;
  const doc = await getCaseStudyBySlug(slug);

  const title = String(doc?.title ?? 'Growth Hub case study');
  const client = String((doc as { client?: string | null } | null)?.client ?? '');
  const outcome = String((doc as { outcome?: string | null } | null)?.outcome ?? '');

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
        {/* Top row — case-study chip + wordmark */}
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
            Case study {client ? `· ${client}` : ''}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, fontSize: 26 }}>
            <span style={{ color: '#F3F0E7' }}>Growth Hub</span>
            <span style={{ color: '#E3F29C', fontStyle: 'italic' }}>by Himayat</span>
          </div>
        </div>

        {/* Title — slightly smaller than partner OG since titles tend longer */}
        <div
          style={{
            display: 'flex',
            fontSize: 70,
            lineHeight: 1.1,
            letterSpacing: '-0.025em',
            maxWidth: '94%',
          }}
        >
          {title}
        </div>

        {/* Bottom row — one-line outcome */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', fontSize: 22 }}>
          <span style={{ color: 'rgba(243,240,231,0.85)', maxWidth: '70%', display: 'flex' }}>
            {outcome.length > 110 ? outcome.slice(0, 110).trimEnd() + '…' : outcome}
          </span>
          <span style={{ color: '#E3F29C', fontStyle: 'italic' }}>
            Real story · real numbers
          </span>
        </div>
      </div>
    ),
    size,
  );
}
