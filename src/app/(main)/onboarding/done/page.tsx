import { redirect } from "next/navigation";
import { withAuth } from "@workos-inc/authkit-nextjs";
import { getSubscription, isActive } from "@/lib/subscription";
import type { PackageId } from "@/lib/wizard/packages";
import { DoneView } from "@/components/portal/DoneView";

// Post-provisioning "you're live" view. Resolves the user + subscription
// server-side; the inner DoneView hydrates the wizard state from
// localStorage / Neon to render business number, invited users, etc.

export default async function DonePage() {
  const { user } = await withAuth();
  if (!user) {
    redirect("/sign-in?redirect_url=" + encodeURIComponent("/onboarding/done"));
  }

  const sub = await getSubscription();
  if (!isActive(sub)) redirect("/pricing");

  const packageId = (sub!.planTier as PackageId | null) ?? "foundations";
  return <DoneView onboardingId={user.id} packageId={packageId} />;
}
