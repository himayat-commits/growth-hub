// Wizard layout (server). Resolves the signed-in user via WorkOS,
// looks up their subscription to determine the package tier, and
// hydrates the wizard from `onboarding_states` (Neon) if a prior
// session exists. The WizardProvider then mirrors live edits back
// to the same row via PUT /api/onboarding/[id].

import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { withAuth } from "@workos-inc/authkit-nextjs";
import { getDb } from "@/lib/db";
import { onboardingStates } from "@/lib/db/schema";
import { getSubscription, isActive } from "@/lib/subscription";
import { createInitialState } from "@/lib/wizard/initial-state";
import type { WizardState } from "@/lib/wizard/state";
import type { PackageId } from "@/lib/wizard/packages";
import { WizardProvider } from "@/components/wizard/WizardContext";
import { LeftRail } from "@/components/wizard/LeftRail";

export default async function OnboardingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user } = await withAuth();
  if (!user) {
    redirect("/sign-in?redirect_url=" + encodeURIComponent("/onboarding"));
  }

  const sub = await getSubscription();
  if (!isActive(sub)) {
    redirect("/pricing");
  }

  const packageId = (sub!.planTier as PackageId | null) ?? "foundations";
  const userId = user.id;

  // Hydrate from Neon if a prior wizard session exists for this user.
  const rows = await getDb()
    .select()
    .from(onboardingStates)
    .where(eq(onboardingStates.userId, userId))
    .limit(1);

  const initialState: WizardState =
    (rows[0]?.state as WizardState | undefined) ??
    createInitialState({
      onboardingId: userId,
      packageId,
      email: user.email ?? "",
    });

  return (
    <div className="flex min-h-screen bg-eggshell">
      <WizardProvider initialState={initialState}>
        <LeftRail />
        <main className="flex-1 min-w-0">{children}</main>
      </WizardProvider>
    </div>
  );
}
