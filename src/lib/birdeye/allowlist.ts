// Who goes live under PROVISION_MODE=live_allowlist.
//
// Historically this reused OPS_EMAILS, which meant the runbook's "pilot"
// step — add a few friendly paying customers to the allowlist — granted
// those customers the /ops staff console as admin (GTM review T0-2). The
// live allowlist is now its own env var, PROVISION_ALLOWLIST (comma-
// separated emails, case-insensitive). When it is unset we fall back to
// OPS_EMAILS so an existing deployment behaves exactly as before; the
// config-health check warns about that fallback under live_allowlist.

import "server-only";
import { isOpsEmail } from "@/lib/auth/ops";
import { getProvisionMode, resolveEffectiveMode, type ClientMode } from "@/lib/birdeye/client";

function parseProvisionAllowlist(): Set<string> | null {
  const raw = process.env.PROVISION_ALLOWLIST;
  if (!raw || !raw.trim()) return null;
  const set = new Set<string>();
  for (const entry of raw.split(",")) {
    const email = entry.trim().toLowerCase();
    if (email) set.add(email);
  }
  return set;
}

/** True when PROVISION_ALLOWLIST is set (non-empty). */
export function hasProvisionAllowlist(): boolean {
  return parseProvisionAllowlist() !== null;
}

/** Is this email allowed to hit the real Birdeye API under live_allowlist?
 *  PROVISION_ALLOWLIST when set; otherwise OPS_EMAILS for back-compat. */
export function isProvisionAllowlisted(email: string | null | undefined): boolean {
  if (!email) return false;
  const list = parseProvisionAllowlist();
  if (list) return list.has(email.toLowerCase());
  return isOpsEmail(email);
}

/** The effective client mode for a run on behalf of `email`: the deployment
 *  switch crossed with the provisioning allowlist. Every run path (user
 *  route, ops re-run, cron) must resolve against the TARGET account's email. */
export function resolveEffectiveModeFor(email: string | null | undefined): ClientMode {
  return resolveEffectiveMode(getProvisionMode(), isProvisionAllowlisted(email));
}
