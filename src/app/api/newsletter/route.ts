// POST /api/newsletter — add an email to the Growth Hub Resend audience.
//
// Body: { email: string, source?: string, hp?: string }
//   - `email` is the only required field.
//   - `source` is a free-text marker we send to Resend as a contact note
//     (e.g. "home-footer", "events-hub") so we can attribute signups later.
//   - `hp` is a honeypot: if non-empty the request came from a bot — we
//     respond 200 OK without doing anything so the bot thinks it worked.
//
// Env:
//   RESEND_API_KEY        already used elsewhere in the project
//   RESEND_AUDIENCE_ID    Resend audience to add contacts to. Without it
//                         the endpoint returns 503 so dev/preview don't
//                         silently swallow signups.

import { NextResponse } from 'next/server';
import { Resend } from 'resend';
import * as Sentry from '@sentry/nextjs';

export const runtime = 'nodejs';

// Loose email pattern. We deliberately avoid a strict RFC 5322 regex —
// Resend will reject genuinely malformed addresses on its side.
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(req: Request) {
  let body: { email?: unknown; source?: unknown; hp?: unknown } = {};
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  // Honeypot — bots fill hidden fields; humans don't. Pretend success.
  if (typeof body.hp === 'string' && body.hp.trim().length > 0) {
    return NextResponse.json({ ok: true });
  }

  const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
  const source = typeof body.source === 'string' ? body.source.slice(0, 60) : '';
  if (!email || !EMAIL_RE.test(email)) {
    return NextResponse.json({ error: 'Please enter a valid email address.' }, { status: 400 });
  }

  const apiKey = process.env.RESEND_API_KEY;
  const audienceId = process.env.RESEND_AUDIENCE_ID;
  if (!apiKey || !audienceId) {
    // Fail loudly in dev so the operator notices the missing config.
    // Production deploys must have both set in Vercel project env.
    console.error('[newsletter] RESEND_API_KEY or RESEND_AUDIENCE_ID is not set.');
    return NextResponse.json(
      { error: 'Newsletter signup is temporarily unavailable.' },
      { status: 503 },
    );
  }

  try {
    const resend = new Resend(apiKey);
    // Resend treats duplicate-email creates as idempotent (returns the
    // existing contact). No need to check first.
    await resend.contacts.create({
      audienceId,
      email,
      unsubscribed: false,
      // Stash the source in firstName as a marker. Resend doesn't expose
      // arbitrary metadata on contacts yet; this lets us segment later
      // via the dashboard.
      firstName: source ? `[${source}]` : undefined,
    });
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[newsletter] resend contacts.create failed', err);
    Sentry.captureException(err, {
      tags: { area: 'newsletter' },
      extra: { source },
    });
    return NextResponse.json(
      { error: 'Could not subscribe right now — try again in a moment.' },
      { status: 500 },
    );
  }
}
