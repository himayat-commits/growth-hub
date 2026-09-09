// Builds the ops-handoff content: the summary JSON and the structured
// manual-step checklist. Single source of truth — the same HandoffTask
// labels are persisted to provisioning_tasks AND rendered in the ops email,
// so the tracked checklist and the notification can never drift apart.

import "server-only";
import { PACKAGES } from "@/lib/wizard/packages";
import type { WizardState } from "@/lib/wizard/state";
import type { HandoffTask } from "@/lib/db/provisioning-tasks";

export type HandoffSeverity = "info" | "action_required";

export type HandoffSummary = ReturnType<typeof buildHandoffSummary>;

/** The run executed against the real API. Missing `mode` = mock (production
 *  only ever ran mock before the field existed). */
export const isLiveHandoff = (state: WizardState): boolean =>
  state.provisioning.mode === "live";

/** A paid customer with NO account: the create step failed or was refused. */
export const isCreateFailed = (state: WizardState): boolean =>
  !state.provisioning.businessNumber && state.provisioning.runStatus === "failed";

export function buildHandoffSummary(state: WizardState, severity: HandoffSeverity) {
  const pkg = PACKAGES[state.packageId];
  const failedSteps = state.provisioning.failedSteps ?? [];
  return {
    onboardingId: state.onboardingId,
    severity,
    mode: isLiveHandoff(state) ? ("live" as const) : ("mock" as const),
    runStatus: state.provisioning.runStatus ?? null,
    createFailed: isCreateFailed(state),
    unresolvedCreate: state.provisioning.unresolvedCreate ?? null,
    package: pkg.name,
    modules: pkg.modules,
    businessNumber: state.provisioning.businessNumber,
    adminEmail: state.adminUser.email,
    additionalUsers: state.additionalUsers.map((u) => u.email),
    failedSteps,
    attempts: state.provisioning.attempts ?? 0,
    escalated: Boolean(state.provisioning.escalatedAt),
    captureForPartner: {
      appleDescription: state.descriptions.apple,
      appleCategories: state.taxonomy.appleCategories,
      faqs: state.faqs,
      contactTags: state.contacts
        .filter((c) => c.tags.length > 0)
        .map((c) => ({ email: c.email, phone: c.phone, tags: c.tags })),
    },
    webchat: state.webchat ?? null,
    timestamp: new Date().toISOString(),
  };
}

export function buildHandoffTasks(state: WizardState): HandoffTask[] {
  const pkg = PACKAGES[state.packageId];
  const failedSteps = state.provisioning.failedSteps ?? [];

  // No account exists: the only task that makes sense is getting one. The
  // module/webchat/FAQ checklist would otherwise send ops to configure a
  // business that isn't there; it is (re)built on the next successful run.
  if (isCreateFailed(state)) {
    const unresolved = state.provisioning.unresolvedCreate;
    const createError = failedSteps.find((f) => f.kind === "create_subaccount")?.error;
    return [
      {
        kind: "create_failed",
        label: unresolved
          ? "Birdeye sub-account NOT confirmed (paid customer, no account) — check Birdeye for an orphan (child/all by name/date). If none exists, use “I checked Birdeye — no account exists. Clear and re-run” in the ops console."
          : `Birdeye sub-account creation FAILED (paid customer, no account)${createError ? ` — ${createError}` : ""}. Fix the cause and re-run provisioning.`,
        snapshot: {
          error: createError ?? null,
          unresolvedCreate: unresolved ?? null,
          attempts: state.provisioning.attempts ?? 0,
          mode: isLiveHandoff(state) ? "live" : "mock",
        },
      },
    ];
  }
  const contactTags = state.contacts
    .filter((c) => c.tags.length > 0)
    .map((c) => ({ email: c.email, phone: c.phone, tags: c.tags }));

  const tasks: HandoffTask[] = [
    {
      kind: "modules",
      label: `Activate modules in Birdeye billing: ${pkg.modules.join("; ")}`,
      snapshot: { modules: pkg.modules, package: pkg.name },
    },
  ];
  if (state.webchat) {
    tasks.push({
      kind: "webchat",
      label: "Configure Webchat AI (Robin) — settings in the snapshot",
      snapshot: state.webchat,
    });
  }
  if (state.descriptions.apple) {
    tasks.push({
      kind: "apple_description",
      label: "Set the Apple Maps description (Birdeye API can't)",
      snapshot: { appleDescription: state.descriptions.apple },
    });
  }
  if (state.taxonomy.appleCategories.length) {
    tasks.push({
      kind: "apple_categories",
      label: `Set Apple categories: ${state.taxonomy.appleCategories.join(", ")}`,
      snapshot: { appleCategories: state.taxonomy.appleCategories },
    });
  }
  if (state.faqs.length) {
    tasks.push({
      kind: "faqs",
      label: `Load ${state.faqs.length} custom FAQ(s)`,
      snapshot: { faqs: state.faqs },
    });
  }
  if (contactTags.length) {
    tasks.push({
      kind: "contact_tags",
      label: "Apply contact tags (see snapshot)",
      snapshot: { contactTags },
    });
  }
  if (failedSteps.length) {
    tasks.push({
      kind: "retry_failed_steps",
      label: `Retry ${failedSteps.length} failed step(s): ${failedSteps
        .map((f) => f.kind)
        .join(", ")}`,
      snapshot: { failedSteps },
    });
  }
  return tasks;
}
