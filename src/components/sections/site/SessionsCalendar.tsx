'use client';

// "What's on" list for /events: filter by kind or topic, first six rows
// shown, the rest behind a button. Rows come pre-built from buildCalendar().

import { useState } from 'react';
import Link from 'next/link';
import type { CalendarRow, SessionArea } from '@/lib/sessions';
import SessionDate from './SessionDate';

type Filter = 'all' | 'session' | 'lab' | SessionArea;

const INITIAL_ROWS = 6;

export default function SessionsCalendar({ rows }: { rows: CalendarRow[] }) {
  const [filter, setFilter] = useState<Filter>('all');
  const [showAll, setShowAll] = useState(false);

  const areas = [...new Set(rows.map((r) => r.area).filter((a): a is SessionArea => Boolean(a)))];
  const filtered = rows.filter((r) => {
    if (filter === 'all') return true;
    if (filter === 'session' || filter === 'lab') return r.kind === filter;
    return r.area === filter;
  });
  const visible = showAll ? filtered : filtered.slice(0, INITIAL_ROWS);
  const hiddenCount = filtered.length - visible.length;

  const chip = (value: Filter, label: string) => (
    <button
      type="button"
      key={value}
      className="cal-chip"
      aria-pressed={filter === value}
      onClick={() => setFilter(value)}
    >
      {label}
    </button>
  );

  if (rows.length === 0) {
    return (
      <div className="cal">
        <p className="cal-empty">
          Nothing is scheduled right now while we plan the next season. Get the
          monthly email below to hear about new dates first.
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="cal-filters" role="group" aria-label="Filter what's on">
        {chip('all', 'All')}
        {chip('session', 'Free Sessions')}
        {chip('lab', 'Build Labs')}
        {areas.length > 1 && <span className="cal-chip-sep" aria-hidden="true" />}
        {areas.length > 1 && areas.map((a) => chip(a, a))}
      </div>

      <div className="cal">
        {visible.map((r, i) => {
          const tagTone = r.kind === 'lab' ? ' site-tag--lab' : r.kind === 'session' ? ' site-tag--free' : '';
          return (
            <div className={`cal-row${i === 0 && filter === 'all' ? ' is-next' : ''}`} key={r.key}>
              <SessionDate date={r.date} kind={r.kind} muted={!r.href} />
              <div className="cal-main">
                <span className="cal-tags">
                  <span className={`site-tag${tagTone}`}>
                    {r.label} · {r.price}
                  </span>
                  {r.area && (
                    <span>
                      {r.area}
                      {r.pilot ? ' · pilot' : ''}
                    </span>
                  )}
                </span>
                {r.href ? (
                  <Link className="cal-title" href={r.href}>{r.title}</Link>
                ) : (
                  <span className="cal-title">{r.title}</span>
                )}
              </div>
              <span className="cal-meta">
                {r.time}
                <br />
                {r.where}
              </span>
              <div className="cal-action">
                {r.href ? (
                  <>
                    <Link className={`btn ${r.kind === 'lab' ? 'btn-secondary' : 'btn-primary'}`} href={r.href}>
                      {r.kind === 'lab' ? 'Book a seat' : 'Register'}
                    </Link>
                    {r.seats && <span className="cal-seats">{r.seats}</span>}
                  </>
                ) : (
                  <span className="cal-soon">Registration opens soon</span>
                )}
              </div>
            </div>
          );
        })}
        {filtered.length === 0 && <p className="cal-empty">Nothing in this topic yet this season.</p>}
        {hiddenCount > 0 && (
          <button type="button" className="cal-more" onClick={() => setShowAll(true)}>
            Show {hiddenCount} more
          </button>
        )}
      </div>
    </>
  );
}
