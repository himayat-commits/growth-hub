'use client';

// Inline strategist picker for the /ops/signups table. PATCHes
// /api/ops/signups/[id] then router.refresh() so the row reflects the
// new assignment without a full reload.

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';

export type StrategistOption = { slug: string; name: string };

export default function AssignStrategist({
  userId,
  currentSlug,
  options,
  canEdit,
}: {
  userId: string;
  currentSlug: string | null;
  options: StrategistOption[];
  canEdit: boolean;
}) {
  const router = useRouter();
  const [value, setValue] = useState<string>(currentSlug ?? '');
  const [pending, startTransition] = useTransition();
  const [err, setErr] = useState<string | null>(null);

  const onChange = async (next: string) => {
    setValue(next);
    setErr(null);
    try {
      const res = await fetch(
        `/api/ops/signups/${encodeURIComponent(userId)}`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ assignedStrategistId: next || null }),
        },
      );
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(data.error ?? 'Update failed');
      }
      startTransition(() => router.refresh());
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Update failed');
      setValue(currentSlug ?? '');
    }
  };

  // Support-role staff see the assignment but can't change it (admin only).
  if (!canEdit) {
    const current = options.find((o) => o.slug === currentSlug)?.name;
    return <span className="gh-ops-meta">{current ?? (currentSlug || '— unassigned —')}</span>;
  }

  return (
    <div className="gh-ops-assign">
      <select
        className="gh-ops-select"
        value={value}
        disabled={pending}
        onChange={(e) => onChange(e.target.value)}
        aria-label="Assigned strategist"
      >
        <option value="">— unassigned —</option>
        {options.map((o) => (
          <option key={o.slug} value={o.slug}>
            {o.name}
          </option>
        ))}
      </select>
      {err && <span className="gh-ops-err">{err}</span>}
    </div>
  );
}
