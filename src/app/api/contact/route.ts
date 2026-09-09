// POST /api/contact — the public enquiry form.
//
// Two independent best-effort channels (GTM review F7.11):
//   1. HubSpot CRM — the lead is submitted to a HubSpot form (Forms v3
//      integration endpoint, same mechanics as /api/newsletter) when
//      HUBSPOT_CONTACT_FORM_ID is set, so it lands on the contact record with
//      the form's own lifecycle / list / workflow automations.
//   2. Email to ops — via sendEmail() (HubSpot single-send or Resend, see
//      src/lib/email/send.ts).
// The request succeeds (200) if EITHER channel lands; 503 only when neither
// is configured at all; 500 when everything configured failed. The JSON says
// which channels succeeded so the client can be honest.
//
// HubSpot form fields expected: firstname, lastname, email, message and an
// optional single-line text property `gh_interests` (interest chips joined
// with ';'). HubSpot rejects submissions carrying fields that are not on the
// form, so if the form lacks `gh_interests` we simply don't send it — set
// HUBSPOT_CONTACT_FORM_HAS_INTERESTS=1 once the property + field exist.

import { NextRequest, NextResponse } from "next/server";
import * as Sentry from "@sentry/nextjs";
import { rateLimit, clientIp, tooManyRequests } from "@/lib/rate-limit";
import { escapeHtml, sendEmail } from "@/lib/email/send";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type ContactBody = {
  name?: unknown;
  email?: unknown;
  business?: unknown;
  interests?: unknown;
  message?: unknown;
  ref?: unknown;
};

const str = (v: unknown, max: number): string => (typeof v === "string" ? v.trim().slice(0, max) : "");

export async function POST(req: NextRequest) {
  const rl = rateLimit(`contact:${clientIp(req)}`, 5, 60_000);
  if (!rl.ok) return tooManyRequests(rl.retryAfterSec);

  let body: ContactBody;
  try {
    body = (await req.json()) as ContactBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const name = str(body.name, 200);
  const email = str(body.email, 320).toLowerCase();
  const business = str(body.business, 200);
  const message = str(body.message, 5000);
  const ref = str(body.ref, 40);
  const interests = Array.isArray(body.interests)
    ? body.interests
        .filter((i): i is string => typeof i === "string")
        .map((i) => i.trim().slice(0, 80))
        .filter(Boolean)
    : [];

  if (!name || !email) {
    return NextResponse.json({ error: "Name and email are required." }, { status: 400 });
  }
  if (!EMAIL_RE.test(email)) {
    return NextResponse.json({ error: "Please enter a valid email address." }, { status: 400 });
  }

  const channels: string[] = [];
  const failures: string[] = [];

  // ── 1. HubSpot CRM (form submission) ────────────────────────────────────
  const portalId = process.env.HUBSPOT_PORTAL_ID?.trim();
  const formId = process.env.HUBSPOT_CONTACT_FORM_ID?.trim();
  const hubspotConfigured = Boolean(portalId && formId);
  if (portalId && formId) {
    try {
      await submitToHubspotForm({ portalId, formId, name, email, message, interests, ref });
      channels.push("hubspot");
    } catch (err) {
      const detail = err instanceof Error ? err.message : String(err);
      failures.push(`hubspot: ${detail}`);
      console.error("[contact] HubSpot form submit failed", detail);
      Sentry.captureException(err, { tags: { area: "contact", provider: "hubspot" }, extra: { ref } });
    }
  }

  // ── 2. Email to ops ─────────────────────────────────────────────────────
  const businessLine = business || "no business listed";
  const interestLine = interests.length > 0 ? interests.join(", ") : "Not specified";

  // Subject is a plaintext header (not HTML) so it isn't escaped here.
  const subject = `New enquiry ${ref} from ${name} — ${businessLine}`.replace(/\s+/g, " ");

  // HTML-safe copies for interpolation into the template below — a visitor
  // must not be able to inject markup/links into the email we send ourselves.
  const nameH = escapeHtml(name);
  const emailH = escapeHtml(email);
  const businessLineH = escapeHtml(businessLine);
  const interestLineH = escapeHtml(interestLine);
  const messageH = message ? escapeHtml(message) : "";
  const refH = ref ? escapeHtml(ref) : "";

  const html = `
<div style="font-family: Georgia, serif; max-width: 600px; color: #0D3F48;">
  <div style="background:#0D3F48; color:#F3F0E7; padding: 28px 32px; border-radius: 8px 8px 0 0;">
    <h2 style="margin:0; font-weight:400; font-size:24px;">New Growth Hub Enquiry</h2>
    <p style="margin:6px 0 0; opacity:0.75; font-size:14px;">${refH}</p>
  </div>
  <div style="background:#FCFAF3; border:1px solid #E6E1D2; border-top:none; padding: 28px 32px; border-radius: 0 0 8px 8px;">
    <table style="width:100%; border-collapse:collapse; font-size:16px;">
      <tr><td style="padding:10px 0; border-bottom:1px solid #E6E1D2; font-weight:600; width:140px; color:#4A6A70; font-size:12px; letter-spacing:0.1em; text-transform:uppercase;">Name</td><td style="padding:10px 0; border-bottom:1px solid #E6E1D2;">${nameH}</td></tr>
      <tr><td style="padding:10px 0; border-bottom:1px solid #E6E1D2; font-weight:600; color:#4A6A70; font-size:12px; letter-spacing:0.1em; text-transform:uppercase;">Email</td><td style="padding:10px 0; border-bottom:1px solid #E6E1D2;"><a href="mailto:${emailH}" style="color:#0D3F48;">${emailH}</a></td></tr>
      <tr><td style="padding:10px 0; border-bottom:1px solid #E6E1D2; font-weight:600; color:#4A6A70; font-size:12px; letter-spacing:0.1em; text-transform:uppercase;">Business</td><td style="padding:10px 0; border-bottom:1px solid #E6E1D2;">${businessLineH}</td></tr>
      <tr><td style="padding:10px 0; border-bottom:1px solid #E6E1D2; font-weight:600; color:#4A6A70; font-size:12px; letter-spacing:0.1em; text-transform:uppercase;">Interested in</td><td style="padding:10px 0; border-bottom:1px solid #E6E1D2;">${interestLineH}</td></tr>
    </table>
    ${
      messageH
        ? `<div style="margin-top:24px;">
        <p style="font-size:12px; font-weight:600; color:#4A6A70; letter-spacing:0.1em; text-transform:uppercase; margin:0 0 10px;">Message</p>
        <p style="margin:0; line-height:1.65; white-space:pre-wrap;">${messageH}</p>
      </div>`
        : ""
    }
    <div style="margin-top:32px; padding-top:20px; border-top:1px solid #E6E1D2; font-size:13px; color:#7A9098;">
      Reply directly to this email to respond to ${nameH}.
    </div>
  </div>
</div>`;

  const text = [
    `New Growth Hub enquiry ${ref}`.trim(),
    `Name: ${name}`,
    `Email: ${email}`,
    `Business: ${businessLine}`,
    `Interested in: ${interestLine}`,
    message ? `\n${message}` : "",
  ].join("\n");

  const emailResult = await sendEmail({
    to: "hello@himayat.com.au",
    replyTo: email,
    subject,
    html,
    text,
  });
  if (emailResult.ok) {
    channels.push("email");
  } else if (emailResult.provider !== "none") {
    // Provider errors are already in Sentry via sendEmail(); keep the detail
    // for the 500 log below.
    failures.push(`email: ${emailResult.error}`);
  }

  // ── Outcome ─────────────────────────────────────────────────────────────
  if (channels.length > 0) {
    if (failures.length) console.warn("[contact] partial delivery", { channels, failures });
    return NextResponse.json({ ok: true, success: true, channels });
  }

  const nothingConfigured = !hubspotConfigured && emailResult.provider === "none";
  if (nothingConfigured) {
    // A deployment problem, not a visitor problem — fail loudly and give the
    // visitor a working fallback address. (sendEmail already raised Sentry
    // once per process for the missing provider.)
    Sentry.captureMessage("contact form unavailable — no email provider and no HUBSPOT_CONTACT_FORM_ID", {
      level: "error",
      tags: { area: "contact" },
    });
    return NextResponse.json(
      { error: "Contact form is temporarily unavailable — email hello@himayat.com.au" },
      { status: 503 },
    );
  }

  // A lost enquiry is a lost lead — make sure someone sees it.
  console.error("[contact] every channel failed", failures);
  Sentry.captureMessage("contact form: every delivery channel failed", {
    level: "error",
    tags: { area: "contact" },
    extra: { failures, hubspotConfigured, emailProvider: emailResult.provider },
  });
  return NextResponse.json(
    { error: "Failed to send message. Please email us directly." },
    { status: 500 },
  );
}

// Same host logic as /api/newsletter: HubSpot's Forms API is per data-centre
// and the wrong host silently 404s. Production is ap1.
async function submitToHubspotForm(args: {
  portalId: string;
  formId: string;
  name: string;
  email: string;
  message: string;
  interests: string[];
  ref: string;
}): Promise<void> {
  const { portalId, formId, name, email, message, interests, ref } = args;
  const region = (process.env.HUBSPOT_REGION ?? "na1").toLowerCase();
  const apiHost = region === "na1" ? "api.hsforms.com" : `api-${region}.hsforms.com`;
  const url = `https://${apiHost}/submissions/v3/integration/submit/${portalId}/${formId}`;

  // Split "First Last" → firstname / lastname; single-word names go to
  // firstname only (HubSpot treats an empty lastname as unset).
  const [firstname, ...rest] = name.split(/\s+/);
  const lastname = rest.join(" ");

  // objectTypeId 0-1 = Contact.
  const fields: Array<{ objectTypeId: string; name: string; value: string }> = [
    { objectTypeId: "0-1", name: "firstname", value: firstname },
    { objectTypeId: "0-1", name: "email", value: email },
  ];
  if (lastname) fields.push({ objectTypeId: "0-1", name: "lastname", value: lastname });
  if (message) fields.push({ objectTypeId: "0-1", name: "message", value: message });
  // `gh_interests` is a plain single-line text contact property (NOT a
  // ticket field, no enumeration) so any chip label we add later still
  // submits. Only sent when the form has the field — HubSpot 400s on
  // fields that aren't on the form.
  if (interests.length && process.env.HUBSPOT_CONTACT_FORM_HAS_INTERESTS === "1") {
    fields.push({ objectTypeId: "0-1", name: "gh_interests", value: interests.join(";") });
  }

  const payload = {
    fields,
    context: {
      // Shows on the contact's form-submission history in HubSpot.
      pageUri: "growth-hub:contact",
      pageName: ref ? `Contact form (${ref})` : "Contact form",
    },
  };

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw new Error(`HubSpot ${res.status}: ${detail.slice(0, 200)}`);
  }
}
