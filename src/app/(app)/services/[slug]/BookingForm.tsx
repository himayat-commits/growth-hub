'use client';

// Client form for requesting a service. POSTs to /api/service-bookings;
// on success replaces itself with a confirmation card.

import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface Props {
  serviceSlug: string;
  serviceTitle: string;
  /** Existing open booking — when present we render the confirmation
   *  state instead of the form. */
  initiallyBooked?: boolean;
}

export default function BookingForm({
  serviceSlug,
  serviceTitle,
  initiallyBooked = false,
}: Props) {
  const router = useRouter();
  const [notes, setNotes] = useState('');
  const [datePreference, setDatePreference] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(initiallyBooked);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const res = await fetch('/api/service-bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          serviceSlug,
          notes: notes.trim() || undefined,
          datePreference: datePreference.trim() || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error ?? 'Could not submit request');
      }
      setSubmitted(true);
      // Refresh the parent server component so the "Active services" card
      // on /services picks up the new booking.
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not submit request');
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div
        className="gh-card"
        style={{ borderColor: 'rgba(227,242,156,0.5)', background: 'var(--cream-soft)' }}
      >
        <div className="gh-card-h" style={{ color: 'var(--teal)' }}>
          ✓ Request received
        </div>
        <p style={{ color: 'var(--ink-70)', margin: '8px 0 14px', lineHeight: 1.6 }}>
          Thanks — the Growth Hub team has your request for{' '}
          <strong>{serviceTitle}</strong> and will be in touch within 1 business day.
          You&apos;ll see this engagement in your dashboard once it&apos;s scheduled.
        </p>
        <div style={{ display: 'flex', gap: 8 }}>
          <a className="gh-btn ghost" href="/services">
            Back to services
          </a>
          <a className="gh-btn" href="/messages">
            Open inbox
          </a>
        </div>
      </div>
    );
  }

  return (
    <form className="gh-form" onSubmit={submit}>
      <div className="gh-form-h">Request {serviceTitle}</div>
      <div className="gh-form-grid">
        <div className="gh-field full">
          <label>
            When are you free? <span className="hint">(optional)</span>
          </label>
          <input
            value={datePreference}
            onChange={(e) => setDatePreference(e.target.value)}
            placeholder="e.g. Weekday mornings, the week of June 8, flexible…"
            maxLength={200}
          />
        </div>
        <div className="gh-field full">
          <label>
            Anything we should know? <span className="hint">(optional)</span>
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="What are you trying to solve? Any context, budget, deadlines, or links that'd help us prep."
            maxLength={4000}
          />
        </div>
      </div>
      {error && (
        <div
          style={{
            color: 'var(--plum)',
            background: 'rgba(95,48,75,0.06)',
            border: '1px solid rgba(95,48,75,0.2)',
            padding: '10px 14px',
            borderRadius: 10,
            fontSize: 13,
            margin: '10px 0 0',
          }}
        >
          {error}
        </div>
      )}
      <div className="gh-form-foot">
        <a className="gh-btn ghost" href="/services">
          Cancel
        </a>
        <button type="submit" className="gh-btn" disabled={submitting}>
          {submitting ? 'Sending…' : 'Send request'}
        </button>
      </div>
    </form>
  );
}
