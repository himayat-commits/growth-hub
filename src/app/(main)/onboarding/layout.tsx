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
        <main className="flex-1 min-w-0">
          {initialState.status === "provisioned" ? <PostProvisionBanner /> : null}
          {children}
        </main>
      </WizardProvider>
    </div>
  );
}

// Shown above every wizard step when the user has already provisioned their
// Birdeye account. Edits made here are persisted to Neon but do NOT auto-sync
// back to Birdeye — that flow doesn't exist yet. Setting the right expectation
// up front is honest and points users at the support email.
function PostProvisionBanner() {
  return (
    <div className="mx-auto max-w-4xl px-6 md:px-10 pt-6">
      <div className="rounded-2xl border border-plum/20 bg-plum/[0.04] p-4 md:p-5 text-sm text-plum leading-relaxed">
        <strong className="font-semibold">You&apos;re already provisioned.</strong>{" "}
        Your Birdeye account is live, so changes you make here won&apos;t
        auto-sync. To update your business info in Birdeye, email{" "}
        <a href="mailto:hello@himayat.com.au" className="underline decoration-plum/40 hover:decoration-plum">
          hello@himayat.com.au
        </a>{" "}
        or update directly in your Birdeye dashboard.
      </div>
    </div>
  );
}
