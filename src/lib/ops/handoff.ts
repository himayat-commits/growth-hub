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

export function buildHandoffSummary(state: WizardState, severity: HandoffSeverity) {
  const pkg = PACKAGES[state.packageId];
  const failedSteps = state.provisioning.failedSteps ?? [];
  return {
    onboardingId: state.onboardingId,
    severity,
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
