'use client';

// Client-side toggle for "Register" / "Registered ✓" state. Optimistic
// update — flip the label immediately, send the POST in the background,
// roll back on failure.
//
// Once registered, the join link is rendered persistently next to the button
// (F3.2) instead of the old popup-blocked `window.open` after the fetch. The
// server only passes `meetingUrl` for events the user has RSVP'd to, so we
// `router.refresh()` after a successful toggle to pull it in (or drop it).

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';

function hostOf(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, '');
  } catch {
    return 'external site';
  }
}

export default function RsvpButton({
  eventId,
  initialRsvped,
  registerUrl,
  meetingUrl,
}: {
  eventId: number;
  initialRsvped: boolean;
  /** External registration page (Eventbrite etc.) — fallback label when there
   *  is no meeting link. */
  registerUrl?: string | null;
  /** Members-only join link; only supplied by the server once RSVP'd. */
  meetingUrl?: string | null;
}) {
  const router = useRouter();
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
        // Re-render the server component so the join link appears/disappears.
        router.refresh();
      } catch (e) {
        // Roll back optimistic flip on failure.
        setRsvped(!next);
        setErr(e instanceof Error ? e.message : 'Could not update RSVP');
      }
    });
  };

  const link = rsvped
    ? meetingUrl
      ? { href: meetingUrl, label: 'Join online →' }
      : registerUrl
        ? { href: registerUrl, label: `Register on ${hostOf(registerUrl)} →` }
        : null
    : null;

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
      {link && (
        <a
          href={link.href}
          target="_blank"
          rel="noopener noreferrer"
          className="gh-btn"
          style={{ whiteSpace: 'nowrap' }}
        >
          {link.label}
        </a>
      )}
      {err && (
        <div style={{ fontSize: 12, color: 'var(--plum)', marginTop: 6 }}>{err}</div>
      )}
    </>
  );
}
