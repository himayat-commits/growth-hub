// Server-side re-run of provisioning for a user — shared by the ops console
// ("Re-run provisioning" button) and the retry cron. No SSE: the runner
// persists every step and appends provisioning_logs, so nothing is lost
// without a stream.

import "server-only";
import { isOpsEmail } from "@/lib/auth/ops";
import {
  acquireProvisionLock,
  isStaleRunning,
  loadOnboardingRow,
  releaseProvisionLock,
} from "@/lib/wizard/provisioning-store";
import { getProvisionMode, resolveEffectiveMode } from "@/lib/birdeye/client";
import { runProvision, type ProvisionResult } from "@/lib/birdeye/provision-runner";

const RESELLER_ID = process.env.BIRDEYE_RESELLER_ID ?? "demo-reseller";
const API_HOST = process.env.BIRDEYE_API_HOST ?? "https://api.birdeye.com/resources";

export type RerunOutcome =
  | { ok: true; result: ProvisionResult }
  | {
      ok: false;
      reason: "no_state" | "already_provisioned" | "in_progress" | "locked";
    };

export async function rerunProvisionForUser(
  userId: string,
  runBy: "ops" | "cron",
): Promise<RerunOutcome> {
  const row = await loadOnboardingRow(userId);
  if (!row) return { ok: false, reason: "no_state" };
  const { state } = row;

  if (
    state.provisioning.businessNumber &&
    state.provisioning.runStatus === "provisioned"
  ) {
    return { ok: false, reason: "already_provisioned" };
  }
  if (state.provisioning.runStatus === "running" && !isStaleRunning(state, row.updatedAt)) {
    return { ok: false, reason: "in_progress" };
  }
  if (!(await acquireProvisionLock(userId))) {
    return { ok: false, reason: "locked" };
  }

  try {
    // Mode parity with the original user-initiated run: resolve against the
    // TARGET account's email, never the operator's — otherwise a live
    // customer's re-run silently goes mock under live_allowlist (or a mock
    // test account gets re-run live).
    const mode = resolveEffectiveMode(
      getProvisionMode(),
      isOpsEmail(state.adminUser.email),
    );
    const result = await runProvision({
      userId,
      state,
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
