'use client';

// Client form for requesting a service. POSTs to /api/service-bookings;
// on success replaces itself with a confirmation card.
//
// Triage intake (F4.1): the member picks the ONE thing they need help with
// (prefilled from their profile help areas) and up to three preferred slots
// (day + morning/midday/afternoon) so the strategist can confirm a time in
// one reply instead of a back-and-forth.

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  MAX_PREFERRED_SLOTS,
  NEEDS,
  NEED_LABELS,
  SLOT_WINDOWS,
  SLOT_WINDOW_LABELS,
  type Need,
  type SlotWindow,
} from '@/lib/advisory/needs';

interface Props {
  serviceSlug: string;
  serviceTitle: string;
  /** Existing open booking — when present we render the confirmation
   *  state instead of the form. */
  initiallyBooked?: boolean;
  /** Why the form is blocked (e.g. the lifetime Growth Call rule). Rendered
   *  instead of the form when set. */
  blockedMessage?: string | null;
  /** Prefill for the need select — derived from profile.helpAreas. */
  initialNeed?: Need | null;
}

interface SlotDraft {
  day: string;
  window: SlotWindow;
}

/** Tomorrow in YYYY-MM-DD (local) — the earliest sensible preferred day. */
function tomorrowIso(): string {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export default function BookingForm({
  serviceSlug,
  serviceTitle,
  initiallyBooked = false,
  blockedMessage = null,
  initialNeed = null,
}: Props) {
  const router = useRouter();
  const [need, setNeed] = useState<Need | ''>(initialNeed ?? '');
  const [slots, setSlots] = useState<SlotDraft[]>([
    { day: '', window: 'morning' },
    { day: '', window: 'afternoon' },
  ]);
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(initiallyBooked);
  const minDay = tomorrowIso();

  const updateSlot = (i: number, patch: Partial<SlotDraft>) =>
    setSlots((prev) => prev.map((s, j) => (j === i ? { ...s, ...patch } : s)));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!need) {
      setError('Tell us what you need help with so we can match the right strategist.');
      return;
    }
    const filled = slots.filter((s) => s.day);
    if (filled.length === 0) {
      setError('Pick at least one day that suits you.');
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch('/api/service-bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          serviceSlug,
          need,
          preferredSlots: filled,
          notes: notes.trim() || undefined,
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

  if (!submitted && blockedMessage) {
    return (
      <div className="gh-card">
        <div className="gh-card-h">{serviceTitle}</div>
        <p style={{ color: 'var(--ink-70)', margin: '8px 0 14px', lineHeight: 1.6 }}>
          {blockedMessage}
        </p>
        <div style={{ display: 'flex', gap: 8 }}>
          <Link className="gh-btn ghost" href="/services#services">
            Other services
          </Link>
          <Link className="gh-btn" href="/messages">
            Message your strategist
          </Link>
        </div>
      </div>
    );
  }

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
          <strong>{serviceTitle}</strong> and will confirm a time within 1 business day.
          We&apos;ve emailed you a copy; you&apos;ll see this engagement in your dashboard once
          it&apos;s scheduled.
        </p>
        <div style={{ display: 'flex', gap: 8 }}>
          <Link className="gh-btn ghost" href="/services">
            Back to services
          </Link>
          <Link className="gh-btn" href="/messages">
            Open inbox
          </Link>
        </div>
      </div>
    );
  }

  return (
    <form className="gh-form" onSubmit={submit}>
      <div className="gh-form-h">Request {serviceTitle}</div>
      <div className="gh-form-grid">
        <div className="gh-field full">
          <label htmlFor="booking-need">What do you most need help with?</label>
          <select
            id="booking-need"
            value={need}
            onChange={(e) => setNeed(e.target.value as Need)}
            required
          >
            <option value="" disabled>
              Choose one…
            </option>
            {NEEDS.map((n) => (
              <option key={n} value={n}>
                {NEED_LABELS[n]}
              </option>
            ))}
          </select>
        </div>

        <div className="gh-field full">
          <label>
            When suits you? <span className="hint">(pick up to {MAX_PREFERRED_SLOTS})</span>
          </label>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {slots.map((s, i) => (
              <div key={i} style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                <input
                  type="date"
                  aria-label={`Preferred day ${i + 1}`}
                  min={minDay}
                  value={s.day}
                  onChange={(e) => updateSlot(i, { day: e.target.value })}
                  style={{ flex: '1 1 160px' }}
                />
                <select
                  aria-label={`Preferred time ${i + 1}`}
                  value={s.window}
                  onChange={(e) => updateSlot(i, { window: e.target.value as SlotWindow })}
                  style={{ flex: '1 1 180px' }}
                >
                  {SLOT_WINDOWS.map((w) => (
                    <option key={w} value={w}>
                      {SLOT_WINDOW_LABELS[w]}
                    </option>
                  ))}
                </select>
              </div>
            ))}
            {slots.length < MAX_PREFERRED_SLOTS && (
              <button
                type="button"
                className="gh-btn ghost"
                style={{ alignSelf: 'flex-start', fontSize: 13, padding: '6px 14px' }}
                onClick={() => setSlots((p) => [...p, { day: '', window: 'midday' }])}
              >
                + Add another option
              </button>
            )}
          </div>
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
        <Link className="gh-btn ghost" href="/services">
          Cancel
        </Link>
        <button type="submit" className="gh-btn" disabled={submitting}>
          {submitting ? 'Sending…' : 'Send request'}
        </button>
      </div>
    </form>
  );
}
