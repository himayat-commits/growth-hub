import { pgTable, text, timestamp, varchar, boolean, jsonb, serial, integer, index } from 'drizzle-orm/pg-core';

/**
 * Mirrors the canonical state of a user's Stripe subscription.
 *
 * Stripe is the source of truth — this table is updated by webhook events
 * via syncSubscription() in app/api/stripe/webhook/route.ts.
 */
export const subscriptions = pgTable('subscriptions', {
  // WorkOS user id (e.g. "user_01H...") — primary key, no separate users table needed.
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

/**
 * Wizard state for the Birdeye provisioning onboarding flow.
 *
 * One row per WorkOS user. The wizard writes patches here on every step
 * (server-authoritative) so users can resume on any device. The provisioning
 * orchestrator at /api/provision reads the full state from this row when the
 * user clicks "Launch" on the review step.
 */
export const onboardingStates = pgTable('onboarding_states', {
  userId: text('user_id').primaryKey(),
  state: jsonb('state').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

export type OnboardingState = typeof onboardingStates.$inferSelect;
export type NewOnboardingState = typeof onboardingStates.$inferInsert;

/**
 * Append-only audit trail for every Birdeye provisioning API call.
 *
 * Each row is one step in a provisioning run (create_subaccount,
 * update_business, add_media, create_user, default_review_sources,
 * save_contact). Lets ops inspect what was sent + what came back, and
 * the retry UX read the last failure for a given user.
 */
export const provisioningLogs = pgTable(
  'provisioning_logs',
  {
    id: serial('id').primaryKey(),
    userId: text('user_id').notNull(),
    // Increments per call within a single run. Run boundaries are inferred
    // from createdAt + userId (we don't have a separate runs table — the
    // attempt count lives in onboarding_states.state.provisioningAttempts).
    step: integer('step').notNull(),
    kind: varchar('kind', { length: 40 }).notNull(),
    ok: boolean('ok').notNull(),
    payload: jsonb('payload').notNull(),
    response: jsonb('response'),
    error: text('error'),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => ({
    userIdIdx: index('provisioning_logs_user_id_idx').on(t.userId, t.createdAt),
  })
);

export type ProvisioningLog = typeof provisioningLogs.$inferSelect;
export type NewProvisioningLog = typeof provisioningLogs.$inferInsert;

/**
 * Extra profile fields collected by the dashboard /profile page.
 *
 * Identity (name, email, phone) still lives in WorkOS — this table holds
 * everything else: business info, preferences, referral code. One row per
 * WorkOS user, auto-created on first sign-in by lib/auth/ensure-user-record.
 *
 * profileCompletePct is denormalised from helpAreas, businessName, etc. on
 * every update so /dashboard can show "Profile X% complete" without
 * recomputing.
 */
export const userProfiles = pgTable('user_profiles', {
  userId: text('user_id').primaryKey(), // WorkOS user id
  businessName: text('business_name'),
  businessDescription: text('business_description'),
  stage: varchar('stage', { length: 20 }),
    // 'idea' | 'just-starting' | 'running' | 'established'
  industry: varchar('industry', { length: 20 }),
    // 'retail' | 'services' | 'food' | 'creative' | 'trades' | 'other'
  helpAreas: text('help_areas').array().default([]).notNull(),
    // 'website' | 'marketing' | 'branding' | 'pricing' | 'systems' | 'funding' | 'confidence'
  city: text('city'),
  phone: text('phone'),
  preferredLanguage: varchar('preferred_language', { length: 4 }).default('en').notNull(),
    // 'en' | 'ar' | 'ne' | 'ur'
  referCode: text('refer_code').unique(),
  profileCompletePct: integer('profile_complete_pct').default(0).notNull(),
  notifBooking: boolean('notif_booking').default(true).notNull(),
  notifLibrary: boolean('notif_library').default(true).notNull(),
  notifEvents: boolean('notif_events').default(true).notNull(),
  notifNewsletter: boolean('notif_newsletter').default(false).notNull(),
  notifReferrals: boolean('notif_referrals').default(true).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

export type UserProfile = typeof userProfiles.$inferSelect;
export type NewUserProfile = typeof userProfiles.$inferInsert;

/**
 * Member RSVPs against Payload events. The Payload `Events` collection
 * stores event content (title, date, etc.) in the `payload` schema;
 * RSVPs live here so we can join against `subscriptions` and `user_profiles`
 * with Drizzle without bouncing through Payload's local API.
 *
 * `eventId` is the Payload event row id — Payload uses integers/serial
 * IDs by default with the postgres adapter, so we mirror as integer.
 *
 * Compound primary key (userId + eventId) prevents double-RSVPs.
 */
export const eventRsvps = pgTable(
  'event_rsvps',
  {
    userId: text('user_id').notNull(),
    eventId: integer('event_id').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => ({
    userEventIdx: index('event_rsvps_user_event_idx').on(t.userId, t.eventId),
  }),
);

export type EventRsvp = typeof eventRsvps.$inferSelect;
export type NewEventRsvp = typeof eventRsvps.$inferInsert;
