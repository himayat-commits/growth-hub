-- Per-user strategist assignment. Slug (text) references payload.strategists.slug
-- — kept loose because Payload tables live in a different schema and renames
-- are rare. Orphan slugs are tolerated by the UI (falls back to "Growth Hub Team").
--
-- Backfill is intentionally NULL for existing users; the round-robin in
-- src/lib/auth/ensure-user-record.ts assigns on next sign-in. Run a one-off
-- backfill SQL after seeding the active Strategist roster if you want
-- pre-feature users assigned immediately.

ALTER TABLE "user_profiles"
  ADD COLUMN IF NOT EXISTS "assigned_strategist_id" text;

CREATE INDEX IF NOT EXISTS "user_profiles_assigned_strategist_idx"
  ON "user_profiles" USING btree ("assigned_strategist_id");
