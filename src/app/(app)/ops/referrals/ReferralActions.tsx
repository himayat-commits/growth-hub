'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';

type Status = 'pending' | 'qualified' | 'credited' | 'declined';

const NEXT_STATES: Record<Status, Status[]> = {
  pending: ['qualified', 'declined'],
  qualified: ['credited', 'declined'],
  credited: [],
  declined: ['pending'],
};

export default function ReferralActions({
  id,
  currentStatus,
  canEdit,
}: {
  id: number;
  currentStatus: Status;
  canEdit: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [err, setErr] = useState<string | null>(null);
  const nextStates = NEXT_STATES[currentStatus];

  const update = async (next: Status) => {
    setErr(null);
    try {
      const res = await fetch(`/api/ops/referrals/${id}`, {
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

  // Support-role staff see status but can't change it (admin-only action).
  if (!canEdit || nextStates.length === 0) {
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
          {pending ? '…' : `→ ${s}`}
        </button>
      ))}
      {err && <span className="gh-ops-err">{err}</span>}
    </div>
  );
}
