// Wizard sub-layout inside the (app) shell.
//
// The outer (app)/layout.tsx already renders Sidebar + Topbar. This nested
// layout adds the WizardProvider on top of that chrome — so the wizard
// step pages can call useWizard() without us having to re-render the
// sidebar/topbar inside the wizard.
//
// Subscription gate: the Birdeye provisioning wizard is paid-only. Free
// Members hit /pricing. Once a user is provisioned they keep access to
// /onboarding/done and /onboarding/update-later, but pre-provision steps
// would have nothing to do — we still let them through with a banner
// (PostProvisionBanner below) so the existing wizard step pages keep
// working without conditional hiding.

import { redirect } from 'next/navigation';
import { eq } from 'drizzle-orm';
import { withAuth } from '@/lib/auth/with-auth';
import { getDb } from '@/lib/db';
import { onboardingStates } from '@/lib/db/schema';
import { getSubscription, isActive } from '@/lib/subscription';
import { createInitialState } from '@/lib/wizard/initial-state';
import { parseWizardState } from '@/lib/wizard/parse-state';
import type { WizardState, WizardMode } from '@/lib/wizard/state';
import type { PackageId } from '@/lib/wizard/packages';
import { WizardProvider } from '@/components/wizard/WizardContext';
import { PostProvisionNotice } from '@/components/wizard/PostProvisionNotice';

export default async function OnboardingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user } = await withAuth();
  if (!user) {
    redirect('/sign-in?redirect_url=' + encodeURIComponent('/onboarding'));
  }

  // Paid users provision a real Birdeye account; free users get the
  // action-plan report instead (no /pricing dead-end).
  const sub = await getSubscription();
  const mode: WizardMode = isActive(sub) ? 'provision' : 'report';

  const packageId = (sub?.planTier as PackageId | null) ?? 'foundations';
  const userId = user.id;

  // Hydrate from Neon if a prior wizard session exists for this user.
  const rows = await getDb()
    .select()
    .from(onboardingStates)
    .where(eq(onboardingStates.userId, userId))
    .limit(1);

  const fallback = {
    onboardingId: userId,
    packageId,
    email: user.email ?? '',
  };
  const initialState: WizardState = rows[0]
    ? parseWizardState(rows[0].state, fallback)
    : createInitialState(fallback);

  return (
    <WizardProvider initialState={initialState} mode={mode}>
      {mode === 'provision' && initialState.status === 'provisioned' ? (
        <PostProvisionNotice />
      ) : null}
      {children}
    </WizardProvider>
  );
}
