'use client';

// Interactive naming-concept voter for the Small Business Journey page.
// Pick state is local-only (no backend yet) — votes effectively land via the
// free-text "suggest" form, which opens a mailto: with the typed name.

import { useState } from 'react';

const CONCEPTS = [
  'Canberra Small Business Journey',
  'Start, Build, Grow',
  'Business Pathways Canberra',
  'The Small Business Journey',
  'Canberra Business Journey',
];

export default function NamingConcepts() {
  const [picked, setPicked] = useState<number | null>(null);
  const [draft, setDraft] = useState('');

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const subject = encodeURIComponent(`Event name suggestion: ${draft || '(blank)'}`);
    window.location.href = `mailto:hello@himayat.com.au?subject=${subject}`;
  };

  return (
    <section className="naming" id="name">
      <div className="wrap">
        <div className="naming-head">
          <div>
            <span className="section-label">Help us name it</span>
            <h2 className="section-h2">Five working concepts.<br />Tell us which lands.</h2>
          </div>
          <p className="naming-lead">
            The event name and final branding are still being developed. Below are the
            current working concepts — we&apos;d genuinely value your feedback, or a new
            suggestion of your own.
          </p>
        </div>

        <div className="naming-grid">
          {CONCEPTS.map((c, i) => (
            <button
              key={c}
              type="button"
              className={'name-card' + (picked === i ? ' is-picked' : '')}
              onClick={() => setPicked(picked === i ? null : i)}
            >
              <span className="name-num">No. 0{i + 1}</span>
              <span className="name-title">{c}</span>
              <span className="name-vote">
                {picked === i ? (
                  <>
                    <svg viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <path d="M2 7l3.5 3.5L12 4" />
                    </svg>
                    Your pick
                  </>
                ) : (
                  <>
                    <svg viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
                      <circle cx="7" cy="7" r="5.25" />
                    </svg>
                    Choose
                  </>
                )}
              </span>
            </button>
          ))}
        </div>

        <form className="name-suggest" onSubmit={submit}>
          <input
            type="text"
            placeholder="…or suggest a name of your own"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            aria-label="Suggest a name"
          />
          <button type="submit" className="btn btn-primary">
            Send suggestion
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" aria-hidden="true"><path d="M3 7h8M7 3l4 4-4 4" /></svg>
          </button>
        </form>
      </div>
    </section>
  );
}
