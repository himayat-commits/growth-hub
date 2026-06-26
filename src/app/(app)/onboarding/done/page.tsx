import { redirect } from "next/navigation";
import { withAuth } from "@/lib/auth/with-auth";
import { getSubscription } from "@/lib/subscription";
import type { PackageId } from "@/lib/wizard/packages";
import { loadOnboardingState } from "@/lib/wizard/provisioning-store";
import { getBirdeyeDashboardUrl } from "@/lib/birdeye/dashboard-url";
import { DoneView } from "@/components/portal/DoneView";

// Post-provisioning "you're live" view.
//
// This page is reachable for any signed-in user (NOT gated on active
// subscription) — a customer who has been provisioned in Birdeye and then
// cancels their Growth Hub plan should still be able to see their business
// number and invited-user list. Sub gating happens on the wizard layout
// for pre-provision steps, but /done is the post-provision summary and
// historical content.

export default async function DonePage() {
  const { user } = await withAuth();
  if (!user) {
    redirect("/sign-in?redirect_url=" + encodeURIComponent("/onboarding/done"));
  }

  const sub = await getSubscription();
  const packageId = (sub?.planTier as PackageId | null) ?? "foundations";
  // Server-authoritative read — reliable across devices and after a resume,
  // unlike the localStorage fallback inside DoneView.
  const serverState = await loadOnboardingState(user.id);
  return (
    <DoneView
      onboardingId={user.id}
      packageId={packageId}
      serverState={serverState ?? undefined}
      dashboardUrl={getBirdeyeDashboardUrl(serverState?.provisioning?.businessNumber ?? null)}
    />
  );
}
