// Provider-agnostic transactional email. Every send in the app goes through
// sendEmail() so the provider can be swapped with env vars alone.
//
// Why this exists: production Vercel never had RESEND_API_KEY, so every
// transactional email (welcome, RSVP, order confirmation, ops handoff, contact
// enquiries…) was silently skipped by the old `if (!resend) return` guards.
// The owner wants HubSpot (portal 442026767) to be the sender. HubSpot's only
// code path for transactional mail is the Single-send API, which sends a
// PRE-BUILT HubSpot email identified by `emailId` and personalised via
// `customProperties` — it does not accept arbitrary HTML bodies or
// attachments. So we keep ONE generic HubSpot transactional email whose
// subject is `{{ custom.subject }}` and whose body renders
// `{{ custom.body_html }}`; the fully rendered HTML travels as a custom
// property. See docs/EMAIL.md for the HubSpot-side setup.
//
// Provider selection (EMAIL_PROVIDER = hubspot | resend | unset → auto):
//   auto → hubspot when HUBSPOT_PRIVATE_APP_TOKEN + HUBSPOT_TRANSACTIONAL_EMAIL_ID
//          are set, else resend when RESEND_API_KEY is set, else none.
//   none → sendEmail() returns { ok:false, provider:'none' }; logged + Sentry
//          once per process so a misconfigured deploy is loud, not silent.
//
// sendEmail() NEVER throws. Callers decide what a failure means for them.

import 'server-only';
import * as Sentry from '@sentry/nextjs';
import { DEFAULT_FROM, OPS_EMAIL, escapeHtml, getResend } from '@/lib/email/resend';

export { DEFAULT_FROM, OPS_EMAIL, escapeHtml };

export type EmailProvider = 'hubspot' | 'resend';

export type EmailAttachment = {
  filename: string;
  content: string | Buffer;
  contentType?: string;
};

export type EmailMessage = {
  to: string;
  subject: string;
  html: string;
  /** Plain-text alternative. On HubSpot the first 140 chars become the preheader. */
  text?: string;
  replyTo?: string;
  /** Defaults to DEFAULT_FROM. On HubSpot the domain must be a connected sending domain. */
  from?: string;
  /**
   * Only the Resend provider can carry real attachments. HubSpot single-send
   * cannot, so there the HTML gets an "Attachments" footer listing each file
   * and linking to `tags.icsUrl` when set (used for event .ics files).
   */
  attachments?: EmailAttachment[];
  /** Free-form metadata. Known keys: `icsUrl` (public link substituted for an .ics attachment). */
  tags?: Record<string, string>;
};

export type SendResult =
  | { ok: true; provider: EmailProvider; id?: string }
  | { ok: false; provider: EmailProvider | 'none'; error: string };

export type ResolvedProvider = {
  provider: EmailProvider | 'none';
  /** Human-readable explanation for logs / config health. */
  reason: string;
  /** True when EMAIL_PROVIDER pinned the choice rather than auto-detection. */
  forced: boolean;
};

const HUBSPOT_SINGLE_SEND_URL =
  'https://api.hubapi.com/marketing/v3/transactional/single-email/send';
const HUBSPOT_TIMEOUT_MS = 10_000;

const has = (name: string): boolean => Boolean(process.env[name]?.trim());

/** Pure env inspection — safe for config-health (no network, no side effects). */
export function resolveEmailProvider(): ResolvedProvider {
  const forced = (process.env.EMAIL_PROVIDER ?? '').trim().toLowerCase();
  const hubspotReady = has('HUBSPOT_PRIVATE_APP_TOKEN') && has('HUBSPOT_TRANSACTIONAL_EMAIL_ID');
  const resendReady = has('RESEND_API_KEY');

  if (forced === 'hubspot') {
    return hubspotReady
      ? { provider: 'hubspot', reason: 'EMAIL_PROVIDER=hubspot', forced: true }
      : {
          provider: 'none',
          reason:
            'EMAIL_PROVIDER=hubspot but HUBSPOT_PRIVATE_APP_TOKEN and/or HUBSPOT_TRANSACTIONAL_EMAIL_ID are unset',
          forced: true,
        };
  }
  if (forced === 'resend') {
    return resendReady
      ? { provider: 'resend', reason: 'EMAIL_PROVIDER=resend', forced: true }
      : { provider: 'none', reason: 'EMAIL_PROVIDER=resend but RESEND_API_KEY is unset', forced: true };
  }
  if (forced && forced !== 'auto') {
    // Unknown value — fall through to auto but say so, rather than guessing.
    return resolveAuto(hubspotReady, resendReady, `EMAIL_PROVIDER="${forced}" is not recognised; auto-detected `);
  }
  return resolveAuto(hubspotReady, resendReady, '');
}

function resolveAuto(hubspotReady: boolean, resendReady: boolean, prefix: string): ResolvedProvider {
  if (hubspotReady) {
    return { provider: 'hubspot', reason: `${prefix}HubSpot single-send env vars present`, forced: false };
  }
  if (resendReady) {
    return { provider: 'resend', reason: `${prefix}RESEND_API_KEY present`, forced: false };
  }
  return {
    provider: 'none',
    reason: `${prefix}neither HubSpot (HUBSPOT_PRIVATE_APP_TOKEN + HUBSPOT_TRANSACTIONAL_EMAIL_ID) nor Resend (RESEND_API_KEY) is configured`,
    forced: false,
  };
}

// Once-per-process guard: a missing provider is one deployment problem, not
// one Sentry issue per email. Module state is fine — a fresh lambda re-warns.
let warnedNoProvider = false;

export async function sendEmail(msg: EmailMessage): Promise<SendResult> {
  const resolved = resolveEmailProvider();

  if (resolved.provider === 'none') {
    const error = `email: no provider configured (${resolved.reason})`;
    if (!warnedNoProvider) {
      warnedNoProvider = true;
      console.error(`[email] ${error} — dropping "${msg.subject}" to ${msg.to}. See docs/EMAIL.md.`);
      Sentry.captureMessage('email: no provider configured', {
        level: 'error',
        tags: { area: 'email', provider: 'none' },
        extra: { reason: resolved.reason, firstDroppedSubject: msg.subject },
      });
    }
    return { ok: false, provider: 'none', error };
  }

  try {
    return resolved.provider === 'hubspot' ? await sendViaHubspot(msg) : await sendViaResend(msg);
  } catch (err) {
    // Belt and braces — the provider functions catch their own errors, but
    // the contract is "never throws" so make it structurally true.
    const error = err instanceof Error ? err.message : String(err);
    return { ok: false, provider: resolved.provider, error };
  }
}

// ── HubSpot ──────────────────────────────────────────────────────────────────
//
// Request shape verified against HubSpot's OpenAPI spec
// (PublicApiSpecs/Marketing/Transactional Single Send/.../v3/transactionalSingleSend.json):
//   POST https://api.hubapi.com/marketing/v3/transactional/single-email/send
//   scope: transactional-email
//   { emailId: int64 (required),
//     message: { to: string (required), from?: string, sendId?: string,
//                replyTo?: string[], cc?: string[], bcc?: string[] },
//     contactProperties?: Record<string,string>,
//     customProperties?: Record<string, unknown> }   → {{ custom.NAME }} in HubL
// Response: { statusId, status: PENDING|PROCESSING|CANCELED|COMPLETE,
//             requestedAt, sendResult?: SENT|QUEUED|INVALID_TO_ADDRESS|… }

type HubspotSendResponse = {
  statusId?: string;
  status?: string;
  sendResult?: string;
  eventId?: { id?: string };
  message?: string;
};

// sendResult values that mean "accepted". Anything else present on a 2xx is
// HubSpot telling us the send was dropped (opted-out, invalid address, bad
// from-domain…), so it is reported as a failure rather than swallowed.
const HUBSPOT_OK_RESULTS = new Set(['SENT', 'QUEUED']);

async function sendViaHubspot(msg: EmailMessage): Promise<SendResult> {
  const token = process.env.HUBSPOT_PRIVATE_APP_TOKEN!.trim();
  const emailId = Number(process.env.HUBSPOT_TRANSACTIONAL_EMAIL_ID);
  if (!Number.isInteger(emailId) || emailId <= 0) {
    const error = `HubSpot: HUBSPOT_TRANSACTIONAL_EMAIL_ID must be the numeric id of the transactional email (got "${process.env.HUBSPOT_TRANSACTIONAL_EMAIL_ID}")`;
    captureHubspotFailure(error, msg);
    return { ok: false, provider: 'hubspot', error };
  }

  // HubSpot single-send cannot carry attachments. Surface them as a footer so
  // the recipient still knows what they would have received, with a link when
  // the caller can offer one (events pass their public .ics URL in tags.icsUrl).
  const html = msg.attachments?.length ? msg.html + attachmentsFooter(msg) : msg.html;

  const body = {
    emailId,
    message: {
      to: msg.to,
      from: msg.from ?? DEFAULT_FROM,
      ...(msg.replyTo ? { replyTo: [msg.replyTo] } : {}),
    },
    customProperties: {
      subject: msg.subject,
      body_html: html,
      preheader: preheaderFrom(msg.text),
    },
  };

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), HUBSPOT_TIMEOUT_MS);
  try {
    const res = await fetch(HUBSPOT_SINGLE_SEND_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
      signal: controller.signal,
    });

    if (!res.ok) {
      const detail = (await res.text().catch(() => '')).slice(0, 200);
      const error = `HubSpot ${res.status}: ${detail}`;
      captureHubspotFailure(error, msg, { status: res.status });
      return { ok: false, provider: 'hubspot', error };
    }

    const json = (await res.json().catch(() => null)) as HubspotSendResponse | null;
    if (json?.sendResult && !HUBSPOT_OK_RESULTS.has(json.sendResult)) {
      const error = `HubSpot sendResult ${json.sendResult}${json.message ? `: ${json.message.slice(0, 200)}` : ''}`;
      captureHubspotFailure(error, msg, { status: res.status, sendResult: json.sendResult });
      return { ok: false, provider: 'hubspot', error };
    }
    return { ok: true, provider: 'hubspot', id: json?.statusId ?? json?.eventId?.id };
  } catch (err) {
    const aborted = err instanceof Error && err.name === 'AbortError';
    const error = aborted
      ? `HubSpot: timed out after ${HUBSPOT_TIMEOUT_MS / 1000}s`
      : `HubSpot: ${err instanceof Error ? err.message : String(err)}`;
    captureHubspotFailure(error, msg);
    return { ok: false, provider: 'hubspot', error };
  } finally {
    clearTimeout(timer);
  }
}

function captureHubspotFailure(error: string, msg: EmailMessage, extra: Record<string, unknown> = {}) {
  console.error(`[email] ${error} (subject="${msg.subject}")`);
  Sentry.captureMessage('email: hubspot send failed', {
    level: 'error',
    tags: { area: 'email', provider: 'hubspot' },
    extra: { error, subject: msg.subject, ...extra },
  });
}

function preheaderFrom(text: string | undefined): string {
  return (text ?? '').replace(/\s+/g, ' ').trim().slice(0, 140);
}

function attachmentsFooter(msg: EmailMessage): string {
  const icsUrl = msg.tags?.icsUrl && /^https?:\/\//i.test(msg.tags.icsUrl) ? msg.tags.icsUrl : null;
  const items = (msg.attachments ?? [])
    .map((a) => {
      const name = escapeHtml(a.filename);
      const isIcs = /\.ics$/i.test(a.filename) || a.contentType === 'text/calendar';
      return isIcs && icsUrl
        ? `<li><a href="${escapeHtml(icsUrl)}" style="color:#0D3F48;">${name}</a> — add to your calendar</li>`
        : `<li>${name}</li>`;
    })
    .join('');
  return `
<div style="margin-top:24px;padding-top:16px;border-top:1px solid #E6E1D2;font-size:13px;color:#4A6A70;">
  <p style="margin:0 0 6px;font-weight:600;">Attachments</p>
  <ul style="margin:0;padding-left:18px;">${items}</ul>
</div>`;
}

// ── Resend (fallback) ────────────────────────────────────────────────────────
//
// The SDK reports API failures as `{ error }` rather than throwing, so that is
// checked explicitly — a swallowed 403 (unverified domain, revoked key) once
// recorded an ops handoff as sent when nothing went out.

async function sendViaResend(msg: EmailMessage): Promise<SendResult> {
  const resend = getResend();
  if (!resend) {
    return { ok: false, provider: 'resend', error: 'Resend: RESEND_API_KEY unset' };
  }
  try {
    const { data, error } = await resend.emails.send({
      from: msg.from ?? DEFAULT_FROM,
      to: msg.to,
      subject: msg.subject,
      html: msg.html,
      text: msg.text,
      replyTo: msg.replyTo,
      attachments: msg.attachments?.map((a) => ({
        filename: a.filename,
        content: a.content,
        contentType: a.contentType,
      })),
      tags: resendSafeTags(msg.tags),
    });
    if (error) {
      const message = `Resend ${error.name}: ${error.message}`;
      console.error(`[email] ${message} (subject="${msg.subject}")`);
      Sentry.captureMessage('email: resend send failed', {
        level: 'error',
        tags: { area: 'email', provider: 'resend' },
        extra: { error: message, subject: msg.subject },
      });
      return { ok: false, provider: 'resend', error: message };
    }
    return { ok: true, provider: 'resend', id: data?.id };
  } catch (err) {
    const message = `Resend: ${err instanceof Error ? err.message : String(err)}`;
    console.error(`[email] ${message} (subject="${msg.subject}")`);
    Sentry.captureMessage('email: resend send failed', {
      level: 'error',
      tags: { area: 'email', provider: 'resend' },
      extra: { error: message, subject: msg.subject },
    });
    return { ok: false, provider: 'resend', error: message };
  }
}

// Resend only accepts ASCII letters, numbers, underscores and dashes in tag
// names/values (a URL like icsUrl would fail the whole send), so forward only
// the tags that qualify.
function resendSafeTags(tags: Record<string, string> | undefined) {
  if (!tags) return undefined;
  const safe = /^[A-Za-z0-9_-]+$/;
  const out = Object.entries(tags)
    .filter(([k, v]) => safe.test(k) && safe.test(v))
    .map(([name, value]) => ({ name, value }));
  return out.length ? out : undefined;
}
