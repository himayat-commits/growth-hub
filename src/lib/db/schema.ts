import { pgTable, text, timestamp, varchar, boolean } from 'drizzle-orm/pg-core';

/**
 * Mirrors the canonical state of a user's Stripe subscription.
 *
 * Stripe is the source of truth — this table is updated by webhook events
 * via syncSubscription() in app/api/stripe/webhook/route.ts.
 */
export const subscriptions = pgTable('subscriptions', {
  // Clerk user id (e.g. "user_2abc...") — primary key, no separate users table needed.
  userId: text('user_id').primaryKey(),
  email: text('email').notNull(),

  // Stripe identifiers
  stripeCustomerId: text('stripe_customer_id').unique(),
  stripeSubscriptionId: text('stripe_subscription_id').unique(),
  stripePriceId: text('stripe_price_id'),

  // Denormalized convenience fields, derived from stripePriceId via lib/plans.ts
  planTier: varchar('plan_tier', { length: 20 }), // 'foundations' | 'growth' | 'accelerate'
  billingInterval: varchar('billing_interval', { length: 10 }), // 'month' | 'year'

  // Stripe subscription state
  subscriptionStatus: varchar('subscription_status', { length: 20 }),
  // active | trialing | past_due | canceled | unpaid | incomplete | incomplete_expired | paused

  currentPeriodEnd: timestamp('current_period_end', { withTimezone: true }),
  cancelAtPeriodEnd: boolean('cancel_at_period_end').default(false).notNull(),

  // Add-on price IDs currently on the subscription (e.g. Search AI, Referrals)
  addOnPriceIds: text('add_on_price_ids').array().default([]).notNull(),

  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

export type Subscription = typeof subscriptions.$inferSelect;
export type NewSubscription = typeof subscriptions.$inferInsert;
