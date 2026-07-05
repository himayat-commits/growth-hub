// PATCH /api/ops/provisioning/tasks/[id] — toggle a handoff checklist task
// open⇄done. doneBy records the acting ops email. Staff-only via getOpsUser.
//
// Body: { status: 'open' | 'done' }

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import * as Sentry from '@sentry/nextjs';
import { getOpsUser } from '@/lib/auth/ops';
import { setTaskStatus } from '@/lib/db/provisioning-tasks';

export const runtime = 'nodejs';

const Body = z.object({ status: z.enum(['open', 'done']) });

type Params = Promise<{ id: string }>;

export async function PATCH(req: NextRequest, { params }: { params: Params }) {
  const opsUser = await getOpsUser();
  if (!opsUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const taskId = Number(id);
  if (!Number.isInteger(taskId) || taskId <= 0) {
    return NextResponse.json({ error: 'Invalid id' }, { status: 400 });
  }

  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid body' }, { status: 400 });
  }

  try {
    await setTaskStatus(taskId, parsed.data.status, opsUser.email);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[ops.provisioning] task update failed', err);
    Sentry.captureException(err, {
      tags: { area: 'ops.provisioning', actor: opsUser.email },
      extra: { taskId, status: parsed.data.status },
    });
    return NextResponse.json({ error: 'Update failed' }, { status: 500 });
  }
}
