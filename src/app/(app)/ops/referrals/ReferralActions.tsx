'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';

type Status = 'pending' | 'qualified' | 'credited' | 'declined';

// Valid transitions. 'credited' is terminal — the server rejects anything
// out of it, so we don't offer it. 'credited' is only reachable from
// 'qualified' because the server runs the real issuance path.
const NEXT_STATES: Record<Status, Status[]> = {
  pending: ['qualified', 'declined'],
  qualified: ['credited', 'declined'],
  credited: [],
  declined: ['pending'],
};

const LABELS: Record<Status, string> = {
  qualified: 'Mark qualified (call done)',
  credited: 'Issue A$50 credits',
  declined: 'Decline',
  pending: 'Reopen',
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
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const nextStates = NEXT_STATES[currentStatus];

  const update = async (next: Status) => {
    if (
      next === 'credited' &&
      !window.confirm(
        'Issue A$50 to both sides now? Paid members get a Stripe balance credit; Free members have it held until they subscribe. This cannot be undone.',
      )
    ) {
      return;
    }
    setErr(null);
    setBusy(true);
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
    } finally {
      setBusy(false);
    }
  };

  // Support-role staff see status but can't change it (admin-only action).
  if (!canEdit || nextStates.length === 0) {
    return (
      <span className="gh-ops-meta">{currentStatus === 'credited' ? 'Final' : '—'}</span>
    );
  }
  const disabled = pending || busy;
  return (
    <div className="gh-ops-actions">
      {nextStates.map((s) => (
        <button
          key={s}
          type="button"
          className="gh-ops-actionbtn"
          disabled={disabled}
          onClick={() => update(s)}
        >
          {disabled ? '…' : LABELS[s]}
        </button>
      ))}
      {err && <span className="gh-ops-err">{err}</span>}
    </div>
  );
}
