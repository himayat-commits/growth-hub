// "Is this user provisioned?" — the one place that knows a mock run is not a
// real account.
//
// A `mock` run writes runStatus:"provisioned" with a synthetic businessNumber
// and no Birdeye account exists. While the deployment stays on mock that is
// the terminal state and every short-circuit should honour it (don't re-run,
// don't re-create the fake). The moment the caller's EFFECTIVE mode is `live`
// the same row means "nothing real exists yet" and must NOT short-circuit —
// otherwise paying customers who signed up during the mock period are stuck
// with a fake account forever (GTM review T0-4).
//
// Pure helpers (no "server-only") so server components, route handlers and
// client components can all share the same definition.

import type { ClientMode } from "@/lib/birdeye/client";
import type { Provisioning } from "@/lib/wizard/state";

type HasProvisioning = { provisioning?: Provisioning | null } | null | undefined;

const block = (state: HasProvisioning): Provisioning | null =>
  state?.provisioning ?? null;

/** True when the most recent run executed against the real API. Rows written
 *  before `mode` was persisted count as mock — production only ever ran mock. */
export function isLiveRun(prov: Provisioning | null | undefined): boolean {
  return prov?.mode === "live";
}

/** A run that landed a (fake) account under mock: `provisioned` or `partial`
 *  with a businessNumber but no live mode. Drives the customer-facing
 *  "your setup is with our team" rendering. */
export function isMockProvisioned(prov: Provisioning | null | undefined): boolean {
  if (!prov?.businessNumber) return false;
  if (prov.runStatus !== "provisioned" && prov.runStatus !== "partial") return false;
  return !isLiveRun(prov);
}

/** The short-circuit predicate for /api/provision, the ops/cron re-run and
 *  the runner's resume decision. `effectiveMode` is what THIS caller would
 *  run under (resolveEffectiveMode(getProvisionMode(), allowlisted)). */
export function isProvisionedFor(state: HasProvisioning, effectiveMode: ClientMode): boolean {
  const prov = block(state);
  if (!prov?.businessNumber) return false;
  if (prov.runStatus !== "provisioned") return false;
  return effectiveMode !== "live" || isLiveRun(prov);
}

/** True when the stored identifiers are synthetic (mock run) but the caller
 *  is about to run live: the runner must discard them and create for real. */
export function needsLiveReset(state: HasProvisioning, effectiveMode: ClientMode): boolean {
  const prov = block(state);
  return effectiveMode === "live" && Boolean(prov?.businessNumber) && !isLiveRun(prov);
}
