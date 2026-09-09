'use client';

// Client-side search + filter chips over the resources list. The full
// list is server-rendered into props once; filtering happens in-browser
// so there are no extra round trips.
//
// Gating: the server resolves the member's plan tier once (resources/page.tsx)
// and passes `canOpenMemberResources`. A `free: false` item for a Free-tier
// member renders as a locked card — no href to the file, a lock glyph,
// "Members on a paid plan" and a /plan link — so the paid gate is real
// rather than a "· Member" label next to a working link.

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { IcoLock } from '@/components/dashboard/Icons';

interface ResourceItem {
  id: string | number;
  title: string;
  tag: string;
  tone: string | null;
  meta?: string | null;
  url?: string | null;
  free: boolean | null;
  thumbnailUrl: string | null;
}

const FILTERS = ['all', 'guide', 'template', 'course', 'video', 'webinar'] as const;
const FILTER_LABELS: Record<(typeof FILTERS)[number], string> = {
  all: 'All',
  guide: 'Guides',
  template: 'Templates',
  course: 'Courses',
  video: 'Videos',
  webinar: 'Webinars',
};

// One empty-library message, shared with the page header (F5.10).
export const EMPTY_LIBRARY_TITLE = "Library's empty for now";
export const EMPTY_LIBRARY_BODY =
  'New guides, templates and courses appear here as we publish them.';

function Thumb({ r }: { r: ResourceItem }) {
  const tone = r.tone ?? 'cream';
  return r.thumbnailUrl ? (
    <div
      className={`gh-resource-thumb ${tone}`}
      style={{
        backgroundImage: `url(${r.thumbnailUrl})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    >
      <span className="gh-resource-tag">{r.tag}</span>
    </div>
  ) : (
    <div className={`gh-resource-thumb ${tone}`}>
      <span className="gh-resource-tag">{r.tag}</span>
    </div>
  );
}

export default function ResourcesGrid({
  items,
  canOpenMemberResources,
}: {
  items: ResourceItem[];
  canOpenMemberResources: boolean;
}) {
  const [filter, setFilter] = useState<(typeof FILTERS)[number]>('all');
  const [query, setQuery] = useState('');

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return items.filter((r) => {
      if (filter !== 'all' && r.tag.toLowerCase() !== filter) return false;
      if (q && !r.title.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [items, filter, query]);

  return (
    <>
      <div
        className="gh-card"
        style={{ flexDirection: 'row', alignItems: 'center', gap: 14, padding: '14px 16px' }}
      >
        <div style={{ position: 'relative', flex: 1, maxWidth: 480 }}>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search resources, courses, downloads…"
            style={{
              width: '100%',
              height: 38,
              border: '1px solid var(--rule)',
              background: 'var(--bg)',
              borderRadius: 'var(--r-md)',
              padding: '0 14px',
              fontSize: 13.5,
              fontFamily: 'inherit',
              outline: 'none',
            }}
          />
        </div>
        <div className="gh-chips">
          {FILTERS.map((f) => (
            <button
              key={f}
              type="button"
              className={`gh-chip ${filter === f ? 'is-active' : ''}`}
              onClick={() => setFilter(f)}
            >
              {FILTER_LABELS[f]}
            </button>
          ))}
        </div>
      </div>

      {items.length === 0 ? (
        <div className="gh-empty">
          <div className="gh-empty-h">{EMPTY_LIBRARY_TITLE}</div>
          <p className="gh-empty-p">{EMPTY_LIBRARY_BODY}</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="gh-empty">
          <div className="gh-empty-h">Nothing matches that filter</div>
          <p className="gh-empty-p">Try a different category or clear the search box.</p>
        </div>
      ) : (
        <div className="gh-grid-3">
          {filtered.map((r) => {
            const locked = r.free === false && !canOpenMemberResources;

            if (locked) {
              return (
                <div
                  key={r.id}
                  className="gh-resource"
                  style={{ cursor: 'default' }}
                  aria-label={`${r.title} — members on a paid plan`}
                >
                  <Thumb r={r} />
                  <h4 className="gh-resource-h">{r.title}</h4>
                  <div className="gh-resource-meta" style={{ justifyContent: 'space-between' }}>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                      <IcoLock style={{ width: 12, height: 12 }} />
                      Members on a paid plan
                    </span>
                    <Link href="/plan" className="gh-card-link">
                      Upgrade →
                    </Link>
                  </div>
                </div>
              );
            }

            const href = r.url ?? '#';
            return (
              <a
                key={r.id}
                href={href}
                target={href !== '#' ? '_blank' : undefined}
                rel={href !== '#' ? 'noopener noreferrer' : undefined}
                className="gh-resource"
                style={{ textDecoration: 'none', color: 'inherit', display: 'block' }}
              >
                <Thumb r={r} />
                <h4 className="gh-resource-h">{r.title}</h4>
                <div className="gh-resource-meta">
                  <span>
                    {r.meta ?? r.tag}
                    {r.free === false ? ' · Member' : ' · Free'}
                  </span>
                </div>
              </a>
            );
          })}
        </div>
      )}
    </>
  );
}
