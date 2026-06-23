// PATCH /api/ops/signups/[id] — change a member's assigned strategist.
// id = WorkOS user id (text). Staff-only via getOpsUser.
//
// Body: { assignedStrategistId: string | null }
// We accept any slug string (or null to unassign) — slug existence is
// validated at write time against the cached active-strategist list so
// the dropdown can't accidentally write a stale value.

import { NextRequest, NextResponse } from 'next/server';
import { eq, sql } from 'drizzle-orm';
import * as Sentry from '@sentry/nextjs';
import { getOpsUser } from '@/lib/auth/ops';
import { getDb } from '@/lib/db';
import { userProfiles } from '@/lib/db/schema';
import { getActiveStrategists } from '@/lib/cms';

export const runtime = 'nodejs';

type Params = Promise<{ id: string }>;

export async function PATCH(req: NextRequest, { params }: { params: Params }) {
  const opsUser = await getOpsUser();
  if (!opsUser) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  // Reassigning a member's strategist is an admin action.
  if (opsUser.role !== 'admin') {
    return NextResponse.json({ error: 'Admins only' }, { status: 403 });
  }

  const { id: userId } = await params;
  if (!userId) return NextResponse.json({ error: 'Invalid id' }, { status: 400 });

  let body: { assignedStrategistId?: string | null };
  try {
    body = (await req.json()) as { assignedStrategistId?: string | null };
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const next = body.assignedStrategistId ?? null;
  if (next !== null) {
    const strategists = await getActiveStrategists();
    const valid = strategists.some(
      (s) => (s as { slug?: string | null }).slug === next,
    );
    if (!valid) {
      return NextResponse.json(
        { error: 'Unknown strategist slug' },
        { status: 400 },
      );
    }
  }

  try {
    const result = await getDb()
      .update(userProfiles)
      .set({ assignedStrategistId: next, updatedAt: sql`now()` })
      .where(eq(userProfiles.userId, userId))
      .returning({ userId: userProfiles.userId });

    if (!result[0]) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[ops.signups] update failed', err);
    Sentry.captureException(err, {
      tags: { area: 'ops.signups', actor: opsUser.email },
      extra: { userId, assignedStrategistId: next },
    });
    return NextResponse.json({ error: 'Update failed' }, { status: 500 });
  }
}
