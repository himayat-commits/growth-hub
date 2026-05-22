// PATCH /api/ops/bookings/[id] — update booking status. Staff-only.
//
// Body: { status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled' }
//
// Sets scheduledAt or completedAt to NOW() when the transition makes
// that meaningful, so the dashboard surfaces consistent timestamps
// without requiring ops to type anything.

import { NextRequest, NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';
import * as Sentry from '@sentry/nextjs';
import { getOpsUser } from '@/lib/auth/ops';
import { getDb } from '@/lib/db';
import { serviceBookings } from '@/lib/db/schema';

export const runtime = 'nodejs';

const VALID_STATUSES = new Set([
  'requested',
  'scheduled',
  'in_progress',
  'completed',
  'cancelled',
]);

type Params = Promise<{ id: string }>;

export async function PATCH(req: NextRequest, { params }: { params: Params }) {
  const opsUser = await getOpsUser();
  if (!opsUser) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { id: idParam } = await params;
  const id = Number.parseInt(idParam, 10);
  if (!Number.isFinite(id)) {
    return NextResponse.json({ error: 'Invalid id' }, { status: 400 });
  }

  let body: { status?: string; notes?: string };
  try {
    body = (await req.json()) as { status?: string; notes?: string };
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const status = body.status ?? '';
  if (!VALID_STATUSES.has(status)) {
    return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
  }

  const now = new Date();
  const patch: Partial<typeof serviceBookings.$inferInsert> = {
    status,
    updatedAt: now,
  };
  if (status === 'scheduled') patch.scheduledAt = now;
  if (status === 'completed') patch.completedAt = now;
  if (body.notes !== undefined) patch.notes = body.notes;

  try {
    await getDb().update(serviceBookings).set(patch).where(eq(serviceBookings.id, id));
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[ops.bookings] update failed', err);
    Sentry.captureException(err, {
      tags: { area: 'ops.bookings', actor: opsUser.email },
      extra: { bookingId: id, status },
    });
    return NextResponse.json({ error: 'Update failed' }, { status: 500 });
  }
}
