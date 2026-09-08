// Per-product OG image: name, price, first product photo.

import { ImageResponse } from 'next/og';
import { loadProduct, productHeroImage } from '@/lib/shop/catalogue';
import { formatAud } from '@/lib/shop/pricing';

export const runtime = 'nodejs';
export const contentType = 'image/png';
export const size = { width: 1200, height: 630 };
export const alt = 'Growth Hub Shop product';

type Params = Promise<{ slug: string }>;

export default async function ProductOgImage({ params }: { params: Params }) {
  const { slug } = await params;
  const loaded = await loadProduct(slug);
  const name = loaded?.view.name ?? 'Growth Hub Shop';
  const price = loaded ? formatAud(loaded.view.priceCents) : '';
  const hero = loaded ? productHeroImage(loaded.raw) : null;

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          background: '#0D3F48',
          color: '#F3F0E7',
          fontFamily: 'serif',
        }}
      >
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: '64px 72px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, fontSize: 26 }}>
            <span>Growth Hub</span>
            <span style={{ color: '#E3F29C', fontStyle: 'italic' }}>Shop</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            <span style={{ fontSize: 68, lineHeight: 1.05, letterSpacing: '-0.02em' }}>{name}</span>
            {price && <span style={{ fontSize: 40, color: '#E3F29C' }}>{price}</span>}
          </div>
          <span style={{ fontSize: 22, color: 'rgba(243,240,231,0.7)' }}>Members save · Ships Australia-wide</span>
        </div>
        {hero && (
          <div style={{ width: 520, height: '100%', display: 'flex', overflow: 'hidden' }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={hero.url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          </div>
        )}
      </div>
    ),
    { ...size },
  );
}
