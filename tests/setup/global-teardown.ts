// Playwright global teardown — runs once after all test files finish.
// Removes the test user's rows so the database stays clean.

import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

export const TEST_USER_ID = 'user_playwright_001';

export default async function globalTeardown() {
  if (!process.env.DATABASE_URL) return; // skip silently if not configured

  const { neon } = await import('@neondatabase/serverless');
  const sql = neon(process.env.DATABASE_URL);

  // Remove all test data in dependency order.
  await sql`DELETE FROM onboarding_states    WHERE user_id = ${TEST_USER_ID}`;
  await sql`DELETE FROM provisioning_logs    WHERE user_id = ${TEST_USER_ID}`;
  await sql`DELETE FROM provisioning_tasks   WHERE user_id = ${TEST_USER_ID}`;
  await sql`DELETE FROM messages             WHERE user_id = ${TEST_USER_ID}`;
  await sql`DELETE FROM notifications        WHERE user_id = ${TEST_USER_ID}`;
  await sql`DELETE FROM user_profiles        WHERE user_id = ${TEST_USER_ID}`;
  await sql`DELETE FROM subscriptions        WHERE user_id = ${TEST_USER_ID}`;

  console.log(`[global-teardown] Test user ${TEST_USER_ID} cleaned up ✓`);
}
