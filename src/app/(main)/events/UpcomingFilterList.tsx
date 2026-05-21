'use client';

// Filter chips + filtered list for upcoming events.
// Kept client-only because the chip-state needs to live in the URL/hash later;
// for now it's local useState. The data is passed in from the server page so
// the initial render is hydration-safe.

import { useMemo, useState } from 'react';
import Link from 'next/link';
import type { PublicEvent, EventCategory } from '@/lib/events-data';

const CATEGORIES: Array<'All' | EventCategory> = [
  'All', 'Summit', 'Workshop', 'Mixer', 'Clinic', 'Community',
];

function ClockIcon() {
  return (
    <svg viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
      <circle cx="7" cy="7" r="5" /><path d="M7 4v3l2 1.5" />
    </svg>
  );
}
function PinIcon() {
  return (
    <svg viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
      <path d="M7 13 C 4 9, 2 7, 2 5 A 5 5 0 0 1 12 5 C 12 7, 10 9, 7 13 Z" />
      <circle cx="7" cy="5" r="1.5" />
    </svg>
  );
}
function CostIcon() {
  return (
    <svg viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
      <path d="M2 4 H 12 V 11 H 2 Z M2 7 H 12" />
    </svg>
  );
}
function ArrowIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" aria-hidden="true">
      <path d="M3 8h9M8 3l5 5-5 5" />
    </svg>
  );
}

export default function UpcomingFilterList({ events }: { events: PublicEvent[] }) {
  const [filter, setFilter] = useState<'All' | EventCategory>('All');

  const counts = useMemo(() => {
    const c: Record<string, number> = { All: events.length };
    for (const e of events) c[e.cat] = (c[e.cat] ?? 0) + 1;
    return c;
  }, [events]);

  const visible = filter === 'All' ? events : events.filter((e) => e.cat === filter);

  return (
    <>
      <div className="evlist-filters">
        {CATEGORIES.map((c) => (
          <button
            key={c}
            type="button"
            className={'evlist-chip' + (filter === c ? ' is-on' : '')}
            onClick={() => setFilter(c)}
          >
            <span>{c}</span>
            <em>{counts[c] ?? 0}</em>
          </button>
        ))}
      </div>

      <div className="evlist">
        {visible.map((ev) => (
          <Link className="ev-row" key={ev.slug} href={`/events/${ev.slug}`}>
            <div className="ev-date">
              <span className="month">{ev.monthShort}</span>
              <span className="day">{ev.day === '?' ? <em>?</em> : ev.day}</span>
              <span className="year">{ev.year}</span>
            </div>
            <div className="ev-main">
              <span className={'ev-tag ' + ev.tagClass}>{ev.tag}</span>
              <h3>{ev.title}</h3>
              <p className="ev-desc">{ev.desc}</p>
              <div className="ev-meta">
                <span className="it"><ClockIcon />{ev.time}</span>
                <span className="it"><PinIcon />{ev.location}</span>
                <span className="it"><CostIcon />{ev.cost}</span>
              </div>
            </div>
            <span className="ev-cta">View event<ArrowIcon /></span>
          </Link>
        ))}
      </div>
    </>
  );
}
