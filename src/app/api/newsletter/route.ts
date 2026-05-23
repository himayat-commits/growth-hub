// POST /api/newsletter — add an email to HubSpot via the Forms API.
//
// Body: { email: string, source?: string, hp?: string }
//   - `email`  required
//   - `source` free-text marker (e.g. "home-footer", "events-hub").
//              Sent to HubSpot as the standard `hs_analytics_source_data_1`
//              context field so it shows up in the contact record without
//              needing a custom property.
//   - `hp`     honeypot. Non-empty → silent 200 (bot signal).
//
// Env (set in Vercel):
//   HUBSPOT_PORTAL_ID  numeric portal id (visible in any HubSpot URL)
//   HUBSPOT_FORM_ID    GUID of the newsletter form (HubSpot → Marketing
//                       → Forms → ⋮ → "Share" → embed code)
//
// We deliberately use the unauthenticated Forms-submit endpoint rather
// than the Contacts API: it reuses the form's lifecycle / list-add /
// workflow automations exactly as if the user submitted the embedded
// form themselves. No private app token required, no risk of bypassing
// configured form rules.

import { NextResponse } from 'next/server';
import * as Sentry from '@sentry/nextjs';

export const runtime = 'nodejs';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(req: Request) {
  let body: { email?: unknown; source?: unknown; hp?: unknown } = {};
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  // Honeypot — bots fill hidden fields. Return success silently.
  if (typeof body.hp === 'string' && body.hp.trim().length > 0) {
    return NextResponse.json({ ok: true });
  }

  const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
  const source = typeof body.source === 'string' ? body.source.slice(0, 60) : '';
  if (!email || !EMAIL_RE.test(email)) {
    return NextResponse.json({ error: 'Please enter a valid email address.' }, { status: 400 });
  }

  const portalId = process.env.HUBSPOT_PORTAL_ID;
  const formId = process.env.HUBSPOT_FORM_ID;
  if (!portalId || !formId) {
    console.error('[newsletter] HUBSPOT_PORTAL_ID or HUBSPOT_FORM_ID is not set.');
    return NextResponse.json(
      { error: 'Newsletter signup is temporarily unavailable.' },
      { status: 503 },
    );
  }

  const url = `https://api.hsforms.com/submissions/v3/integration/submit/${portalId}/${formId}`;
  const payload = {
    fields: [
      // objectTypeId 0-1 = Contact. HubSpot's submission API expects the
      // contact's email as a standard property.
      { objectTypeId: '0-1', name: 'email', value: email },
    ],
    context: {
      // pageUri / pageName show up on the contact's form-submission
      // history in HubSpot. Source goes into hs_analytics_source_data_1
      // so we can segment in HubSpot lists by where the email came from.
      pageUri: source ? `growth-hub:${source}` : 'growth-hub:unknown',
      pageName: source ? `Newsletter signup (${source})` : 'Newsletter signup',
      hutk: undefined, // We don't expose HubSpot tracking cookies here.
    },
  };

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      // HubSpot returns 400 for invalid email format / blocked domain /
      // duplicate within a short window. We surface a generic message
      // so the form doesn't leak HubSpot internals.
      const detail = await res.text().catch(() => '');
      console.warn('[newsletter] HubSpot rejected submission', res.status, detail.slice(0, 200));
      // Treat HubSpot's "already exists" / "INVALID_EMAIL" responses as
      // a 4xx the user should see, but anything else is a server problem.
      if (res.status >= 400 && res.status < 500) {
        return NextResponse.json(
          { error: 'That email looks off — try again.' },
          { status: 400 },
        );
      }
      throw new Error(`HubSpot ${res.status}: ${detail.slice(0, 120)}`);
    }
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[newsletter] HubSpot submit failed', err);
    Sentry.captureException(err, {
      tags: { area: 'newsletter', provider: 'hubspot' },
      extra: { source },
    });
    return NextResponse.json(
      { error: 'Could not subscribe right now — try again in a moment.' },
      { status: 500 },
    );
  }
}
