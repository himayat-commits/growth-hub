// PUT /api/profile — updates the signed-in user's user_profiles row.
//
// Identity (firstName, lastName, email) is intentionally NOT updatable here
// because it lives in WorkOS, not Neon. To change those, the user has to
// go through WorkOS account settings (linked from the profile page).

import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@workos-inc/authkit-nextjs';
import { ensureUserRecord } from '@/lib/auth/ensure-user-record';
import { updateProfile, type ProfileUpdate } from '@/lib/db/profile';

export const runtime = 'nodejs';

const ALLOWED_STAGES = new Set(['idea', 'just-starting', 'running', 'established']);
const ALLOWED_INDUSTRIES = new Set([
  'retail',
  'services',
  'food',
  'creative',
  'trades',
  'other',
]);
const ALLOWED_HELP_AREAS = new Set([
  'website',
  'marketing',
  'branding',
  'pricing',
  'systems',
  'funding',
  'confidence',
]);
const ALLOWED_LANGUAGES = new Set(['en', 'ar', 'ne', 'ur']);

function parseUpdate(body: unknown): { ok: true; data: ProfileUpdate } | { ok: false; error: string } {
  if (!body || typeof body !== 'object') {
    return { ok: false, error: 'Body must be a JSON object' };
  }
  const b = body as Record<string, unknown>;
  const out: ProfileUpdate = {};

  // Optional text fields — null clears, undefined leaves alone.
  for (const key of ['businessName', 'businessDescription', 'city', 'phone'] as const) {
    if (key in b) {
      const v = b[key];
      if (v === null) {
        out[key] = null;
      } else if (typeof v === 'string') {
        const trimmed = v.trim().slice(0, 500);
        out[key] = trimmed === '' ? null : trimmed;
      } else {
        return { ok: false, error: `${key} must be a string or null` };
      }
    }
  }

  if ('stage' in b) {
    const v = b.stage;
    if (v === null) out.stage = null;
    else if (typeof v === 'string' && ALLOWED_STAGES.has(v)) out.stage = v;
    else return { ok: false, error: 'stage must be one of ' + [...ALLOWED_STAGES].join(', ') };
  }
  if ('industry' in b) {
    const v = b.industry;
    if (v === null) out.industry = null;
    else if (typeof v === 'string' && ALLOWED_INDUSTRIES.has(v)) out.industry = v;
    else
      return {
        ok: false,
        error: 'industry must be one of ' + [...ALLOWED_INDUSTRIES].join(', '),
      };
  }
  if ('preferredLanguage' in b) {
    const v = b.preferredLanguage;
    if (typeof v === 'string' && ALLOWED_LANGUAGES.has(v)) out.preferredLanguage = v;
    else
      return {
        ok: false,
        error: 'preferredLanguage must be one of ' + [...ALLOWED_LANGUAGES].join(', '),
      };
  }
  if ('helpAreas' in b) {
    const v = b.helpAreas;
    if (!Array.isArray(v) || !v.every((x) => typeof x === 'string')) {
      return { ok: false, error: 'helpAreas must be an array of strings' };
    }
    const filtered = (v as string[]).filter((s) => ALLOWED_HELP_AREAS.has(s));
    out.helpAreas = filtered;
  }
  for (const key of [
    'notifBooking',
    'notifLibrary',
    'notifEvents',
    'notifNewsletter',
    'notifReferrals',
  ] as const) {
    if (key in b) {
      const v = b[key];
      if (typeof v !== 'boolean') {
        return { ok: false, error: `${key} must be a boolean` };
      }
      out[key] = v;
    }
  }

  return { ok: true, data: out };
}

export async function PUT(req: NextRequest) {
  const { user } = await withAuth();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Defensive: a sign-in path that bypassed /auth/callback (shouldn't happen
  // in production but possible in dev with stale cookies) would leave the
  // profile row missing. ensureUserRecord is idempotent so we just run it.
  await ensureUserRecord({
    id: user.id,
    firstName: user.firstName,
    lastName: user.lastName,
    email: user.email,
  });

  const body = await req.json().catch(() => null);
  const parsed = parseUpdate(body);
  if (!parsed.ok) {
    return NextResponse.json({ error: parsed.error }, { status: 400 });
  }

  const updated = await updateProfile(
    {
      id: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
    },
    parsed.data,
  );

  return NextResponse.json({ profile: updated });
}
