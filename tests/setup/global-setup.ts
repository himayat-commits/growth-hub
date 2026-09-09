// Playwright global setup — runs once before any test file.
// Seeds the test user's database rows (subscriptions + user_profiles) so
// the onboarding layout finds an active subscription and the profile page
// has a row to read.
//
// Requires DATABASE_URL and PLAYWRIGHT_TEST_TOKEN in the environment.
// Load .env.local before running (playwright.config.ts does this via dotenv).

import * as dotenv from 'dotenv';
import * as path from 'path';
import { assertSafeDatabaseTarget } from '../../scripts/_guard.mjs';

// Load local env before doing anything else so DATABASE_URL is available.
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

export const TEST_USER_ID = 'user_playwright_001';
export const TEST_EMAIL   = 'playwright@test.himayat.com.au';

export default async function globalSetup() {
  if (!process.env.DATABASE_URL) {
    throw new Error('[global-setup] DATABASE_URL is not set — cannot seed test user.');
  }
  if (!process.env.PLAYWRIGHT_TEST_TOKEN) {
    throw new Error('[global-setup] PLAYWRIGHT_TEST_TOKEN is not set.');
  }

  // Refuse to seed into production — the handoff .env.local points there.
  // Point DATABASE_URL at a Neon branch (STAGING.md §1) or set ALLOW_PROD=1.
  assertSafeDatabaseTarget('tests/setup/global-setup.ts (Playwright test-user seed)');

  // Dynamic import after env is loaded.
  const { neon } = await import('@neondatabase/serverless');
  const sql = neon(process.env.DATABASE_URL);

  // Upsert subscription row — active foundations plan with 1-year expiry.
  await sql`
    INSERT INTO subscriptions (
      user_id, email,
      plan_tier, subscription_status,
      current_period_end, cancel_at_period_end,
      created_at, updated_at
    )
    VALUES (
      ${TEST_USER_ID}, ${TEST_EMAIL},
      'foundations', 'active',
      NOW() + INTERVAL '1 year', false,
      NOW(), NOW()
    )
    ON CONFLICT (user_id) DO UPDATE SET
      subscription_status  = 'active',
      plan_tier            = 'foundations',
      current_period_end   = NOW() + INTERVAL '1 year',
      updated_at           = NOW()
  `;

  // Upsert user_profiles row — minimal, profile_complete_pct = 0.
  await sql`
    INSERT INTO user_profiles (
      user_id, profile_complete_pct, created_at, updated_at
    )
    VALUES (
      ${TEST_USER_ID}, 0, NOW(), NOW()
    )
    ON CONFLICT (user_id) DO NOTHING
  `;

  console.log(`[global-setup] Test user ${TEST_USER_ID} seeded ✓`);
}
