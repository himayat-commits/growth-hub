'use client';

// In-app plan change dialog. Shows the exact prorated amount (fetched
// from Stripe via /api/change-plan?action=preview) before the user
// commits. Refreshes the page on success so the new plan + period
// end render correctly.

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import type { BillingInterval, PaidPlanTier } from '@/lib/plans';

interface PreviewResponse {
  isUpgrade: boolean;
  amountDue: number; // cents
  currency: string;
  periodStart: number; // unix seconds
  periodEnd: number;
  newMonthlyAmount: number; // cents
}

export interface ChangePlanDialogProps {
  /** The currently-effective plan name (for the "from" copy). */
  currentPlanName: string;
  /** Target tier */
  targetTier: PaidPlanTier;
  targetPlanName: string;
  interval?: BillingInterval;
  /** Button label and styling overrides */
  label: string;
  className?: string;
}

function formatMoney(amountCents: number, currency: string) {
  const sign = amountCents < 0 ? '-' : '';
  const abs = Math.abs(amountCents) / 100;
  return `${sign}${currency.toUpperCase()} $${abs.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

export default function ChangePlanDialog({
  currentPlanName,
  targetTier,
  targetPlanName,
  interval = 'month',
  label,
  className,
}: ChangePlanDialogProps) {
  const dialogRef = useRef<HTMLDialogElement | null>(null);
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [preview, setPreview] = useState<PreviewResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  // Open/close the native <dialog> imperatively. Tracks open state to
  // disable the trigger while the modal is up.
  const openDialog = async () => {
    setError(null);
    setPreview(null);
    setDone(false);
    setOpen(true);
    dialogRef.current?.showModal();
    // Kick off the preview fetch immediately so the dialog isn't empty
    // while the user reads.
    setLoading(true);
    try {
      const res = await fetch('/api/change-plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tier: targetTier, interval, action: 'preview' }),
      });
      const data = (await res.json()) as PreviewResponse & { error?: string };
      if (!res.ok) throw new Error(data.error ?? 'Could not load preview');
      setPreview(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not load preview');
    } finally {
      setLoading(false);
    }
  };

  const closeDialog = () => {
    dialogRef.current?.close();
    setOpen(false);
  };

  const confirm = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/change-plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tier: targetTier, interval, action: 'commit' }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) throw new Error(data.error ?? 'Could not change plan');
      setDone(true);
      // Webhook is asynchronous — give it 1.5s before refreshing so the
      // /plan page reads the new state.
      setTimeout(() => {
        closeDialog();
        router.refresh();
      }, 1500);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not change plan');
    } finally {
      setLoading(false);
    }
  };

  // Close on Escape or backdrop click (the latter via the native dialog
  // 'cancel' event fired by Esc; the backdrop click we handle below).
  useEffect(() => {
    const dlg = dialogRef.current;
    if (!dlg) return;
    const onCancel = () => setOpen(false);
    dlg.addEventListener('cancel', onCancel);
    return () => dlg.removeEventListener('cancel', onCancel);
  }, []);

  return (
    <>
      <button type="button" className={className} onClick={openDialog} disabled={open}>
        {label}
      </button>

      {/* Native <dialog> for the modal. Styled via .gh-billing-dialog. */}
      <dialog
        ref={dialogRef}
        className="gh-billing-dialog"
        onClick={(e) => {
          // Backdrop click — close. Inner content stops propagation.
          if (e.target === dialogRef.current) closeDialog();
        }}
      >
        <div className="gh-billing-dialog-inner" onClick={(e) => e.stopPropagation()}>
          <h3 className="gh-billing-dialog-h">
            {done ? 'Plan updated' : `Switch to ${targetPlanName}`}
          </h3>
          {!done && (
            <p className="gh-billing-dialog-sub">
              You&apos;re currently on <strong>{currentPlanName}</strong>. The change applies
              immediately — your modules and features update with it.
            </p>
          )}

          {error && <p className="gh-billing-dialog-err">{error}</p>}

          {!done && loading && !preview && (
            <p className="gh-billing-dialog-loading">Loading preview…</p>
          )}

          {!done && preview && (
            <div className="gh-billing-dialog-summary">
              <div className="row">
                <span>{preview.isUpgrade ? 'Charged today' : 'Credit to next invoice'}</span>
                <strong>{formatMoney(Math.abs(preview.amountDue), preview.currency)}</strong>
              </div>
              <div className="row">
                <span>New {interval === 'year' ? 'annual' : 'monthly'} rate</span>
                <strong>{formatMoney(preview.newMonthlyAmount, preview.currency)}</strong>
              </div>
              <p className="gh-billing-dialog-fine">
                {preview.isUpgrade
                  ? "You'll be charged the prorated difference today, then the new rate on each renewal."
                  : 'Your card is not charged today. The credit applies to your next invoice automatically.'}
              </p>
            </div>
          )}

          {done && (
            <p className="gh-billing-dialog-done">
              You&apos;re on <strong>{targetPlanName}</strong>. Refreshing your dashboard…
            </p>
          )}

          {!done && (
            <div className="gh-billing-dialog-actions">
              <button
                type="button"
                className="gh-btn ghost"
                onClick={closeDialog}
                disabled={loading}
              >
                Cancel
              </button>
              <button
                type="button"
                className="gh-btn"
                onClick={confirm}
                disabled={loading || !preview}
              >
                {loading ? 'Working…' : `Confirm switch to ${targetPlanName}`}
              </button>
            </div>
          )}
        </div>
      </dialog>
    </>
  );
}
