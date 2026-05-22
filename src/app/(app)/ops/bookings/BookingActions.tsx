'use client';

// Tiny status-transition controls for the bookings table. POSTs to
// /api/ops/bookings/[id] then refreshes the page so the table reflects
// the new state.

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';

type Status = 'requested' | 'scheduled' | 'in_progress' | 'completed' | 'cancelled';

// Allowed next states from each current state. Keeps ops from setting
// nonsensical transitions in the dropdown.
const NEXT_STATES: Record<Status, Status[]> = {
  requested: ['scheduled', 'cancelled'],
  scheduled: ['in_progress', 'completed', 'cancelled'],
  in_progress: ['completed', 'cancelled'],
  completed: [],
  cancelled: ['requested'],
};

export default function BookingActions({
  id,
  currentStatus,
}: {
  id: number;
  currentStatus: Status;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [err, setErr] = useState<string | null>(null);
  const nextStates = NEXT_STATES[currentStatus];

  const update = async (next: Status) => {
    setErr(null);
    try {
      const res = await fetch(`/api/ops/bookings/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: next }),
      });
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(data.error ?? 'Update failed');
      }
      startTransition(() => router.refresh());
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Update failed');
    }
  };

  if (nextStates.length === 0) {
    return <span className="gh-ops-meta">—</span>;
  }
  return (
    <div className="gh-ops-actions">
      {nextStates.map((s) => (
        <button
          key={s}
          type="button"
          className="gh-ops-actionbtn"
          disabled={pending}
          onClick={() => update(s)}
        >
          {pending ? '…' : `→ ${s.replace('_', ' ')}`}
        </button>
      ))}
      {err && <span className="gh-ops-err">{err}</span>}
    </div>
  );
}
