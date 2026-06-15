'use client';

// Interactive "plan your day" panel for the right-hand hero column. Each row is
// a disclosure button that expands inline within the page (no navigation, no
// modal) — the kind of thing a prospective attendee wants before deciding to
// come. The "See the draft program" row opens by default so the most-wanted
// content is visible without a click, and links down to the full program.

import { useState, type ReactNode } from 'react';
import { track } from '@/lib/analytics';
import { SUMMIT } from '@/lib/summit';

export interface ProgramBlock {
  time: string;
  title: string;
  pin?: boolean;
  brk?: boolean;
}

const Chevron = () => (
  <svg
    className="chev"
    width="18"
    height="18"
    viewBox="0 0 18 18"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.7"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <path d="M6 4l5 5-5 5" />
  </svg>
);

// Compact "9 Jul" chip derived from the canonical date string so it stays in
// sync with src/lib/summit.ts (e.g. "Thursday 9 July 2026" → "9 Jul").
const SHORT_DATE = (() => {
  const m = SUMMIT.dateLong.match(/(\d+)\s+(\w{3})/);
  return m ? `${m[1]} ${m[2]}` : null;
})();

export default function PlanYourDayPanel({ blocks }: { blocks: ProgramBlock[] }) {
  const [open, setOpen] = useState<string | null>('program');

  const toggle = (id: string) => {
    setOpen((cur) => {
      const next = cur === id ? null : id;
      if (next) track('summit_plan_expand', { slug: SUMMIT.slug, section: id });
      return next;
    });
  };

  const row = (id: string, label: string, body: ReactNode) => {
    const isOpen = open === id;
    return (
      <div className={'plan-row' + (isOpen ? ' is-open' : '')}>
        <button
          type="button"
          className="plan-q"
          aria-expanded={isOpen}
          aria-controls={`plan-${id}`}
          onClick={() => toggle(id)}
        >
          <span className="plan-q-label">{label}</span>
          <Chevron />
        </button>
        <div className="plan-a-wrap">
          <div className="plan-a">
            <div className="plan-a-inner" id={`plan-${id}`} role="region" aria-label={label}>
              {body}
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="plan-panel">
      <div className="plan-panel-head">
        <div className="plan-head-text">
          <span className="plan-eyebrow">Planning to come?</span>
          <p className="plan-lede">Free and open to all. Here&apos;s the day at a glance.</p>
        </div>
        {SHORT_DATE && <span className="plan-chip">{SHORT_DATE}</span>}
      </div>
      <div className="plan-acc">
        {row(
          'program',
          'See the draft program',
          <>
            <ul className="plan-prog">
              {blocks.map((b, idx) => (
                <li key={idx} className={b.pin ? 'is-pin' : b.brk ? 'is-break' : ''}>
                  <span className="t">{b.time}</span>
                  <span className="n">{b.title}</span>
                </li>
              ))}
            </ul>
            <a className="plan-jump" href="#program">
              See the full program with sessions ↓
            </a>
          </>,
        )}
        {row(
          'who',
          'Who should come',
          <ul className="plan-list">
            <li>First-time and early-stage founders</li>
            <li>Tradies and sole traders</li>
            <li>Side-hustlers thinking about going full-time</li>
            <li>NDIS, aged-care &amp; community-service operators</li>
            <li>Anyone curious about starting something</li>
          </ul>,
        )}
        {row(
          'included',
          "What's included",
          <ul className="plan-list">
            <li>Free entry — no ticket cost</li>
            <li>Talks, hands-on workshops &amp; one-to-one help desks</li>
            <li>Catered lunch and a lucky-door prize</li>
            <li>Quiet catch-up area &amp; accessibility support</li>
            <li>Networking drinks to finish the day</li>
          </ul>,
        )}
        {row(
          'getting-there',
          'Getting there',
          <>
            <p className="plan-where">{SUMMIT.venueFull}</p>
            <p className="plan-note">
              {SUMMIT.dateLong} · {SUMMIT.time}. Accessible venue with lift access — tell us about
              any access needs when you register and we&apos;ll sort them out.
            </p>
          </>,
        )}
      </div>
    </div>
  );
}
