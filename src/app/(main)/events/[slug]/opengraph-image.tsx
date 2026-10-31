// Dynamic per-event OG image. Generated on first request, then ISR-cached.
// Renders a 1200×630 PNG with brand colors + event title + date so social
// shares look intentional instead of pulling the generic site OG.

import { ImageResponse } from 'next/og';
import { getEventBySlug } from '@/lib/cms';
import { toPublicEvent } from '@/lib/events-data';
import { eventFacts } from '@/lib/sessions';
import type { Event as PayloadEvent } from '@/payload-types';

// Tells Next this is a route segment so generateStaticParams in the
// parent applies — each [slug] gets its own OG.
export const runtime = 'nodejs';
export const contentType = 'image/png';
export const size = { width: 1200, height: 630 };
export const alt = 'Growth Hub event';

type Params = Promise<{ slug: string }>;

export default async function EventOgImage({ params }: { params: Params }) {
  const { slug } = await params;
  const doc = await getEventBySlug(slug);
  // Fall back to a generic placeholder card if the slug doesn't resolve.
  const ev = doc ? toPublicEvent(doc as PayloadEvent) : null;
  // Sessions and Growth Labs label themselves and default to the venue when
  // the CMS `tag` / `location` are blank.
  const facts = doc ? eventFacts(doc as PayloadEvent) : null;
  const cmsTag = String((doc as { tag?: string | null } | null)?.tag ?? '').trim();
  const seasonTag = facts?.season ? (facts.season.kind === 'lab' ? 'Growth Lab' : 'Growth Hub Session') : '';

  const title = ev?.title ?? 'Growth Hub event';
  const dateLine = [ev?.dateLong, ev?.time].filter(Boolean).join(' · ');
  const tag = cmsTag || seasonTag || ev?.tag || 'Event';
  const location = facts?.location || 'Canberra';

  // When the event has a co-host partner, surface their name in the
  // wordmark area. depth=1 on getEventBySlug populates `host` as an
  // object; the name is the only field we render here.
  const host = (doc as { host?: { name?: string } } | null)?.host;
  const hostName = host && typeof host === 'object' ? host.name ?? null : null;

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
            {tag}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, fontSize: 26 }}>
            <span style={{ color: '#F3F0E7' }}>Growth Hub</span>
            <span style={{ color: '#E3F29C', fontStyle: 'italic' }}>by Himayat</span>
          </div>
        </div>

        {/* Title + optional "with [host]" co-host line */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 18, maxWidth: '92%' }}>
          {hostName && (
            <span
              style={{
                fontSize: 26,
                color: '#E3F29C',
                fontStyle: 'italic',
                letterSpacing: '0.02em',
              }}
            >
              with {hostName}
            </span>
          )}
          <div
            style={{
              display: 'flex',
              fontSize: 84,
              lineHeight: 1.05,
              letterSpacing: '-0.025em',
            }}
          >
            {title}
          </div>
        </div>

        {/* Bottom rows — date and time, then location. Stacked so a long venue
            line ("venue emailed before the day") never runs off the card. */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 20 }}>
            <span style={{ width: 96, fontSize: 18, color: 'rgba(243,240,231,0.5)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
              When
            </span>
            <span style={{ fontSize: 34, color: '#F3F0E7' }}>{dateLine}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 20 }}>
            <span style={{ width: 96, fontSize: 18, color: 'rgba(243,240,231,0.5)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
              Where
            </span>
            <span style={{ fontSize: 28, color: 'rgba(243,240,231,0.85)', maxWidth: 900 }}>{location}</span>
          </div>
        </div>
      </div>
    ),
    size,
  );
}
