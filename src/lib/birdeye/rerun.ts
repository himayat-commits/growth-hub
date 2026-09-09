// Server-side re-run of provisioning for a user — shared by the ops console
// ("Re-run provisioning" button) and the retry cron. No SSE: the runner
// persists every step and appends provisioning_logs, so nothing is lost
// without a stream.

import "server-only";
import { getSubscription, isActive } from "@/lib/subscription";
import {
  acquireProvisionLock,
  isStaleRunning,
  loadOnboardingRow,
  releaseProvisionLock,
  updateProvisioning,
} from "@/lib/wizard/provisioning-store";
import { resolveEffectiveModeFor } from "@/lib/birdeye/allowlist";
import { isProvisionedFor } from "@/lib/birdeye/provisioned";
import { runProvision, type ProvisionResult } from "@/lib/birdeye/provision-runner";
import type { WizardState } from "@/lib/wizard/state";

const RESELLER_ID = process.env.BIRDEYE_RESELLER_ID ?? "demo-reseller";
const API_HOST = process.env.BIRDEYE_API_HOST ?? "https://api.birdeye.com/resources";

export type RerunOutcome =
  | { ok: true; result: ProvisionResult }
  | {
      ok: false;
      reason:
        | "no_state"
        | "already_provisioned"
        | "in_progress"
        | "locked"
        | "inactive_subscription";
    };

export type RerunOptions = {
  /** Ops has confirmed in Birdeye that NO account exists for this user:
   *  clear `provisioning.unresolvedCreate` (recording who/when) before the
   *  run so the runner will create again. Never set by the cron. */
  clearUnresolvedCreate?: { by: string };
};

/** The two idempotency short-circuits, shared by the pre-lock fast path and
 *  the post-lock re-check. `mode` is the effective mode for the TARGET user. */
function shortCircuit(
  state: WizardState,
  updatedAt: Date,
  mode: "mock" | "live",
): Extract<RerunOutcome, { ok: false }> | null {
  if (isProvisionedFor(state, mode)) return { ok: false, reason: "already_provisioned" };
  if (state.provisioning.runStatus === "running" && !isStaleRunning(state, updatedAt)) {
    return { ok: false, reason: "in_progress" };
  }
  return null;
}

export async function rerunProvisionForUser(
  userId: string,
  runBy: "ops" | "cron",
  opts: RerunOptions = {},
): Promise<RerunOutcome> {
  const row = await loadOnboardingRow(userId);
  if (!row) return { ok: false, reason: "no_state" };

  // Mode parity with the original user-initiated run: resolve against the
  // TARGET account's email, never the operator's — otherwise a live
  // customer's re-run silently goes mock under live_allowlist (or a mock
  // test account gets re-run live).
  const mode = resolveEffectiveModeFor(row.state.adminUser.email);

  const early = shortCircuit(row.state, row.updatedAt, mode);
  if (early) return early;

  // Same paid-only gate the user route enforces. Matters most for a `failed`
  // run (no sub-account yet) after a cancellation — automation must never
  // CREATE a billable seat for an inactive customer. Ops can judge edge
  // cases, but through a resubscribe, not a silent override.
  const sub = await getSubscription(userId);
  if (!isActive(sub)) {
    return { ok: false, reason: "inactive_subscription" };
  }
  if (!(await acquireProvisionLock(userId))) {
    return { ok: false, reason: "locked" };
  }

  try {
    if (opts.clearUnresolvedCreate) {
      const by = opts.clearUnresolvedCreate.by;
      await updateProvisioning(userId, () => ({
        provisioning: {
          unresolvedCreate: undefined,
          unresolvedCleared: { by, at: new Date().toISOString() },
        },
      }));
    }

    // Re-read AFTER the lease is ours: another invocation may have finished
    // (and persisted a businessNumber) between our first read and the lock.
    // Running on the pre-lock snapshot is exactly how a second create happens.
    const fresh = await loadOnboardingRow(userId);
    if (!fresh) return { ok: false, reason: "no_state" };
    const late = shortCircuit(fresh.state, fresh.updatedAt, mode);
    if (late) return late;

    const result = await runProvision({
      userId,
      state: fresh.state,
      mode,
      resellerId: RESELLER_ID,
      apiHost: API_HOST,
      runBy,
      send: () => {},
    });
    return { ok: true, result };
  } finally {
    await releaseProvisionLock(userId).catch(() => {});
  }
}
