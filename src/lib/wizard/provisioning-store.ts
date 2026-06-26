// Server-authoritative persistence for the `provisioning` block of a
// wizard run. The orchestrator writes here the instant a sub-account is
// created (so a mid-run crash never orphans a real, billable account with
// its businessNumber lost), and on every subsequent step so a retry can
// resume instead of re-creating.
//
// `userId` is the WorkOS user id == onboarding_states.userId (PK) ==
// WizardState.onboardingId. One onboarding per user.

import "server-only";
import { eq, sql } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { onboardingStates } from "@/lib/db/schema";
import type { Provisioning, WizardState } from "@/lib/wizard/state";

/** Read the authoritative wizard state for a user, or null if none. */
export async function loadOnboardingState(
  userId: string,
): Promise<WizardState | null> {
  const rows = await getDb()
    .select()
    .from(onboardingStates)
    .where(eq(onboardingStates.userId, userId))
    .limit(1);
  return (rows[0]?.state as WizardState | undefined) ?? null;
}

/** Insert the row if it doesn't exist yet, without clobbering an existing
 *  (auto-saved) one. The wizard normally creates the row via auto-save, but
 *  E2E/edge paths may POST to provision before any save landed. */
export async function ensureOnboardingState(
  userId: string,
  state: WizardState,
): Promise<void> {
  await getDb()
    .insert(onboardingStates)
    .values({ userId, state })
    .onConflictDoNothing({ target: onboardingStates.userId });
}

type ProvisioningMutation = {
  provisioning?: Partial<Provisioning>;
  status?: WizardState["status"];
};

/** Read-modify-write merge of the `provisioning` block (and optionally the
 *  top-level lifecycle `status`). The orchestrator runs steps sequentially,
 *  so there's no true concurrency, but each call re-reads fresh state so
 *  arrays like invitedUsers/mediaIds are never clobbered by a stale copy.
 *
 *  `mutate` receives the current provisioning + full state and returns the
 *  fields to merge — letting callers append to failedSteps etc. */
export async function updateProvisioning(
  userId: string,
  mutate: (prev: Provisioning, state: WizardState) => ProvisioningMutation,
): Promise<void> {
  const current = await loadOnboardingState(userId);
  if (!current) {
    console.error(
      `[provisioning-store] no onboarding_states row for user=${userId} — cannot persist progress`,
    );
    return;
  }
  const patch = mutate(current.provisioning, current);
  const nextState: WizardState = {
    ...current,
    status: patch.status ?? current.status,
    provisioning: { ...current.provisioning, ...patch.provisioning },
    updatedAt: new Date().toISOString(),
  };
  await getDb()
    .update(onboardingStates)
    .set({ state: nextState, updatedAt: sql`now()` })
    .where(eq(onboardingStates.userId, userId));
}
