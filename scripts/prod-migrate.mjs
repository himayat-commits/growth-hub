// Runs pending Drizzle migrations during Vercel *production* builds only.
//
// Why this exists: migrations were applied manually and once got silently
// skipped (a journal entry with no .sql file made `drizzle-kit migrate` bail),
// leaving prod's schema behind the deployed code — the dashboard crashed on a
// missing `user_profiles.photo_url` column. Running migrate as part of the
// production build keeps the schema in lockstep with what we ship.
//
// NOTE: Payload (CMS) migrations are deliberately NOT run here. `payload migrate`
// is interactive on this project — the payload_migrations table isn't populated
// (Payload schema was applied out-of-band), so it prompts about "dev mode /
// dynamically pushed" changes and hangs forever in CI. Payload schema changes
// are applied manually (raw SQL) against the DB instead.
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
  console.log('[prod-migrate] Drizzle migrations applied');
} else {
  console.log(`[prod-migrate] VERCEL_ENV=${env} → skipping migrations (non-production build)`);
}
