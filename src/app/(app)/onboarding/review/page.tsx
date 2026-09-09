import { redirect } from "next/navigation";
import { withAuth } from "@/lib/auth/with-auth";
import { isStaleRunning, loadOnboardingRow } from "@/lib/wizard/provisioning-store";
import { resolveEffectiveModeFor } from "@/lib/birdeye/allowlist";
import { isProvisionedFor } from "@/lib/birdeye/provisioned";
import { ReviewClient } from "./ReviewClient";

// Server wrapper: reads the authoritative provisioning block from Neon so
// re-entry (revisit after a run, another device, a crashed tab) renders from
// server truth rather than the localStorage mirror.
export default async function ReviewPage() {
  const { user } = await withAuth();
  if (!user) {
    redirect("/sign-in?redirect_url=" + encodeURIComponent("/onboarding/review"));
  }

  const row = await loadOnboardingRow(user.id);
  // Whether POST /api/provision would short-circuit for THIS user right now.
  // Resolved server-side because the deployment switch and allowlist are
  // server-only env; the client must never guess at it from runStatus alone
  // (a mock-provisioned row is not provisioned for a live caller).
  const serverProvisionedForMode = isProvisionedFor(
    row?.state,
    resolveEffectiveModeFor(user.email),
  );
  return (
    <ReviewClient
      serverProvisioning={row?.state.provisioning ?? null}
      serverProvisionedForMode={serverProvisionedForMode}
      serverStale={row ? isStaleRunning(row.state, row.updatedAt) : false}
    />
  );
}
