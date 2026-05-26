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
import type { WizardState } from '@/lib/wizard/state';
import type { PackageId } from '@/lib/wizard/packages';
import { WizardProvider } from '@/components/wizard/WizardContext';

export default async function OnboardingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user } = await withAuth();
  if (!user) {
    redirect('/sign-in?redirect_url=' + encodeURIComponent('/onboarding'));
  }

  const sub = await getSubscription();
  if (!isActive(sub)) {
    redirect('/pricing');
  }

  const packageId = (sub!.planTier as PackageId | null) ?? 'foundations';
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
      email: user.email ?? '',
    });

  return (
    <WizardProvider initialState={initialState}>
      {initialState.status === 'provisioned' ? <PostProvisionBanner /> : null}
      {children}
    </WizardProvider>
  );
}

// Shown above every wizard step when the user has already provisioned their
// Birdeye account. Edits made here are persisted to Neon but do NOT
// auto-sync back to Birdeye. Honest banner pointing at the support email.
function PostProvisionBanner() {
  return (
    <div style={{ maxWidth: 880, margin: '0 auto 16px', padding: '0 32px' }}>
      <div
        style={{
          borderRadius: 14,
          border: '1px solid rgba(95,48,75,0.2)',
          background: 'rgba(95,48,75,0.04)',
          padding: '14px 18px',
          fontSize: 13.5,
          color: 'var(--plum)',
          lineHeight: 1.55,
        }}
      >
        <strong style={{ fontWeight: 600 }}>You&apos;re already provisioned.</strong>{' '}
        Your Birdeye account is live, so changes you make here won&apos;t auto-sync. To
        update your business info in Birdeye, email{' '}
        <a
          href="mailto:hello@himayat.com.au"
          style={{ color: 'var(--plum)', textDecoration: 'underline' }}
        >
          hello@himayat.com.au
        </a>{' '}
        or update directly in your Birdeye dashboard.
      </div>
    </div>
  );
}
