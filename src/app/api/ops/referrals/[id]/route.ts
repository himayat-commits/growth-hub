// PATCH /api/ops/referrals/[id] — flip a referral's status. Staff-only.
//
// Body: { status: 'pending' | 'qualified' | 'credited' | 'declined' }
//
// Sets qualifiedAt or creditedAt to NOW() when the transition makes
// that meaningful. Manual status changes don't trigger the actual
// Stripe customer-balance credit — that job lives in
// lib/stripe/referral-credit.ts and runs on subscription events.
// Marking 'credited' here just records the bookkeeping; the real
// credit either has already been issued or will be on the next event.

import { NextRequest, NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';
import * as Sentry from '@sentry/nextjs';
import { getOpsUser } from '@/lib/auth/ops';
import { getDb } from '@/lib/db';
import { referrals } from '@/lib/db/schema';

export const runtime = 'nodejs';

const VALID_STATUSES = new Set(['pending', 'qualified', 'credited', 'declined']);

type Params = Promise<{ id: string }>;

export async function PATCH(req: NextRequest, { params }: { params: Params }) {
  const opsUser = await getOpsUser();
  if (!opsUser) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

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

  const now = new Date();
  const patch: Partial<typeof referrals.$inferInsert> = { status };
  if (status === 'qualified') patch.qualifiedAt = now;
  if (status === 'credited') patch.creditedAt = now;

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
