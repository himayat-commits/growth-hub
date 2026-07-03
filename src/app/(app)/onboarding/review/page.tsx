import { redirect } from "next/navigation";
import { withAuth } from "@/lib/auth/with-auth";
import { loadOnboardingState } from "@/lib/wizard/provisioning-store";
import { ReviewClient } from "./ReviewClient";

// Server wrapper: reads the authoritative provisioning block from Neon so
// re-entry (revisit after a run, another device, a crashed tab) renders from
// server truth rather than the localStorage mirror.
export default async function ReviewPage() {
  const { user } = await withAuth();
  if (!user) {
    redirect("/sign-in?redirect_url=" + encodeURIComponent("/onboarding/review"));
  }

  const serverState = await loadOnboardingState(user.id);
  return <ReviewClient serverProvisioning={serverState?.provisioning ?? null} />;
}
