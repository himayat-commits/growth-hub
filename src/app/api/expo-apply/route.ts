// POST /api/expo-apply — submit a stallholder / facilitator / speaker
// application to the Expo HubSpot form via the unauthenticated Forms-submit
// endpoint. Mirrors src/app/api/newsletter/route.ts: same region resolution,
// honeypot, and Sentry handling. We submit through the *form* (not the
// Contacts API) so the form's lifecycle / list / workflow automations fire
// exactly as if the embedded HubSpot form had been used.
//
// The custom multi-step UI on /expo/apply gathers richer, role-specific
// answers than the HubSpot form has fields for, so the client composes those
// answers into the three existing textarea properties
// (expo_stall_details / expo_workshop_details / expo_speaker_details). This
// route just validates the essentials and forwards a flat field set — no new
// HubSpot properties required.
//
// The portal / form id / region are hardcoded below (they're public, stable,
// and point at one place). They used to come from NEXT_PUBLIC_* env vars, but a
// stale value baked into the production build silently broke every submission
// (HubSpot returned 4xx), so the route no longer depends on per-env config.

import { NextResponse } from 'next/server';
import * as Sentry from '@sentry/nextjs';

export const runtime = 'nodejs';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const ROLES = ['host_a_stall', 'run_a_workshop', 'help_desk_advisory'] as const;
type Role = (typeof ROLES)[number];
const ROLE_LABELS: Record<Role, string> = {
  host_a_stall: 'Host a stall',
  run_a_workshop: 'Run a workshop',
  help_desk_advisory: 'Help desk or advisory support',
};

type Body = {
  firstname?: unknown;
  lastname?: unknown;
  email?: unknown;
  phone?: unknown;
  company?: unknown;
  website?: unknown;
  roles?: unknown;
  expo_stall_details?: unknown;
  expo_workshop_details?: unknown;
  expo_speaker_details?: unknown;
  message?: unknown;
  hp?: unknown; // honeypot
};

const str = (v: unknown, max = 5000) =>
  typeof v === 'string' ? v.trim().slice(0, max) : '';

export async function POST(req: Request) {
  let body: Body = {};
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  // Honeypot — bots fill hidden fields. Pretend success silently.
  if (typeof body.hp === 'string' && body.hp.trim().length > 0) {
    return NextResponse.json({ ok: true });
  }

  const firstname = str(body.firstname, 80);
  const lastname = str(body.lastname, 80);
  const email = str(body.email, 160).toLowerCase();
  const company = str(body.company, 160);
  const website = str(body.website, 300);
  const message = str(body.message);
  const phoneRaw = str(body.phone, 40);
  // Only forward a phone if it carries enough digits to pass HubSpot's
  // phone validation (min 7), otherwise drop it so a half-typed number
  // doesn't 400 the whole submission.
  const phone = phoneRaw.replace(/\D/g, '').length >= 7 ? phoneRaw : '';

  const roles = Array.isArray(body.roles)
    ? (body.roles.filter((r): r is Role => ROLES.includes(r as Role)))
    : [];

  // Validation — keep messages user-facing and specific.
  if (!firstname || !lastname) {
    return NextResponse.json({ error: 'Please add your first and last name.' }, { status: 400 });
  }
  if (!email || !EMAIL_RE.test(email)) {
    return NextResponse.json({ error: 'Please enter a valid email address.' }, { status: 400 });
  }
  if (!company) {
    return NextResponse.json({ error: 'Please tell us your business or organisation.' }, { status: 400 });
  }
  if (roles.length === 0) {
    return NextResponse.json({ error: 'Pick at least one way to take part.' }, { status: 400 });
  }

  // Canonical, public IDs for the single "Entrepreneurship for Everyone" expo
  // form (portal 442026767, ap1 region). Hardcoded on purpose — see header note.
  // If the form is ever recreated, update FORM_ID.
  const portalId = '442026767';
  const formId = '8ba43f7c-6040-49f5-8544-238cfddac10e';
  const url = `https://api-ap1.hsforms.com/submissions/v3/integration/submit/${portalId}/${formId}`;

  // Build the flat field set. Only include detail textareas for roles the
  // applicant actually chose. HubSpot checkbox fields take their values as a
  // single ';'-separated string.
  const fields: { objectTypeId: string; name: string; value: string }[] = [
    { objectTypeId: '0-1', name: 'firstname', value: firstname },
    { objectTypeId: '0-1', name: 'lastname', value: lastname },
    { objectTypeId: '0-1', name: 'email', value: email },
    { objectTypeId: '0-1', name: 'company', value: company },
    // The expo_involvement contact property stores its options by *label*
    // (e.g. "Host a stall"), not the snake_case ids the form field uses — and
    // the integration endpoint writes straight to the property, so we must
    // send the labels. Multi-checkbox values are ';'-separated.
    { objectTypeId: '0-1', name: 'expo_involvement', value: roles.map((r) => ROLE_LABELS[r]).join(';') },
  ];
  if (phone) fields.push({ objectTypeId: '0-1', name: 'phone', value: phone });
  if (website) fields.push({ objectTypeId: '0-1', name: 'website', value: website });
  const stallDetails = roles.includes('host_a_stall') ? str(body.expo_stall_details) : '';
  const workshopDetails = roles.includes('run_a_workshop') ? str(body.expo_workshop_details) : '';
  // Help desk / advisory answers reuse the existing expo_speaker_details
  // property (relabelled in HubSpot) — see scripts/update-expo-advisory.mjs.
  const advisoryDetails = roles.includes('help_desk_advisory') ? str(body.expo_speaker_details) : '';
  if (stallDetails) fields.push({ objectTypeId: '0-1', name: 'expo_stall_details', value: stallDetails });
  if (workshopDetails) fields.push({ objectTypeId: '0-1', name: 'expo_workshop_details', value: workshopDetails });
  if (advisoryDetails) fields.push({ objectTypeId: '0-1', name: 'expo_speaker_details', value: advisoryDetails });
  if (message) fields.push({ objectTypeId: '0-1', name: 'message', value: message });

  const payload = {
    fields,
    context: {
      pageUri: 'growth-hub:expo-apply',
      pageName: 'Expo application (Entrepreneurship for Everyone)',
    },
  };

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const detail = await res.text().catch(() => '');
      console.warn('[expo-apply] HubSpot rejected submission', res.status, detail.slice(0, 300));
      if (res.status >= 400 && res.status < 500) {
        return NextResponse.json(
          { error: 'Something in the form looked off — check your details and try again.' },
          { status: 400 },
        );
      }
      throw new Error(`HubSpot ${res.status}: ${detail.slice(0, 120)}`);
    }

    // Submission notifications are handled by HubSpot's native form
    // notifications (configured in the form's Options), since this submits
    // through the form itself.
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[expo-apply] HubSpot submit failed', err);
    Sentry.captureException(err, {
      tags: { area: 'expo-apply', provider: 'hubspot' },
      extra: { roles: roles.join(',') },
    });
    return NextResponse.json(
      { error: 'Could not send your application right now — try again in a moment.' },
      { status: 500 },
    );
  }
}
