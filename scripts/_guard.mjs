// Shared production-write guard for one-off scripts and the Playwright DB seed.
//
// Why: the handoff `.env.local` points at the PRODUCTION Neon database, and
// most scripts under scripts/ run with `node --env-file=.env.local`. Without a
// check, `npm run seed*`, the partner fix-ups and `npm run test:e2e` all write
// straight into prod — the same hazard class as the June schema incident.
//
// How: refuse to continue when DATABASE_URL is the production Neon endpoint
// (matched on the endpoint id in the hostname — an identifier, not a secret)
// or when Vercel says this is a production build, unless the operator has set
// ALLOW_PROD=1 deliberately.
//
// Usage (call before anything opens a connection):
//   import { assertSafeDatabaseTarget } from './_guard.mjs';
//   assertSafeDatabaseTarget('scripts/seed.ts');
//
// scripts/prod-migrate.mjs intentionally does NOT use this — it exists to run
// Drizzle migrations during the Vercel production build.

/** Endpoint id of the production Neon project (appears in the pooled and
 *  direct hostnames, e.g. `ep-purple-sunset-a73qvzh0-pooler.<region>.aws.neon.tech`). */
export const PROD_NEON_ENDPOINT_ID = 'ep-purple-sunset-a73qvzh0';

/**
 * Returns true when the current environment would write to production.
 * @param {NodeJS.ProcessEnv} [env]
 */
export function isProductionTarget(env = process.env) {
  const url = env.DATABASE_URL ?? '';
  return url.includes(PROD_NEON_ENDPOINT_ID) || env.VERCEL_ENV === 'production';
}

/**
 * Abort the process (exit code 2) when pointed at production and ALLOW_PROD is
 * not '1'. Returns normally otherwise.
 * @param {string} purpose  What is about to run, e.g. 'scripts/seed.ts' —
 *   printed in the refusal so the operator knows which command was blocked.
 */
export function assertSafeDatabaseTarget(purpose) {
  if (!isProductionTarget()) return;
  if (process.env.ALLOW_PROD === '1') {
    console.warn(`[guard] ALLOW_PROD=1 set — ${purpose} will run against PRODUCTION.`);
    return;
  }

  const host = (() => {
    try {
      return new URL(process.env.DATABASE_URL ?? '').host || '(unset)';
    } catch {
      return '(unparseable)';
    }
  })();

  console.error(
    [
      '',
      '┌─ REFUSED: this would write to the PRODUCTION database ─────────────────',
      `│ About to run : ${purpose}`,
      `│ DATABASE_URL : ${host}`,
      `│ VERCEL_ENV   : ${process.env.VERCEL_ENV ?? '(unset)'}`,
      '│',
      '│ The handoff .env.local points at the live Neon database. Seeds, data',
      '│ fix-ups and the Playwright test-user seed must not run against it by',
      '│ accident (see the June 2026 schema incident in scripts/prod-migrate.mjs).',
      '│',
      '│ To run safely: create a Neon branch and point DATABASE_URL at it — see',
      '│ STAGING.md §1. Either edit .env.local or pass a different env file:',
      '│   node --env-file=.env.staging --import tsx/esm scripts/<script>.ts',
      '│',
      '│ To run against production ON PURPOSE, set ALLOW_PROD=1 for this command:',
      '│   PowerShell : $env:ALLOW_PROD="1"; npm run <script>',
      '│   bash/zsh   : ALLOW_PROD=1 npm run <script>',
      '└────────────────────────────────────────────────────────────────────────',
      '',
    ].join('\n'),
  );
  process.exit(2);
}
