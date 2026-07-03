// Renders the ops-handoff email. Inline styles are deliberate — email
// clients require them. Content comes from the same HandoffTask labels that
// are persisted to provisioning_tasks (see lib/ops/handoff.ts).

import "server-only";
import type { WizardState } from "@/lib/wizard/state";
import type { HandoffTask } from "@/lib/db/provisioning-tasks";
import type { HandoffSeverity, HandoffSummary } from "@/lib/ops/handoff";

const escapeHtml = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

export function renderOpsHandoffEmail(args: {
  state: WizardState;
  summary: HandoffSummary;
  tasks: HandoffTask[];
  severity: HandoffSeverity;
}): { subject: string; html: string } {
  const { state, summary, tasks, severity } = args;
  const businessName = state.business.name || "New business";
  const action = severity === "action_required" ? " — ACTION REQUIRED" : "";

  const subject = `[Birdeye provision${action}] ${businessName} (#${state.provisioning.businessNumber ?? "?"})`;
  const html = `
    <div style="font-family:-apple-system,BlinkMacSystemFont,sans-serif;line-height:1.55;max-width:640px;">
      <h2 style="font-family:Georgia,serif;color:#0D3F48;margin:0 0 8px;">Birdeye account provisioned${escapeHtml(action)}</h2>
      <p style="margin:0 0 4px;color:#4A6A70;"><strong>${escapeHtml(businessName)}</strong> · business #${escapeHtml(String(state.provisioning.businessNumber ?? "?"))} · ${escapeHtml(summary.package)}</p>
      <p style="margin:0 0 4px;color:#4A6A70;">Admin: ${escapeHtml(state.adminUser.email)}</p>
      <p style="margin:0 0 18px;color:#4A6A70;">Attempt ${summary.attempts}${summary.escalated ? " · ESCALATED — ops owns the remaining retries" : ""}</p>
      <h3 style="font-family:Georgia,serif;color:#0D3F48;margin:0 0 8px;">Manual steps to finish</h3>
      <p style="margin:0 0 8px;color:#4A6A70;">Tracked in the ops console at <a href="https://app.thegrowthhub.com.au/ops/provisioning/${encodeURIComponent(state.onboardingId)}" style="color:#0D3F48;">/ops/provisioning</a> — tick them off there.</p>
      <ul style="margin:0 0 18px;padding-left:18px;color:#0D3F48;">
        ${tasks.map((t) => `<li style="margin:0 0 6px;">${escapeHtml(t.label)}</li>`).join("")}
      </ul>
      <details>
        <summary style="cursor:pointer;color:#4A6A70;">Full data (Webchat config, FAQs, tags, Apple)</summary>
        <pre style="font-size:11px;white-space:pre-wrap;background:#FCFAF3;padding:10px;border-radius:8px;overflow:auto;">${escapeHtml(JSON.stringify(summary, null, 2))}</pre>
      </details>
    </div>
  `;
  return { subject, html };
}
