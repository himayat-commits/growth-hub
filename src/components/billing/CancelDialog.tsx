'use client';

// Cancel-with-survey dialog. Shows the retention prompt + reason
// radio buttons, posts to /api/cancel-subscription, and confirms with
// the period-end date the user keeps access through.
//
// Sets cancel_at_period_end=true rather than canceling immediately —
// users keep their plan until the end of the billing period.

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';

const REASONS: Array<{ value: string; label: string }> = [
  { value: 'too-expensive', label: "It's too expensive right now" },
  { value: 'not-using', label: "I'm not using it enough" },
  { value: 'missing-feature', label: 'Missing a feature I need' },
  { value: 'switching-provider', label: 'Switching to another provider' },
  { value: 'business-closing', label: 'My business is closing or pausing' },
  { value: 'temporary-break', label: 'Taking a temporary break' },
  { value: 'other', label: 'Other' },
];

export interface CancelDialogProps {
  currentPlanName: string;
  periodEnd?: string | null;
  className?: string;
}

export default function CancelDialog({
  currentPlanName,
  periodEnd,
  className,
}: CancelDialogProps) {
  const dialogRef = useRef<HTMLDialogElement | null>(null);
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState<string>('');
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [doneAt, setDoneAt] = useState<number | null>(null);

  const openDialog = () => {
    setReason('');
    setComment('');
    setError(null);
    setDoneAt(null);
    setOpen(true);
    dialogRef.current?.showModal();
  };
  const closeDialog = () => {
    dialogRef.current?.close();
    setOpen(false);
  };

  const submit = async () => {
    if (!reason) {
      setError('Please pick a reason so we can keep improving.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/cancel-subscription', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason, comment }),
      });
      const data = (await res.json()) as { ok?: boolean; cancelAt?: number | null; error?: string };
      if (!res.ok) throw new Error(data.error ?? 'Could not cancel');
      setDoneAt(data.cancelAt ?? null);
      // Refresh after a beat so the /plan page picks up the new state.
      setTimeout(() => {
        closeDialog();
        router.refresh();
      }, 2200);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not cancel');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const dlg = dialogRef.current;
    if (!dlg) return;
    const onCancel = () => setOpen(false);
    dlg.addEventListener('cancel', onCancel);
    return () => dlg.removeEventListener('cancel', onCancel);
  }, []);

  return (
    <>
      <button
        type="button"
        className={className ?? 'gh-btn ghost'}
        onClick={openDialog}
        disabled={open}
      >
        Cancel subscription
      </button>

      <dialog
        ref={dialogRef}
        className="gh-billing-dialog"
        onClick={(e) => {
          if (e.target === dialogRef.current) closeDialog();
        }}
      >
        <div className="gh-billing-dialog-inner" onClick={(e) => e.stopPropagation()}>
          {!doneAt ? (
            <>
              <h3 className="gh-billing-dialog-h">Sorry to see you go.</h3>
              <p className="gh-billing-dialog-sub">
                Before you cancel <strong>{currentPlanName}</strong> — would you tell us why?
                Honest answers shape what we build next. You can also message us directly via
                /messages if there&apos;s anything we can fix.
              </p>

              {error && <p className="gh-billing-dialog-err">{error}</p>}

              <fieldset className="gh-cancel-reasons">
                <legend className="sr-only">Reason for cancelling</legend>
                {REASONS.map((r) => (
                  <label key={r.value} className={'gh-cancel-reason' + (reason === r.value ? ' is-on' : '')}>
                    <input
                      type="radio"
                      name="reason"
                      value={r.value}
                      checked={reason === r.value}
                      onChange={(e) => setReason(e.target.value)}
                      disabled={loading}
                    />
                    <span>{r.label}</span>
                  </label>
                ))}
              </fieldset>

              <label className="gh-cancel-comment">
                <span>Anything else? (optional)</span>
                <textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value.slice(0, 500))}
                  placeholder="Specific feature, integration, pricing… anything that would have changed your mind."
                  rows={3}
                  disabled={loading}
                />
              </label>

              <p className="gh-billing-dialog-fine">
                You&apos;ll keep access until {periodEnd ?? 'the end of your current period'}.
                You can re-subscribe any time before then to undo this.
              </p>

              <div className="gh-billing-dialog-actions">
                <button
                  type="button"
                  className="gh-btn"
                  onClick={closeDialog}
                  disabled={loading}
                >
                  Keep my plan
                </button>
                <button
                  type="button"
                  className="gh-btn ghost"
                  onClick={submit}
                  disabled={loading}
                >
                  {loading ? 'Cancelling…' : 'Cancel anyway'}
                </button>
              </div>
            </>
          ) : (
            <>
              <h3 className="gh-billing-dialog-h">Cancellation scheduled</h3>
              <p className="gh-billing-dialog-sub">
                Your <strong>{currentPlanName}</strong> plan will end on{' '}
                <strong>
                  {doneAt
                    ? new Intl.DateTimeFormat('en-AU', { dateStyle: 'long' }).format(new Date(doneAt))
                    : 'the end of your current period'}
                </strong>
                . You keep full access until then.
              </p>
              <p className="gh-billing-dialog-fine">
                Changed your mind? Open your plan settings again and choose your tier — we&apos;ll
                undo the cancellation immediately.
              </p>
            </>
          )}
        </div>
      </dialog>
    </>
  );
}
