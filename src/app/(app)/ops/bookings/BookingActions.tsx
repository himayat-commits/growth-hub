'use client';

// Status-transition controls for the bookings table + the member 360.
// PATCHes /api/ops/bookings/[id] then refreshes the page.
//
// The buttons mirror BOOKING_TRANSITIONS in src/lib/db/bookings.ts — the
// server enforces the same map, so a stale tab gets a 409 rather than a
// silent bad write. "Complete" opens outcome / next-step fields first; prep
// notes (ops-only) can be saved at any time without changing status.

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';

type Status = 'requested' | 'scheduled' | 'in_progress' | 'completed' | 'cancelled';

const NEXT_STATES: Record<Status, Status[]> = {
  requested: ['scheduled', 'cancelled'],
  scheduled: ['completed', 'cancelled'],
  in_progress: ['completed', 'cancelled'],
  completed: [],
  cancelled: ['requested'],
};

const LABELS: Record<Status, string> = {
  requested: 'Re-open',
  scheduled: 'Mark scheduled',
  in_progress: 'In progress',
  completed: 'Complete…',
  cancelled: 'Cancel',
};

interface Patch {
  status?: Status;
  preSessionNotes?: string;
  outcome?: string;
  nextStep?: string;
}

export default function BookingActions({
  id,
  currentStatus,
  preSessionNotes,
  outcome,
  nextStep,
}: {
  id: number;
  currentStatus: Status;
  preSessionNotes?: string | null;
  outcome?: string | null;
  nextStep?: string | null;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [completing, setCompleting] = useState(false);
  const [prep, setPrep] = useState(preSessionNotes ?? '');
  const [outcomeDraft, setOutcomeDraft] = useState(outcome ?? '');
  const [nextStepDraft, setNextStepDraft] = useState(nextStep ?? '');
  const nextStates = NEXT_STATES[currentStatus] ?? [];

  const patch = async (body: Patch) => {
    setErr(null);
    setBusy(true);
    try {
      const res = await fetch(`/api/ops/bookings/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(data.error ?? 'Update failed');
      }
      setCompleting(false);
      startTransition(() => router.refresh());
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Update failed');
    } finally {
      setBusy(false);
    }
  };

  const disabled = pending || busy;

  return (
    <div className="gh-ops-detail">
      {nextStates.length > 0 && !completing && (
        <div className="gh-ops-actions">
          {nextStates.map((s) => (
            <button
              key={s}
              type="button"
              className="gh-ops-actionbtn"
              disabled={disabled}
              onClick={() => (s === 'completed' ? setCompleting(true) : patch({ status: s }))}
            >
              {disabled ? '…' : `→ ${LABELS[s]}`}
            </button>
          ))}
        </div>
      )}

      {completing && (
        <div className="gh-ops-detail">
          <textarea
            placeholder="Outcome — what was covered / decided (member does not see this yet, but it goes to HubSpot)"
            value={outcomeDraft}
            onChange={(e) => setOutcomeDraft(e.target.value)}
            maxLength={4000}
          />
          <textarea
            placeholder="Next step — e.g. 'Send website audit by Fri', 'Book paid Marketing Sprint'"
            value={nextStepDraft}
            onChange={(e) => setNextStepDraft(e.target.value)}
            maxLength={2000}
            style={{ minHeight: 48 }}
          />
          <div className="gh-ops-actions">
            <button
              type="button"
              className="gh-ops-actionbtn"
              disabled={disabled || !outcomeDraft.trim()}
              onClick={() =>
                patch({ status: 'completed', outcome: outcomeDraft.trim(), nextStep: nextStepDraft.trim() })
              }
            >
              {disabled ? '…' : '✓ Mark completed'}
            </button>
            <button
              type="button"
              className="gh-ops-actionbtn"
              disabled={disabled}
              onClick={() => setCompleting(false)}
            >
              Back
            </button>
          </div>
        </div>
      )}

      {currentStatus !== 'completed' && currentStatus !== 'cancelled' && (
        <details>
          <summary>{prep ? 'Prep notes (saved)' : 'Add prep notes'}</summary>
          <div className="gh-ops-detail">
            <textarea
              placeholder="Ops-only prep notes — never shown to the member"
              value={prep}
              onChange={(e) => setPrep(e.target.value)}
              maxLength={4000}
            />
            <button
              type="button"
              className="gh-ops-actionbtn"
              disabled={disabled || prep === (preSessionNotes ?? '')}
              onClick={() => patch({ preSessionNotes: prep })}
              style={{ alignSelf: 'flex-start' }}
            >
              Save notes
            </button>
          </div>
        </details>
      )}

      {currentStatus === 'completed' && (outcome || nextStep) && (
        <div className="gh-ops-meta" style={{ whiteSpace: 'pre-wrap' }}>
          {outcome && <div><strong>Outcome:</strong> {outcome}</div>}
          {nextStep && <div><strong>Next step:</strong> {nextStep}</div>}
        </div>
      )}

      {err && <span className="gh-ops-err">{err}</span>}
    </div>
  );
}
