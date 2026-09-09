// Renders the ops-handoff email. Inline styles are deliberate — email
// clients require them. Content comes from the same HandoffTask labels that
// are persisted to provisioning_tasks (see lib/ops/handoff.ts).

import "server-only";
import type { WizardState } from "@/lib/wizard/state";
import type { HandoffTask } from "@/lib/db/provisioning-tasks";
import { isCreateFailed, isLiveHandoff, type HandoffSeverity, type HandoffSummary } from "@/lib/ops/handoff";

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
  const live = isLiveHandoff(state);
  const createFailed = isCreateFailed(state);

  // A mock run recorded a synthetic business number and created NOTHING in
  // Birdeye. Say so up front so ops never ticks off module activation on an
  // account that does not exist.
  const modePrefix = live ? "" : "[MOCK] ";
  const heading = createFailed
    ? "Birdeye account creation FAILED"
    : live
      ? "Birdeye account provisioned"
      : "Birdeye setup captured (mock run — no account yet)";
  const numberLabel =
    live && state.provisioning.businessNumber
      ? `business #${escapeHtml(String(state.provisioning.businessNumber))}`
      : createFailed
        ? "NO account"
        : "mock number — not a real account";
  const subjectTag = live
    ? `#${state.provisioning.businessNumber ?? "?"}`
    : createFailed
      ? "no account"
      : "mock";
  const callout = (text: string) =>
    `<p style="margin:0 0 12px;padding:10px 12px;background:#FCEFEF;border-left:4px solid #5F304B;color:#5F304B;">${text}</p>`;

  const subject = `${modePrefix}[Birdeye provision${action}] ${businessName} (${subjectTag})`;
  const html = `
    <div style="font-family:-apple-system,BlinkMacSystemFont,sans-serif;line-height:1.55;max-width:640px;">
      <h2 style="font-family:Georgia,serif;color:#0D3F48;margin:0 0 8px;">${escapeHtml(heading)}${escapeHtml(action)}</h2>
      ${
        live
          ? ""
          : callout(
              "<strong>This was a MOCK run — no Birdeye account exists yet.</strong> Create it manually and mark the tasks done, or re-run once PROVISION_MODE is live.",
            )
      }
      ${
        createFailed
          ? callout(
              `<strong>A paying customer has no Birdeye account.</strong> ${
                state.provisioning.unresolvedCreate
                  ? "The create call's outcome is UNKNOWN — check Birdeye for an orphan before anyone retries. The raw response is in the ops console."
                  : "The create call failed outright; fix the cause and re-run from the ops console."
              }`,
            )
          : ""
      }
      <p style="margin:0 0 4px;color:#4A6A70;"><strong>${escapeHtml(businessName)}</strong> · ${numberLabel} · ${escapeHtml(summary.package)}</p>
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
