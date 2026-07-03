// Ops handoff orchestration. Replaces the old open /api/notify-ops HTTP
// endpoint (which had no auth and required an origin header the runner had
// to self-fetch) with a direct server-side call:
//   1. Persist the manual-step checklist to provisioning_tasks (durable).
//   2. Fire the webhook (Slack etc.) if configured.
//   3. Send the Resend email if configured.
//   4. Console fallback so dev never loses the handoff.
// Non-fatal by design: the customer is already provisioned when this runs.

import "server-only";
import { Resend } from "resend";
import type { WizardState } from "@/lib/wizard/state";
import { buildHandoffSummary, buildHandoffTasks, type HandoffSeverity } from "@/lib/ops/handoff";
import { renderOpsHandoffEmail } from "@/lib/ops/handoff-email";
import { upsertHandoffTasks } from "@/lib/db/provisioning-tasks";

const OPS_EMAIL = process.env.OPS_NOTIFICATION_EMAIL ?? "hello@himayat.com.au";

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

  // 3. Email via Resend, if configured. Client instantiated lazily so a
  //    missing key in dev doesn't throw at import time.
  if (process.env.RESEND_API_KEY) {
    try {
      const resend = new Resend(process.env.RESEND_API_KEY);
      const { subject, html } = renderOpsHandoffEmail({ state, summary, tasks, severity });
      await resend.emails.send({
        from: "Growth Hub <noreply@himayat.com.au>",
        to: OPS_EMAIL,
        subject,
        html,
      });
      ok = true;
    } catch (e) {
      lastError = e instanceof Error ? e.message : "ops email failed";
    }
  }

  // 4. Console fallback so dev never loses the handoff.
  if (!hook && !process.env.RESEND_API_KEY) {
    console.log("[ops-handoff]", JSON.stringify(summary));
    ok = true;
  }

  return ok ? { ok } : { ok: false, error: lastError ?? "no ops channel succeeded" };
}
