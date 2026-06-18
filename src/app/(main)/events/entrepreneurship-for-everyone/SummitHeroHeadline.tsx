'use client';

// Roll-call hero headline for the summit. The page's thesis is the breadth of
// the room, so the headline turns that into the hero: the second line cycles
// slowly through the real audiences and *settles* on "Everyone" — it never
// loops. Deliberately quiet, in keeping with the brand voice.
//
// Accessibility & no-JS: the server renders (and the initial client state is)
// "Everyone", so assistive tech and no-JS visitors always get the honest end
// state. The cycling visual is aria-hidden and a stable .sr-only "Everyone"
// carries the accessible heading text, so screen readers announce
// "Entrepreneurship for Everyone" once — not six times. prefers-reduced-motion
// skips the cycle entirely and holds on "Everyone".

import { useEffect, useState } from 'react';

// The roll lands on the last item and stops there. Each entry is a real
// audience the day is built for; keep them short enough to sit on one line
// (see .hero-roll — `white-space: nowrap` — in globals.css).
const ROLL = [
  'founders',
  'tradies',
  'sole traders',
  'new migrants',
  'women in business',
  'side-hustlers',
  'NDIS & aged-care',
  'community groups',
  'first-timers',
  'Everyone',
] as const;

const STEP_MS = 1200;

export default function SummitHeroHeadline() {
  // Matches the server render, so hydration is clean; the effect takes it from
  // here when motion is allowed.
  const [word, setWord] = useState<string>('Everyone');

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    let i = 0;
    setWord(ROLL[0]);
    const id = window.setInterval(() => {
      i += 1;
      setWord(ROLL[i]);
      if (i >= ROLL.length - 1) window.clearInterval(id);
    }, STEP_MS);

    return () => window.clearInterval(id);
  }, []);

  // Two deliberate lines: "Entrepreneurship" on its own, then "for <word>" as a
  // single non-wrapping unit. Gluing "for" to the rolling word means the longest
  // audiences (e.g. "women in business") can never spill onto a third line as
  // the word cycles — the headline is always exactly two lines.
  return (
    <h1 className="hero-h1">
      <span className="hero-line1">Entrepreneurship</span>
      <span className="hero-roll-line">
        for{' '}
        <span className="hero-roll" aria-hidden="true">
          <span key={word} className="hero-roll-word">
            {word}
          </span>
          <svg
            className="hero-roll-underline"
            viewBox="0 0 300 12"
            preserveAspectRatio="none"
            aria-hidden="true"
          >
            <path d="M3 8 Q80 2 160 7 T297 6" fill="none" strokeWidth="9" strokeLinecap="round" />
          </svg>
        </span>
      </span>
      <span className="sr-only">Everyone</span>
    </h1>
  );
}
