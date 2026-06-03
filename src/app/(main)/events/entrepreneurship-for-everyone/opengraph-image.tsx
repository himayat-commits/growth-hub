// Dedicated OG card for the summit landing page so social shares render the
// event name + date instead of the generic site card. Static — built from the
// SUMMIT constants at build time.

import { ImageResponse } from 'next/og';
import { SUMMIT } from '@/lib/summit';

export const runtime = 'nodejs';
export const contentType = 'image/png';
export const size = { width: 1200, height: 630 };
export const alt = `${SUMMIT.name} — ${SUMMIT.dateLong}, ${SUMMIT.venue}`;

export default function SummitOgImage() {
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
        {/* Top row — eyebrow tag + wordmark */}
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
            Free full-day summit
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, fontSize: 26 }}>
            <span style={{ color: '#F3F0E7' }}>Growth Hub</span>
            <span style={{ color: '#E3F29C', fontStyle: 'italic' }}>by Himayat</span>
          </div>
        </div>

        {/* Title + tagline */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 18, maxWidth: '92%' }}>
          <span style={{ fontSize: 26, color: '#E3F29C', fontStyle: 'italic', letterSpacing: '0.02em' }}>
            {SUMMIT.tagline}
          </span>
          <div style={{ display: 'flex', fontSize: 84, lineHeight: 1.05, letterSpacing: '-0.025em' }}>
            {SUMMIT.name}
          </div>
        </div>

        {/* Bottom row — date + location */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <span style={{ fontSize: 18, color: 'rgba(243,240,231,0.5)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
              When
            </span>
            <span style={{ fontSize: 36, color: '#F3F0E7' }}>{SUMMIT.dateLong}</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, alignItems: 'flex-end' }}>
            <span style={{ fontSize: 18, color: 'rgba(243,240,231,0.5)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
              Where
            </span>
            <span style={{ fontSize: 32, color: '#F3F0E7' }}>{SUMMIT.venue}</span>
          </div>
        </div>
      </div>
    ),
    size,
  );
}
