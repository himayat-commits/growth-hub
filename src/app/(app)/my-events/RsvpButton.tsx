'use client';

// Client-side toggle for "Register" / "Registered ✓" state. Optimistic
// update — flip the label immediately, send the POST in the background,
// roll back on failure.

import { useState, useTransition } from 'react';

export default function RsvpButton({
  eventId,
  initialRsvped,
  registerUrl,
}: {
  eventId: number;
  initialRsvped: boolean;
  registerUrl?: string | null;
}) {
  const [rsvped, setRsvped] = useState(initialRsvped);
  const [pending, startTransition] = useTransition();
  const [err, setErr] = useState<string | null>(null);

  const toggle = async () => {
    setErr(null);
    const next = !rsvped;
    setRsvped(next);
    startTransition(async () => {
      try {
        const res = await fetch(`/api/events/${eventId}/rsvp`, {
          method: next ? 'POST' : 'DELETE',
        });
        if (!res.ok) throw new Error((await res.json())?.error ?? 'Could not update RSVP');
        // If they have an external registration URL, open it on first RSVP.
        if (next && registerUrl) {
          window.open(registerUrl, '_blank', 'noopener,noreferrer');
        }
      } catch (e) {
        // Roll back optimistic flip on failure.
        setRsvped(!next);
        setErr(e instanceof Error ? e.message : 'Could not update RSVP');
      }
    });
  };

  return (
    <>
      <button
        type="button"
        className={rsvped ? 'gh-btn ghost' : 'gh-btn'}
        onClick={toggle}
        disabled={pending}
      >
        {pending ? 'Saving…' : rsvped ? 'Registered ✓' : 'Register free'}
      </button>
      {err && (
        <div style={{ fontSize: 12, color: 'var(--plum)', marginTop: 6 }}>{err}</div>
      )}
    </>
  );
}
