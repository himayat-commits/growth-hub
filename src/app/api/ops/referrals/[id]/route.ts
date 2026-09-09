// PATCH /api/ops/referrals/[id] — move a referral through its lifecycle.
// Admin-only (moves money).
//
// Body: { status: 'pending' | 'qualified' | 'credited' | 'declined' }
//
//   → qualified  manual override of the normal trigger (ops marking the
//                referred member's Growth Call completed). Records
//                qualifiedAt.
//   → credited   NOT bookkeeping: runs the real issuance path
//                (issueReferralCreditNow → Stripe balance credit or held
//                pending credit per side) and only ends up 'credited' if
//                both sides settled. Stripe failure → 502, row unchanged.
//   → declined / → pending   plain status writes.
//
// Transitions OUT of 'credited' are rejected: money has moved, and moving
// the row back to 'qualified' would re-arm issuance once Stripe's 24 h
// idempotency window lapses (F2.6).

import { NextRequest, NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';
import * as Sentry from '@sentry/nextjs';
import { getOpsUser } from '@/lib/auth/ops';
import { getDb } from '@/lib/db';
import { referrals } from '@/lib/db/schema';
import { getReferralById } from '@/lib/db/referrals';
import { issueReferralCreditNow } from '@/lib/stripe/referral-credit';

export const runtime = 'nodejs';

const VALID_STATUSES = new Set(['pending', 'qualified', 'credited', 'declined']);

type Params = Promise<{ id: string }>;

export async function PATCH(req: NextRequest, { params }: { params: Params }) {
  const opsUser = await getOpsUser();
  if (!opsUser) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  // Referral credit/status changes move money — admin only.
  if (opsUser.role !== 'admin') {
    return NextResponse.json({ error: 'Admins only' }, { status: 403 });
  }

  const { id: idParam } = await params;
  const id = Number.parseInt(idParam, 10);
  if (!Number.isFinite(id)) {
    return NextResponse.json({ error: 'Invalid id' }, { status: 400 });
  }

  let body: { status?: string };
  try {
    body = (await req.json()) as { status?: string };
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const status = body.status ?? '';
  if (!VALID_STATUSES.has(status)) {
    return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
  }

  const current = await getReferralById(id);
  if (!current) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  if (current.status === 'credited') {
    return NextResponse.json(
      { error: 'Credited referrals are final — the A$50 has already been issued.' },
      { status: 409 },
    );
  }

  if (status === 'credited') {
    if (current.status !== 'qualified') {
      return NextResponse.json(
        { error: 'Mark the referral qualified before issuing credits.' },
        { status: 409 },
      );
    }
    try {
      const result = await issueReferralCreditNow(id);
      if (!result || result.status !== 'credited') {
        // A side couldn't be settled (e.g. missing profile row) — nothing
        // was persisted as 'credited'. Sentry already has the detail.
        return NextResponse.json(
          { error: 'Credit could not be issued for both sides. Check Sentry (area=referral_credit).' },
          { status: 502 },
        );
      }
      return NextResponse.json({
        ok: true,
        referral: {
          status: result.status,
          referrerCreditState: result.referrerCreditState,
          referredCreditState: result.referredCreditState,
        },
      });
    } catch (err) {
      // issueReferralCreditNow already captured this to Sentry (area=referral_credit).
      console.error('[ops.referrals] credit issuance failed', err);
      return NextResponse.json(
        { error: 'Stripe credit failed — nothing was changed. Try again or check Sentry.' },
        { status: 502 },
      );
    }
  }

  const patch: Partial<typeof referrals.$inferInsert> = { status };
  if (status === 'qualified') patch.qualifiedAt = new Date();

  try {
    await getDb().update(referrals).set(patch).where(eq(referrals.id, id));
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[ops.referrals] update failed', err);
    Sentry.captureException(err, {
      tags: { area: 'ops.referrals', actor: opsUser.email },
      extra: { referralId: id, status },
    });
    return NextResponse.json({ error: 'Update failed' }, { status: 500 });
  }
}
