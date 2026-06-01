-- Profile photo URL. Populated by POST /api/profile/photo, which uploads
-- the file to Payload's Media collection and stores the resolved public
-- URL here. Null until the user uploads a photo; UI falls back to
-- initials, so existing rows need no backfill.

ALTER TABLE "user_profiles"
  ADD COLUMN IF NOT EXISTS "photo_url" text;
