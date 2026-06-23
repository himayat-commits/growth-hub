// Runs pending migrations during Vercel *production* builds only.
//
// Two migration systems run here, in order:
//   1. Drizzle (public schema — subscriptions, user_profiles, event_rsvps, …)
//   2. Payload (payload schema — CMS collections + globals like site_settings)
// Both are tracked + idempotent, so already-applied migrations are skipped.
//
// Why this exists: migrations were applied manually and once got silently
// skipped (a journal entry with no .sql file made `drizzle-kit migrate` bail),
// leaving prod's schema behind the deployed code — the dashboard crashed on a
// missing `user_profiles.photo_url` column. Running migrate as part of the
// production build keeps the schema in lockstep with what we ship. Payload
// migrations used to be applied by hand; that drifted too (e.g. a new global
// field would deploy before its column existed and break CMS reads), so they
// run here as well.
//
// Only production builds migrate. Preview/dev builds skip it so they never
// mutate the shared database (DATABASE_URL is the same for Preview & Production).
// If migrate fails, the build fails — we'd rather block the deploy than ship
// code that expects a schema the database doesn't have yet.

import { execSync } from 'node:child_process';

const env = process.env.VERCEL_ENV ?? '(unset)';

if (env === 'production') {
  console.log('[prod-migrate] VERCEL_ENV=production → running Drizzle migrations');
  execSync('npx drizzle-kit migrate', { stdio: 'inherit' });
  console.log('[prod-migrate] Drizzle migrations applied → running Payload migrations');
  execSync('npx payload migrate', { stdio: 'inherit' });
  console.log('[prod-migrate] Payload migrations applied');
} else {
  console.log(`[prod-migrate] VERCEL_ENV=${env} → skipping migrations (non-production build)`);
}
