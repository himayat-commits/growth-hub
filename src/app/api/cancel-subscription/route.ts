// POST /api/cancel-subscription
//
// Body: { reason: string, comment?: string }
//
// Sets cancel_at_period_end=true on the user's Stripe subscription so
// they keep access until the end of the current period. Records the
// reason + optional comment in the Stripe subscription metadata so ops
// can pull cancellation trends without a separate DB table.
//
// Webhook will sync cancelAtPeriodEnd → DB on the next event.
//
// Idempotent: re-running with an already-cancelling subscription just
// updates the reason metadata (lets users change their cancel reason).

import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@workos-inc/authkit-nextjs';
import * as Sentry from '@sentry/nextjs';
import { getStripe } from '@/lib/stripe';
import { getSubscription } from '@/lib/subscription';

export const runtime = 'nodejs';

const VALID_REASONS = new Set([
  'too-expensive',
  'not-using',
  'missing-feature',
  'switching-provider',
  'business-closing',
  'temporary-break',
  'other',
]);

interface CancelRequest {
  reason: string;
  comment?: string;
}

export async function POST(req: NextRequest) {
  const { user } = await withAuth();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  let body: CancelRequest;
  try {
    body = (await req.json()) as CancelRequest;
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const reason = String(body.reason ?? '').trim();
  if (!VALID_REASONS.has(reason)) {
    return NextResponse.json(
      { error: 'A valid reason is required.' },
      { status: 400 },
    );
  }
  const comment = String(body.comment ?? '').slice(0, 500);

  const sub = await getSubscription(user.id);
  if (!sub?.stripeSubscriptionId) {
    return NextResponse.json(
      { error: 'No active subscription to cancel.' },
      { status: 400 },
    );
  }

  const stripe = getStripe();

  try {
    const stripeSub = await stripe.subscriptions.retrieve(sub.stripeSubscriptionId);
    const updated = await stripe.subscriptions.update(sub.stripeSubscriptionId, {
      cancel_at_period_end: true,
      metadata: {
        ...(stripeSub.metadata ?? {}),
        cancellationReason: reason,
        cancellationComment: comment,
        cancellationRequestedAt: new Date().toISOString(),
      },
    });

    // Stripe types this as number | null at the top level. Cast just to
    // narrow the response shape sent to the client.
    const cancelAt = (updated as unknown as { current_period_end?: number | null })
      .current_period_end;

    return NextResponse.json({
      ok: true,
      cancelAt: cancelAt ? cancelAt * 1000 : null, // ms epoch for the client
    });
  } catch (err) {
    console.error('[cancel-subscription] failed', err);
    Sentry.captureException(err, { tags: { area: 'cancel-subscription' } });
    return NextResponse.json(
      { error: 'Could not cancel right now. Try again or contact support.' },
      { status: 500 },
    );
  }
}
