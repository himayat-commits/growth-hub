// POST /api/ops/provisioning/[userId]/resend-handoff — re-send the ops
// handoff (checklist upsert + webhook/email) for a user whose original
// notify_ops failed. Severity mirrors the run outcome: outstanding failed
// steps escalate to action_required.

import { NextRequest, NextResponse } from 'next/server';
import * as Sentry from '@sentry/nextjs';
import { getOpsUser } from '@/lib/auth/ops';
import { loadOnboardingRow } from '@/lib/wizard/provisioning-store';
import { sendOpsHandoff } from '@/lib/ops/notify';

export const runtime = 'nodejs';

type Params = Promise<{ userId: string }>;

export async function POST(_req: NextRequest, { params }: { params: Params }) {
  const opsUser = await getOpsUser();
  if (!opsUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { userId } = await params;
  if (!userId) return NextResponse.json({ error: 'Invalid userId' }, { status: 400 });

  try {
    const row = await loadOnboardingRow(userId);
    if (!row) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    const severity = row.state.provisioning.failedSteps?.length ? 'action_required' : 'info';
    const result = await sendOpsHandoff({ state: row.state, severity });
    if (!result.ok) {
      return NextResponse.json(
        { ok: false, error: result.error ?? 'Handoff failed' },
        { status: 500 },
      );
    }
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[ops.provisioning] resend-handoff failed', err);
    Sentry.captureException(err, {
      tags: { area: 'ops.provisioning', actor: opsUser.email },
      extra: { userId },
    });
    return NextResponse.json({ error: 'Resend failed' }, { status: 500 });
  }
}
