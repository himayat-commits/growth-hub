'use client';

// Re-run + resend-handoff controls for the detail page. Both POST to the
// ops API then router.refresh() so the server-rendered timeline/checklist
// pick up the new state. A re-run can genuinely take minutes on live mode,
// so the button holds its pending copy until the response lands.

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';

const REASON_LABELS: Record<string, string> = {
  no_state: 'no onboarding state found',
  already_provisioned: 'already fully provisioned',
  in_progress: 'a run is already in progress',
  locked: 'another run holds the lock',
};

export default function RerunButtons({
  userId,
  running,
}: {
  userId: string;
  running: boolean;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState<'rerun' | 'handoff' | null>(null);
  const [note, setNote] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  const rerun = async () => {
    setBusy('rerun');
    setNote(null);
    try {
      const res = await fetch(`/api/ops/provisioning/${encodeURIComponent(userId)}/rerun`, {
        method: 'POST',
      });
      const data = (await res.json().catch(() => ({}))) as {
        ok?: boolean;
        status?: string;
        error?: string;
        reason?: string;
      };
      if (res.ok && data.ok) {
        setNote(`Run finished: ${data.status}${data.error ? ` — ${data.error}` : ''}`);
      } else if (data.reason) {
        setNote(`Not started — ${REASON_LABELS[data.reason] ?? data.reason}`);
      } else {
        setNote(data.error ?? 'Re-run failed');
      }
    } catch {
      setNote('Re-run failed');
    } finally {
      setBusy(null);
      startTransition(() => router.refresh());
    }
  };

  const resend = async () => {
    setBusy('handoff');
    setNote(null);
    try {
      const res = await fetch(
        `/api/ops/provisioning/${encodeURIComponent(userId)}/resend-handoff`,
        { method: 'POST' },
      );
      const data = (await res.json().catch(() => ({}))) as { ok?: boolean; error?: string };
      setNote(res.ok && data.ok ? 'Handoff resent.' : (data.error ?? 'Resend failed'));
    } catch {
      setNote('Resend failed');
    } finally {
      setBusy(null);
      startTransition(() => router.refresh());
    }
  };

  return (
    <span className="gh-ops-actions" style={{ gap: 8 }}>
      <button
        type="button"
        className="gh-ops-actionbtn"
        onClick={rerun}
        disabled={busy !== null || running}
      >
        {busy === 'rerun' ? 'Re-running… this can take a few minutes' : 'Re-run provisioning'}
      </button>
      <button
        type="button"
        className="gh-ops-actionbtn"
        onClick={resend}
        disabled={busy !== null}
      >
        {busy === 'handoff' ? 'Resending…' : 'Resend ops handoff'}
      </button>
      {running && busy === null && (
        <span className="gh-ops-meta">A run is currently in progress.</span>
      )}
      {note && <span className="gh-ops-meta">{note}</span>}
    </span>
  );
}
