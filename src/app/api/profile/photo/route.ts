// POST /api/profile/photo — upload a profile photo for the signed-in user.
//
// multipart/form-data: { file: File }
//
// On success:
//   1. Uploads the file to Payload's `media` collection (Vercel Blob in
//      prod, local public/media in dev).
//   2. Updates user_profiles.photo_url to the resolved public URL.
//   3. Returns { photoUrl }.
//
// Failures are returned with a JSON error and a 4xx/5xx status. The
// caller (ProfileForm "Upload photo" button) shows the error message.

import { NextRequest, NextResponse } from 'next/server';
import { eq, sql } from 'drizzle-orm';
import { getPayload } from 'payload';
import config from '@payload-config';
import * as Sentry from '@sentry/nextjs';
import { withAuth } from '@workos-inc/authkit-nextjs';
import { ensureUserRecord } from '@/lib/auth/ensure-user-record';
import { getDb } from '@/lib/db';
import { userProfiles } from '@/lib/db/schema';

export const runtime = 'nodejs';

const MAX_BYTES = 4 * 1024 * 1024; // 4 MB
const ALLOWED_MIME = new Set(['image/jpeg', 'image/png', 'image/webp']);

export async function POST(req: NextRequest) {
  const { user } = await withAuth();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Idempotent — ensures a row exists to UPDATE against.
  await ensureUserRecord({
    id: user.id,
    firstName: user.firstName,
    lastName: user.lastName,
    email: user.email,
  });

  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return NextResponse.json({ error: 'Invalid form body' }, { status: 400 });
  }

  const file = form.get('file');
  if (!(file instanceof File)) {
    return NextResponse.json({ error: 'Missing file field' }, { status: 400 });
  }
  if (file.size === 0) {
    return NextResponse.json({ error: 'Empty file' }, { status: 400 });
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: 'File too large (max 4 MB)' }, { status: 413 });
  }
  if (!ALLOWED_MIME.has(file.type)) {
    return NextResponse.json(
      { error: 'Unsupported type — use JPEG, PNG or WebP' },
      { status: 415 },
    );
  }

  try {
    const buffer = Buffer.from(await file.arrayBuffer());
    const payload = await getPayload({ config });

    // Use a stable filename per user so re-uploads overwrite cleanly in
    // Vercel Blob. Payload appends a hash if a collision occurs anyway.
    const ext = file.type === 'image/png' ? 'png' : file.type === 'image/webp' ? 'webp' : 'jpg';
    const filename = `avatar-${user.id}.${ext}`;

    const media = await payload.create({
      collection: 'media',
      data: { alt: `Profile photo for ${user.email ?? user.id}` },
      file: {
        data: buffer,
        mimetype: file.type,
        name: filename,
        size: buffer.length,
      },
    });

    const photoUrl = (media as { url?: string | null }).url ?? null;
    if (!photoUrl) {
      throw new Error('Media upload returned no URL');
    }

    await getDb()
      .update(userProfiles)
      .set({ photoUrl, updatedAt: sql`now()` })
      .where(eq(userProfiles.userId, user.id));

    return NextResponse.json({ photoUrl });
  } catch (err) {
    console.error('[api.profile.photo] upload failed', err);
    Sentry.captureException(err, { tags: { area: 'api.profile.photo' } });
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 });
  }
}
