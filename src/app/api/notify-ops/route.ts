// Tells the reseller ops team to finish the steps the public Birdeye API
// can't do — per-module ENTITLEMENT activation, Webchat AI config, Apple
// Maps description, FAQs, contact tags — and (on a partial run) which
// automated steps need a retry.
//
// Channels, in order of preference: a Slack/webhook URL if OPS_NOTIFY_WEBHOOK
// is set, plus an email via Resend if configured. Falls back to console.log
// so nothing is silently lost in dev. Non-fatal by design: the customer is
// already provisioned in Birdeye before this runs.

import { NextResponse } from "next/server";
import { z } from "zod";
import { Resend } from "resend";
import { wizardStateSchema } from "@/lib/wizard/state";
import { PACKAGES } from "@/lib/wizard/packages";

const Body = z.object({
  state: wizardStateSchema,
  severity: z.enum(["info", "action_required"]).optional(),
});

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;
const OPS_EMAIL = process.env.OPS_NOTIFICATION_EMAIL ?? "hello@himayat.com.au";

const escapeHtml = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

export async function POST(req: Request) {
  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
  const { state, severity = "info" } = parsed.data;
  const pkg = PACKAGES[state.packageId];
  const failedSteps = state.provisioning.failedSteps ?? [];

  const summary = {
    onboardingId: state.onboardingId,
    severity,
    package: pkg.name,
    modules: pkg.modules,
    businessNumber: state.provisioning.businessNumber,
    adminEmail: state.adminUser.email,
    additionalUsers: state.additionalUsers.map((u) => u.email),
    failedSteps,
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

  // 1. Webhook (Slack etc.), if configured.
  const hook = process.env.OPS_NOTIFY_WEBHOOK;
  if (hook) {
    await fetch(hook, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(summary),
    }).catch(() => {
      /* don't fail provisioning over the webhook */
    });
  }

  // 2. Email via Resend, if configured.
  if (resend) {
    try {
      const businessName = state.business.name || "New business";
      const action = severity === "action_required" ? " — ACTION REQUIRED" : "";
      const checklist = [
        `Activate modules in Birdeye billing: ${pkg.modules.join("; ")}`,
        state.webchat ? "Configure Webchat AI (Robin) — settings in the JSON below" : null,
        state.descriptions.apple ? "Set the Apple Maps description (Birdeye API can't)" : null,
        state.taxonomy.appleCategories.length ? `Set Apple categories: ${state.taxonomy.appleCategories.join(", ")}` : null,
        state.faqs.length ? `Load ${state.faqs.length} custom FAQ(s)` : null,
        summary.captureForPartner.contactTags.length ? "Apply contact tags (see JSON)" : null,
        ...failedSteps.map((f) => `RETRY failed step "${f.kind}": ${f.error}`),
      ].filter(Boolean) as string[];

      await resend.emails.send({
        from: "Growth Hub <noreply@himayat.com.au>",
        to: OPS_EMAIL,
        subject: `[Birdeye provision${action}] ${businessName} (#${state.provisioning.businessNumber ?? "?"})`,
        html: `
          <div style="font-family:-apple-system,BlinkMacSystemFont,sans-serif;line-height:1.55;max-width:640px;">
            <h2 style="font-family:Georgia,serif;color:#0D3F48;margin:0 0 8px;">Birdeye account provisioned${escapeHtml(action)}</h2>
            <p style="margin:0 0 4px;color:#4A6A70;"><strong>${escapeHtml(businessName)}</strong> · business #${escapeHtml(String(state.provisioning.businessNumber ?? "?"))} · ${escapeHtml(pkg.name)}</p>
            <p style="margin:0 0 18px;color:#4A6A70;">Admin: ${escapeHtml(state.adminUser.email)}</p>
            <h3 style="font-family:Georgia,serif;color:#0D3F48;margin:0 0 8px;">Manual steps to finish</h3>
            <ul style="margin:0 0 18px;padding-left:18px;color:#0D3F48;">
              ${checklist.map((c) => `<li style="margin:0 0 6px;">${escapeHtml(c)}</li>`).join("")}
            </ul>
            <details>
              <summary style="cursor:pointer;color:#4A6A70;">Full data (Webchat config, FAQs, tags, Apple)</summary>
              <pre style="font-size:11px;white-space:pre-wrap;background:#FCFAF3;padding:10px;border-radius:8px;overflow:auto;">${escapeHtml(JSON.stringify(summary, null, 2))}</pre>
            </details>
          </div>
        `,
      });
    } catch {
      /* don't fail provisioning over the ops email */
    }
  }

  // 3. Console fallback so dev never loses the handoff.
  if (!hook && !resend) {
    console.log("[notify-ops]", JSON.stringify(summary));
  }

  return NextResponse.json({ ok: true });
}
