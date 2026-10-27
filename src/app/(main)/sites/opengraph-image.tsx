// Growth Hub Sites OG card. Static at deploy time.

import { ImageResponse } from 'next/og';

export const runtime = 'nodejs';
export const contentType = 'image/png';
export const size = { width: 1200, height: 630 };
export const alt = 'Growth Hub Sites — A website you can run yourself. Live in a morning.';

export default function SitesOgImage() {
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
            Growth Hub Sites
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
            A website you can
          </span>
          <span style={{ fontSize: 92, lineHeight: 1, letterSpacing: '-0.03em' }}>
            run yourself.
          </span>
          <span style={{ fontSize: 92, lineHeight: 1, letterSpacing: '-0.03em', color: '#E3F29C' }}>
            Live in a morning.
          </span>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', fontSize: 22 }}>
          <span style={{ color: 'rgba(243,240,231,0.7)' }}>
            Templates · An AI builder · Real people to check it with you
          </span>
          <span style={{ color: '#E3F29C', fontStyle: 'italic' }}>
            thegrowthhub.com.au/sites
          </span>
        </div>
      </div>
    ),
    size,
  );
}
