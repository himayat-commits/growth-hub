// About page OG card. Static at deploy time.

import { ImageResponse } from 'next/og';

export const runtime = 'nodejs';
export const contentType = 'image/png';
export const size = { width: 1200, height: 630 };
export const alt = 'About Growth Hub — Support that starts where systems stop. With people.';

export default function AboutOgImage() {
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
            About Growth Hub
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, fontSize: 26 }}>
            <span style={{ color: '#F3F0E7' }}>Growth Hub</span>
            <span style={{ color: '#E3F29C', fontStyle: 'italic' }}>by Himayat</span>
          </div>
        </div>

        {/* Three lines (not the two-line 110px of the other cards) so the
            whole headline fits at 1200px. */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <span style={{ fontSize: 92, lineHeight: 1, letterSpacing: '-0.03em' }}>
            Support that starts
          </span>
          <span style={{ fontSize: 92, lineHeight: 1, letterSpacing: '-0.03em' }}>
            where systems stop.
          </span>
          <span style={{ fontSize: 92, lineHeight: 1, letterSpacing: '-0.03em', color: '#E3F29C' }}>
            With people.
          </span>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', fontSize: 22 }}>
          <span style={{ color: 'rgba(243,240,231,0.7)' }}>
            A Canberra social enterprise by Himayat
          </span>
          <span style={{ color: '#E3F29C', fontStyle: 'italic' }}>
            thegrowthhub.com.au/about
          </span>
        </div>
      </div>
    ),
    size,
  );
}
