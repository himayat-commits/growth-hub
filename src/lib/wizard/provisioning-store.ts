// Server-authoritative persistence for the `provisioning` block of a
// wizard run. The orchestrator writes here the instant a sub-account is
// created (so a mid-run crash never orphans a real, billable account with
// its businessNumber lost), and on every subsequent step so a retry can
// resume instead of re-creating.
//
// `userId` is the WorkOS user id == onboarding_states.userId (PK) ==
// WizardState.onboardingId. One onboarding per user.

import "server-only";
import { eq, sql } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { onboardingStates } from "@/lib/db/schema";
import { parseWizardState } from "@/lib/wizard/parse-state";
import type { Provisioning, WizardState } from "@/lib/wizard/state";

/** How long a `runStatus: "running"` row is trusted before we assume the
 *  serverless function died mid-run and allow a resume. Every runner step
 *  bumps the row's updatedAt, so a live run never looks stale. */
export const STALE_RUNNING_MS = 10 * 60_000;

/** Run-lease TTL. Must comfortably exceed a full run (mock ≤ ~10s, live a
 *  few minutes with retries) but stay ≤ the route's maxDuration so a crashed
 *  invocation's lease expires soon after the function itself was killed. */
const LOCK_TTL_MS = 6 * 60_000;

const stateFallback = (userId: string) =>
  ({ onboardingId: userId, packageId: "foundations", email: "" }) as const;

/** Read the authoritative wizard state for a user, or null if none.
 *  Heals drifted JSONB via parseWizardState — the healed shape is written
 *  back on the next updateProvisioning call (deliberate self-repair). */
export async function loadOnboardingState(
  userId: string,
): Promise<WizardState | null> {
  const row = await loadOnboardingRow(userId);
  return row?.state ?? null;
}

/** Like loadOnboardingState but also returns the row's updatedAt — the
 *  staleness signal for crashed-run detection (every runner step bumps it). */
export async function loadOnboardingRow(
  userId: string,
): Promise<{ state: WizardState; updatedAt: Date } | null> {
  const rows = await getDb()
    .select()
    .from(onboardingStates)
    .where(eq(onboardingStates.userId, userId))
    .limit(1);
  if (!rows[0]) return null;
  return {
    state: parseWizardState(rows[0].state, stateFallback(userId)),
    updatedAt: rows[0].updatedAt,
  };
}

/** A `running` row whose updatedAt hasn't moved in STALE_RUNNING_MS is a
 *  crashed run: safe to resume (create is skipped once businessNumber
 *  exists; pre-create crashes are anchored by externalReferenceId). */
export function isStaleRunning(
  state: WizardState,
  rowUpdatedAt: Date,
  thresholdMs = STALE_RUNNING_MS,
): boolean {
  return (
    state.provisioning.runStatus === "running" &&
    rowUpdatedAt.getTime() < Date.now() - thresholdMs
  );
}

/** Acquire the per-user run lease. A single atomic UPDATE (no
 *  read-modify-write) so a user Resume, an ops re-run and the retry cron
 *  are mutually exclusive under Postgres row-level atomicity. Returns true
 *  when the lease was taken. */
export async function acquireProvisionLock(
  userId: string,
  ttlMs = LOCK_TTL_MS,
): Promise<boolean> {
  const rows = await getDb().execute(sql`
    UPDATE onboarding_states
    SET state = jsonb_set(
          state,
          '{provisioning,lockedUntil}',
          to_jsonb((now() + make_interval(secs => ${ttlMs / 1000}))::text)
        ),
        updated_at = now()
    WHERE user_id = ${userId}
      AND (
        state->'provisioning'->>'lockedUntil' IS NULL
        OR (state->'provisioning'->>'lockedUntil')::timestamptz < now()
      )
    RETURNING user_id
  `);
  return rows.rows.length > 0;
}

/** Release the run lease. Callers do this in a `finally` — but a missed
 *  release only costs LOCK_TTL_MS of retry delay, never a stuck user. */
export async function releaseProvisionLock(userId: string): Promise<void> {
  await getDb().execute(sql`
    UPDATE onboarding_states
    SET state = state #- '{provisioning,lockedUntil}'
    WHERE user_id = ${userId}
  `);
}

/** Insert the row if it doesn't exist yet, without clobbering an existing
 *  (auto-saved) one. The wizard normally creates the row via auto-save, but
 *  E2E/edge paths may POST to provision before any save landed. */
export async function ensureOnboardingState(
  userId: string,
  state: WizardState,
): Promise<void> {
  await getDb()
    .insert(onboardingStates)
    .values({ userId, state })
    .onConflictDoNothing({ target: onboardingStates.userId });
}

type ProvisioningMutation = {
  provisioning?: Partial<Provisioning>;
  status?: WizardState["status"];
};

/** Read-modify-write merge of the `provisioning` block (and optionally the
 *  top-level lifecycle `status`). The orchestrator runs steps sequentially,
 *  so there's no true concurrency, but each call re-reads fresh state so
 *  arrays like invitedUsers/mediaIds are never clobbered by a stale copy.
 *
 *  `mutate` receives the current provisioning + full state and returns the
 *  fields to merge — letting callers append to failedSteps etc. */
export async function updateProvisioning(
  userId: string,
  mutate: (prev: Provisioning, state: WizardState) => ProvisioningMutation,
): Promise<void> {
  const current = await loadOnboardingState(userId);
  if (!current) {
    console.error(
      `[provisioning-store] no onboarding_states row for user=${userId} — cannot persist progress`,
    );
    return;
  }
  const patch = mutate(current.provisioning, current);
  const nextState: WizardState = {
    ...current,
    status: patch.status ?? current.status,
    provisioning: { ...current.provisioning, ...patch.provisioning },
    updatedAt: new Date().toISOString(),
  };
  await getDb()
    .update(onboardingStates)
    .set({ state: nextState, updatedAt: sql`now()` })
    .where(eq(onboardingStates.userId, userId));
}
