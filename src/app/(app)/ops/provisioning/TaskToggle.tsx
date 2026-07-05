'use client';

// Checkbox toggling a handoff task open⇄done. Optimistic flip, PATCH to
// /api/ops/provisioning/tasks/[id], then router.refresh() so the
// server-rendered doneBy/doneAt meta catches up (mirrors AssignStrategist).

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';

export default function TaskToggle({ id, status }: { id: number; status: string }) {
  const router = useRouter();
  const [done, setDone] = useState(status === 'done');
  const [pending, startTransition] = useTransition();
  const [err, setErr] = useState<string | null>(null);

  const toggle = async (next: boolean) => {
    setDone(next);
    setErr(null);
    try {
      const res = await fetch(`/api/ops/provisioning/tasks/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: next ? 'done' : 'open' }),
      });
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(data.error ?? 'Update failed');
      }
      startTransition(() => router.refresh());
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Update failed');
      setDone(!next);
    }
  };

  return (
    <label
      style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12, cursor: 'pointer' }}
    >
      <input
        type="checkbox"
        checked={done}
        disabled={pending}
        onChange={(e) => toggle(e.target.checked)}
        aria-label={done ? 'Reopen task' : 'Mark task done'}
      />
      {done ? 'Reopen' : 'Mark done'}
      {err && <span className="gh-ops-err">{err}</span>}
    </label>
  );
}
