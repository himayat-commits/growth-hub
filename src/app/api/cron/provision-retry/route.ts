// Hourly auto-retry for stuck provisioning runs (Vercel cron — see
// vercel.json). Candidates: runs that ended `partial`, or crashed mid-run
// (`running` with a stale row), untouched for >1 hour, with fewer than 3
// attempts. The attempts ceiling only caps AUTOMATION — a user's Resume
// button stays uncapped. rerunProvisionForUser holds the same lock as user
// and ops runs, so double-execution is impossible; on success the runner's
// existing in-app notification tells the user.

import * as Sentry from "@sentry/nextjs";
import { sql } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { rerunProvisionForUser } from "@/lib/birdeye/rerun";

export const runtime = "nodejs";
export const maxDuration = 300;
export const dynamic = "force-dynamic";

const BATCH_LIMIT = 5;

export async function GET(req: Request) {
  // Vercel attaches `Authorization: Bearer ${CRON_SECRET}` automatically
  // when the env var is set. No secret configured = reject everything.
  const secret = process.env.CRON_SECRET;
  if (!secret || req.headers.get("authorization") !== `Bearer ${secret}`) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const candidates = await getDb().execute<{ userId: string }>(sql`
    SELECT user_id AS "userId"
    FROM onboarding_states
    WHERE updated_at < now() - interval '1 hour'
      AND state->'provisioning'->>'runStatus' IN ('partial', 'running')
      AND coalesce((state->'provisioning'->>'attempts')::int, 0) < 3
      AND (
        state->'provisioning'->>'lockedUntil' IS NULL
        OR (state->'provisioning'->>'lockedUntil')::timestamptz < now()
      )
    ORDER BY updated_at ASC
    LIMIT ${BATCH_LIMIT}
  `);

  // Serial on purpose (each live run is many Birdeye calls), with a time
  // budget well inside maxDuration so we never get killed mid-run — leftover
  // candidates simply wait for the next hourly tick.
  const TIME_BUDGET_MS = 180_000;
  const startedAt = Date.now();
  const results: Array<{ userId: string; outcome: string }> = [];
  for (const { userId } of candidates.rows) {
    if (Date.now() - startedAt > TIME_BUDGET_MS) {
      results.push({ userId, outcome: "deferred_time_budget" });
      continue;
    }
    try {
      const outcome = await rerunProvisionForUser(userId, "cron");
      results.push({
        userId,
        outcome: outcome.ok ? outcome.result.status : outcome.reason,
      });
    } catch (e) {
      Sentry.captureException(e, {
        tags: { area: "provision", step: "cron_retry" },
        extra: { userId },
      });
      results.push({ userId, outcome: "error" });
    }
  }

  return Response.json({ ok: true, attempted: results.length, results });
}
