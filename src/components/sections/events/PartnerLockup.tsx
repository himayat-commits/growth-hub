import Link from 'next/link';
import PartnerMark from '@/components/sections/partners/PartnerMark';
import {
  defaultShapeForCategory,
  legacyCategoryFallback,
  type PartnerCategory,
  type PartnerShape,
} from '@/components/sections/partners/shared';

// Renders "Hosted with [partner]" + co-promoter list on the event detail
// page. Reads relationship docs returned via depth=1 from getEventBySlug;
// degrades gracefully when the populated value is just an id (depth=0).

type PartnerRef =
  | string
  | number
  | {
      id?: string | number;
      slug?: string | null;
      name?: string | null;
      category?: string | null;
      type?: string | null;
      shape?: string | null;
    };

function asObj(ref: PartnerRef | null | undefined) {
  if (!ref || typeof ref !== 'object') return null;
  if (!ref.slug || !ref.name) return null;
  return ref;
}

export function PartnerLockup({
  host,
  partners,
}: {
  host?: PartnerRef | null;
  partners?: PartnerRef[] | null;
}) {
  const hostDoc = asObj(host);
  const partnerDocs = (partners ?? []).map(asObj).filter(Boolean) as Array<NonNullable<ReturnType<typeof asObj>>>;
  if (!hostDoc && partnerDocs.length === 0) return null;

  const renderChip = (p: NonNullable<ReturnType<typeof asObj>>, label: 'Hosted with' | 'In partnership with') => {
    const rawCategory = p.category ?? legacyCategoryFallback(p.type ?? null);
    const category: PartnerCategory = (rawCategory ?? 'community-delivery') as PartnerCategory;
    const shape: PartnerShape = (p.shape as PartnerShape | null) ?? defaultShapeForCategory(category);
    return (
      <Link
        key={String(p.id ?? p.slug)}
        href={`/partners/${p.slug}`}
        className="event-partner-chip"
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 12,
          padding: '10px 16px 10px 12px',
          background: 'rgba(243,240,231,0.06)',
          border: '1px solid rgba(243,240,231,0.18)',
          borderRadius: 999,
          textDecoration: 'none',
          color: 'inherit',
        }}
      >
        <span
          style={{
            display: 'inline-flex',
            width: 32,
            height: 32,
            borderRadius: 8,
            alignItems: 'center',
            justifyContent: 'center',
            background: 'rgba(243,240,231,0.08)',
          }}
        >
          <PartnerMark shape={shape} />
        </span>
        <span style={{ display: 'inline-flex', flexDirection: 'column', lineHeight: 1.15 }}>
          <span style={{ fontSize: 11, opacity: 0.7, textTransform: 'uppercase', letterSpacing: 0.5 }}>
            {label}
          </span>
          <span style={{ fontSize: 15, fontWeight: 500 }}>{p.name}</span>
        </span>
      </Link>
    );
  };

  return (
    <div
      className="event-partner-lockup"
      style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginTop: 20 }}
    >
      {hostDoc && renderChip(hostDoc, 'Hosted with')}
      {partnerDocs.map((p) => renderChip(p, 'In partnership with'))}
    </div>
  );
}
