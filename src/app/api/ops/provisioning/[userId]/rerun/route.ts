// POST /api/ops/provisioning/[userId]/rerun — staff-triggered re-run of a
// user's provisioning sequence. rerunProvisionForUser owns the idempotency,
// staleness and lock gates; this route authenticates, rate limits and maps
// the outcome to HTTP. Live runs can take minutes, hence maxDuration 300.
//
// Body (optional JSON): `{ confirmNoOrphan: true }` — the operator has
// checked Birdeye and confirmed no sub-account exists for this user. Clears
// `provisioning.unresolvedCreate` (recording who/when) so the runner will
// create again. Without it, a run blocked by an unresolved create is refused.

import { NextRequest, NextResponse } from 'next/server';
import * as Sentry from '@sentry/nextjs';
import { z } from 'zod';
import { getOpsUser } from '@/lib/auth/ops';
import { rateLimit, tooManyRequests } from '@/lib/rate-limit';
import { rerunProvisionForUser } from '@/lib/birdeye/rerun';

export const runtime = 'nodejs';
export const maxDuration = 300;

type Params = Promise<{ userId: string }>;

const Body = z.object({ confirmNoOrphan: z.literal(true).optional() });

export async function POST(req: NextRequest, { params }: { params: Params }) {
  const opsUser = await getOpsUser();
  if (!opsUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { userId } = await params;
  if (!userId) return NextResponse.json({ error: 'Invalid userId' }, { status: 400 });

  // Body is optional (the plain re-run button sends none); when present it
  // must parse, so a typo can never be mistaken for an orphan confirmation.
  const raw = await req.text();
  let confirmNoOrphan = false;
  if (raw.trim()) {
    let json: unknown;
    try {
      json = JSON.parse(raw);
    } catch {
      return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
    }
    const parsed = Body.safeParse(json);
    if (!parsed.success) return NextResponse.json({ error: 'Invalid body' }, { status: 400 });
    confirmNoOrphan = parsed.data.confirmNoOrphan === true;
  }

  // Each re-run burns Birdeye API calls and a long function slot — keyed by
  // the acting ops user so one operator can't hammer the reseller API.
  const rl = rateLimit(`ops-rerun:${opsUser.id}`, 5, 10 * 60_000);
  if (!rl.ok) return tooManyRequests(rl.retryAfterSec);

  try {
    const outcome = await rerunProvisionForUser(
      userId,
      'ops',
      confirmNoOrphan ? { clearUnresolvedCreate: { by: opsUser.email } } : {},
    );
    if (!outcome.ok) {
      return NextResponse.json({ ok: false, reason: outcome.reason }, { status: 409 });
    }
    return NextResponse.json({
      ok: true,
      status: outcome.result.status,
      businessNumber: outcome.result.businessNumber,
      error: outcome.result.error,
    });
  } catch (err) {
    console.error('[ops.provisioning] rerun failed', err);
    Sentry.captureException(err, {
      tags: { area: 'ops.provisioning', actor: opsUser.email },
      extra: { userId, confirmNoOrphan },
    });
    return NextResponse.json({ error: 'Re-run failed' }, { status: 500 });
  }
}
