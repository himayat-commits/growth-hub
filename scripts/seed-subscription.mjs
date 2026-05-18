// One-off: seed a fake subscription row for testing the portal/dashboard as a
// subscribed user. Run with: node --env-file=.env.local scripts/seed-subscription.mjs
import { neon } from '@neondatabase/serverless';

const USER_ID = process.env.SEED_USER_ID ?? 'user_01KRQTPFAY0Q9VJHFAD084MCHK';
const EMAIL = process.env.SEED_EMAIL ?? 'waheed@himayat.com.au';
const TIER = process.env.SEED_TIER ?? 'accelerate'; // foundations | growth | accelerate
const INTERVAL = process.env.SEED_INTERVAL ?? 'month'; // month | year

if (!process.env.DATABASE_URL) {
  console.error('DATABASE_URL is not set');
  process.exit(1);
}

const sql = neon(process.env.DATABASE_URL);

// Upsert so re-running the script just refreshes the period end.
const periodEnd = new Date('2027-12-31T23:59:59Z');

const result = await sql`
  INSERT INTO subscriptions (
    user_id, email, plan_tier, billing_interval,
    subscription_status, current_period_end, cancel_at_period_end,
    add_on_price_ids, created_at, updated_at
  ) VALUES (
    ${USER_ID}, ${EMAIL}, ${TIER}, ${INTERVAL},
    'active', ${periodEnd}, false,
    '{}', NOW(), NOW()
  )
  ON CONFLICT (user_id) DO UPDATE SET
    plan_tier = EXCLUDED.plan_tier,
    billing_interval = EXCLUDED.billing_interval,
    subscription_status = 'active',
    current_period_end = EXCLUDED.current_period_end,
    cancel_at_period_end = false,
    updated_at = NOW()
  RETURNING user_id, email, plan_tier, billing_interval, subscription_status, current_period_end;
`;

console.log('Seeded subscription:', result[0]);
