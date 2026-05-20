'use client';

import { useMemo, useState } from 'react';
import {
  IcoCal,
  IcoGlobe,
  IcoMegaphone,
  IcoType,
  IcoTrend,
  IcoShare,
  IcoBriefcase,
} from '@/components/dashboard/Icons';

export interface ServiceItem {
  id: string | number;
  slug: string;
  title: string;
  description: string;
  category: string;
  tone: string;
  icon: string;
  price: string | null;
  priceLabel: string | null;
  ctaLabel: string;
}

const FILTERS = [
  { id: 'all', label: 'All' },
  { id: 'strategy', label: 'Strategy' },
  { id: 'build', label: 'Build & launch' },
  { id: 'marketing', label: 'Marketing' },
  { id: 'ops', label: 'Ops & systems' },
] as const;

function IconFor({ icon }: { icon: string }) {
  switch (icon) {
    case 'cal':
      return <IcoCal />;
    case 'globe':
      return <IcoGlobe />;
    case 'megaphone':
      return <IcoMegaphone />;
    case 'type':
      return <IcoType />;
    case 'trend':
      return <IcoTrend />;
    case 'share':
      return <IcoShare />;
    case 'briefcase':
    default:
      return <IcoBriefcase />;
  }
}

export default function ServicesCatalog({ services }: { services: ServiceItem[] }) {
  const [filter, setFilter] = useState<(typeof FILTERS)[number]['id']>('all');

  const visible = useMemo(
    () =>
      filter === 'all'
        ? services
        : services.filter((s) => s.category === filter),
    [services, filter],
  );

  if (services.length === 0) {
    return (
      <div className="gh-empty">
        <div className="gh-empty-h">Services coming soon</div>
        <p className="gh-empty-p">
          The team will populate the catalogue with strategy calls, website builds,
          marketing coaching and more.
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="gh-chips" style={{ marginBottom: 18 }}>
        {FILTERS.map((c) => (
          <button
            key={c.id}
            type="button"
            className={`gh-chip ${filter === c.id ? 'is-active' : ''}`}
            onClick={() => setFilter(c.id)}
          >
            {c.label}
          </button>
        ))}
      </div>

      {visible.length === 0 ? (
        <div className="gh-empty">
          <div className="gh-empty-h">Nothing in this category yet</div>
          <p className="gh-empty-p">
            Try a different filter or browse all services.
          </p>
        </div>
      ) : (
        <div className="gh-grid-3">
          {visible.map((s) => (
            <div key={s.id} className="gh-service">
              <div className={`gh-service-ic ${s.tone}`}>
                <IconFor icon={s.icon} />
              </div>
              <h3 className="gh-service-h">{s.title}</h3>
              <p className="gh-service-p">{s.description}</p>
              <div className="gh-service-foot">
                <div className="gh-service-price">
                  {s.price && <b>{s.price}</b>}
                  {s.priceLabel && <span>{s.priceLabel}</span>}
                </div>
                <a href={`/services/${s.slug}`} className="gh-btn">
                  {s.ctaLabel}
                </a>
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
}
