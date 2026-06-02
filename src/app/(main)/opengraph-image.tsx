// Site-wide default OG card. Inherits down to every (main)/* page that
// doesn't declare its own opengraph-image. Replaces the 404'ing
// /og-image.png referenced by (main)/layout.tsx metadata.
//
// /events, /partners, /case-studies all have their own per-page
// variants which take precedence.

import { ImageResponse } from 'next/og';

export const runtime = 'nodejs';
export const contentType = 'image/png';
export const size = { width: 1200, height: 630 };
export const alt = 'Growth Hub by Himayat — Your business deserves to grow.';

export default function SiteOgImage() {
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
            A Social Traders Verified Enterprise
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, fontSize: 26 }}>
            <span style={{ color: '#F3F0E7' }}>Growth Hub</span>
            <span style={{ color: '#E3F29C', fontStyle: 'italic' }}>by Himayat</span>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <span style={{ fontSize: 110, lineHeight: 1, letterSpacing: '-0.03em' }}>
            Your business
          </span>
          <span style={{ fontSize: 110, lineHeight: 1, letterSpacing: '-0.03em', color: '#E3F29C' }}>
            deserves to grow.
          </span>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', fontSize: 22 }}>
          <span style={{ color: 'rgba(243,240,231,0.7)' }}>
            Run + grow your local business · all in one platform
          </span>
          <span style={{ color: '#E3F29C', fontStyle: 'italic' }}>
            thegrowthhub.com.au
          </span>
        </div>
      </div>
    ),
    size,
  );
}
