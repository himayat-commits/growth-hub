// Event-recap email template — server-only.
//
// Produces a Resend-ready { subject, html, text } payload for the
// post-event nurture email. Used by:
//
//   1. The HubSpot workflow defined in the Tier 2.2 marketing playbook
//      as a *fallback* when an editor wants to send a one-off recap that
//      sits outside the standard nurture sequence (e.g. a small invite-
//      only summit where adding everyone to the HubSpot list is overkill).
//   2. Future automation that fires the recap automatically the day after
//      an event's `date` passes.
//
// Plain HTML — intentionally no @react-email/components dependency. The
// repo already ships Resend (`resend` in package.json) and resend.emails
// .send() accepts a string `html` body directly. Keeping the surface
// minimal trades visual polish for zero new deps and trivial editing.
//
// Brand voice: short, practical, action-oriented. Same tone as the
// homepage hero. No emoji.

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://thegrowthhub.com.au';

export interface EventRecapTemplateInput {
  /** Event title — appears in subject + headline. */
  eventTitle: string;
  /** Date the event ran, e.g. "Wednesday 9 July 2026". */
  eventDateLong: string;
  /** Event slug — used to deep-link back to /events/{slug} so attendees
   *  can share it and the social-proof loop fires. */
  eventSlug: string;
  /** First-name of the recipient when known; falls back to a friendly
   *  generic salutation. */
  recipientFirstName?: string;
  /** 1-2 sentence highlights of what happened. */
  recapHighlights: string;
  /** Optional case-study slug to link to (created by
   *  scripts/draft-case-study-from-event.ts). */
  caseStudySlug?: string;
  /** Optional URL of the post-event photo album / video recap. */
  galleryUrl?: string;
}

export interface RenderedEmail {
  subject: string;
  html: string;
  text: string;
}

/** Render an event recap email. Pure function — no side effects. */
export function eventRecapEmail(input: EventRecapTemplateInput): RenderedEmail {
  const eventUrl = `${SITE_URL}/events/${input.eventSlug}`;
  const caseStudyUrl = input.caseStudySlug
    ? `${SITE_URL}/case-studies/${input.caseStudySlug}`
    : null;
  const greeting = input.recipientFirstName
    ? `Hi ${input.recipientFirstName},`
    : 'Hi there,';

  const subject = `Recap: ${input.eventTitle}`;

  const html = `<!doctype html>
<html lang="en-AU">
<body style="margin:0;padding:0;background:#f3f0e7;font-family:Georgia,'Times New Roman',serif;color:#1f1f1f;line-height:1.55;">
  <div style="max-width:560px;margin:0 auto;padding:32px 24px;">
    <p style="font-size:13px;color:#666;letter-spacing:0.08em;text-transform:uppercase;margin:0 0 24px;">Growth Hub by Himayat</p>

    <h1 style="font-size:28px;line-height:1.15;margin:0 0 16px;">${escapeHtml(input.eventTitle)}</h1>
    <p style="font-size:14px;color:#666;margin:0 0 32px;">${escapeHtml(input.eventDateLong)} · Canberra</p>

    <p style="margin:0 0 20px;">${escapeHtml(greeting)}</p>
    <p style="margin:0 0 20px;">Thanks for being part of <a href="${eventUrl}" style="color:#0D3F48;">${escapeHtml(input.eventTitle)}</a>.</p>

    <p style="margin:0 0 28px;">${escapeHtml(input.recapHighlights)}</p>

    ${
      input.galleryUrl
        ? `<p style="margin:0 0 20px;"><a href="${input.galleryUrl}" style="color:#0D3F48;text-decoration:underline;">Photos &amp; clips from the day →</a></p>`
        : ''
    }
    ${
      caseStudyUrl
        ? `<p style="margin:0 0 20px;"><a href="${caseStudyUrl}" style="color:#0D3F48;text-decoration:underline;">Read the recap on the site →</a></p>`
        : ''
    }

    <hr style="border:none;border-top:1px solid #ddd;margin:36px 0;" />

    <p style="margin:0 0 14px;font-size:14px;">If you found it useful, the Foundations plan keeps the support going year-round — coffee chats, monthly office hours, AI tools for the daily grind.</p>
    <p style="margin:0 0 28px;font-size:14px;">
      <a href="${SITE_URL}/pricing" style="display:inline-block;padding:10px 20px;background:#0D3F48;color:#f3f0e7;text-decoration:none;border-radius:6px;">See Foundations</a>
    </p>

    <p style="margin:0;font-size:12px;color:#999;">Growth Hub by Himayat · Level 4, 1 Moore St, Canberra ACT · <a href="${SITE_URL}" style="color:#999;">thegrowthhub.com.au</a></p>
  </div>
</body>
</html>`;

  // Plaintext fallback — Resend includes it as the multipart text/plain
  // alternative, which matters for some corporate inbox filters that
  // weight HTML-only emails as suspicious.
  const text = [
    input.eventTitle,
    `${input.eventDateLong} · Canberra`,
    '',
    greeting,
    `Thanks for being part of ${input.eventTitle}. ${eventUrl}`,
    '',
    input.recapHighlights,
    '',
    input.galleryUrl ? `Photos & clips: ${input.galleryUrl}` : '',
    caseStudyUrl ? `Read the recap: ${caseStudyUrl}` : '',
    '',
    `Foundations plan: ${SITE_URL}/pricing`,
    '',
    'Growth Hub by Himayat · Level 4, 1 Moore St, Canberra ACT',
    SITE_URL,
  ]
    .filter((line) => line !== '')
    .join('\n');

  return { subject, html, text };
}

// ── Helpers ──────────────────────────────────────────────────────────────

/** Escape user-supplied content before interpolating into the HTML
 *  string. We trust env-var-derived URLs but not field content. */
function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
