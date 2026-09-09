// Ops handoff orchestration. Replaces the old open /api/notify-ops HTTP
// endpoint (which had no auth and required an origin header the runner had
// to self-fetch) with a direct server-side call:
//   1. Persist the manual-step checklist to provisioning_tasks (durable).
//   2. Fire the webhook (Slack etc.) if configured.
//   3. Send the email via sendEmail() (HubSpot or Resend) if a provider is configured.
//   4. Console fallback so dev never loses the handoff.
// Non-fatal by design (the runner logs the outcome to provisioning_logs and
// the ops console surfaces failures) — but it must be HONEST about failure:
// `ok` is only true when a channel actually accepted the message. A
// silently-swallowed 403 (unverified domain, revoked key) once recorded as
// ok=true, hiding a paid customer from ops entirely.

import "server-only";
import type { WizardState } from "@/lib/wizard/state";
import { buildHandoffSummary, buildHandoffTasks, type HandoffSeverity } from "@/lib/ops/handoff";
import { renderOpsHandoffEmail } from "@/lib/ops/handoff-email";
import { upsertHandoffTasks } from "@/lib/db/provisioning-tasks";
import { DEFAULT_FROM, OPS_EMAIL, resolveEmailProvider, sendEmail } from "@/lib/email/send";

export async function sendOpsHandoff(args: {
  state: WizardState;
  severity: HandoffSeverity;
}): Promise<{ ok: boolean; error?: string }> {
  const { state, severity } = args;
  const summary = buildHandoffSummary(state, severity);
  const tasks = buildHandoffTasks(state);
  const failedSteps = state.provisioning.failedSteps ?? [];

  // 1. Durable checklist first — even if every notification channel is down,
  //    the ops console still shows the work. A fully-clean run closes any
  //    open retry task from earlier partials.
  await upsertHandoffTasks(state.onboardingId, tasks, {
    resolveRetry: failedSteps.length === 0,
    // An account now exists — any earlier "create failed" task is moot.
    resolveCreateFailed: Boolean(state.provisioning.businessNumber),
  });

  let ok = false;
  let lastError: string | undefined;

  // 2. Webhook (Slack etc.), if configured.
  const hook = process.env.OPS_NOTIFY_WEBHOOK;
  if (hook) {
    try {
      const res = await fetch(hook, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(summary),
      });
      if (!res.ok) throw new Error(`webhook returned ${res.status}`);
      ok = true;
    } catch (e) {
      lastError = e instanceof Error ? e.message : "webhook failed";
    }
  }

  // 3. Email, if a provider is configured. sendEmail() never throws and
  //    reports provider-side rejections as ok=false.
  const emailConfigured = resolveEmailProvider().provider !== "none";
  if (emailConfigured) {
    const { subject, html } = renderOpsHandoffEmail({ state, summary, tasks, severity });
    const result = await sendEmail({ from: DEFAULT_FROM, to: OPS_EMAIL, subject, html });
    if (result.ok) {
      ok = true;
    } else {
      lastError = result.error;
    }
  }

  // 4. Console fallback so dev never loses the handoff.
  if (!hook && !emailConfigured) {
    console.log("[ops-handoff]", JSON.stringify(summary));
    ok = true;
  }

  return ok ? { ok } : { ok: false, error: lastError ?? "no ops channel succeeded" };
}
