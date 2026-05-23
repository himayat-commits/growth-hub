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
  // Slug of an active payload.strategists row. Loose ref across schemas; the
  // UI tolerates orphan slugs by falling back to a "Growth Hub Team" label.
  // Auto-assigned by ensure-user-record on first sign-in (round-robin).
  assignedStrategistId: text('assigned_strategist_id'),
  profileCompletePct: integer('profile_complete_pct').default(0).notNull(),
  notifBooking: boolean('notif_booking').default(true).notNull(),
  notifLibrary: boolean('notif_library').default(true).notNull(),
  notifEvents: boolean('notif_events').default(true).notNull(),
  notifNewsletter: boolean('notif_newsletter').default(false).notNull(),
  notifReferrals: boolean('notif_referrals').default(true).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (t) => ({
  assignedStrategistIdx: index('user_profiles_assigned_strategist_idx').on(t.assignedStrategistId),
}));

export type UserProfile = typeof userProfiles.$inferSelect;
export type NewUserProfile = typeof userProfiles.$inferInsert;

/**
 * Per-user notification feed surfaced on /dashboard and the topbar bell.
 *
 * `kind` is a discriminator we use to render the right icon + tone in the
 * UI. Append-only — we never delete rows, just mark them read.
 *
 * `href` is optional but useful for "click the notification, go somewhere".
 */
export const notifications = pgTable(
  'notifications',
  {
    id: serial('id').primaryKey(),
    userId: text('user_id').notNull(),
    kind: varchar('kind', { length: 30 }).notNull(),
      // 'welcome' | 'subscription_active' | 'birdeye_provisioned'
      // | 'new_resource' | 'event_reminder' | 'referral_signed_up'
      // | 'message_received'
    title: text('title').notNull(),
    body: text('body').notNull(),
    href: text('href'),
    readAt: timestamp('read_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => ({
    userCreatedIdx: index('notifications_user_created_idx').on(t.userId, t.createdAt),
  }),
);

export type Notification = typeof notifications.$inferSelect;
export type NewNotification = typeof notifications.$inferInsert;

/**
 * Single thread of messages per user — the "Growth Hub Team" catch-all
 * inbox. `fromTeam = true` means someone on the Himayat team sent it;
 * `false` means the customer sent it.
 *
 * v1 stays as one thread per user (no per-Strategist assignment). When we
 * add Strategist assignment in a later phase, we'll add a `threadId` column
 * and migrate existing rows into a single legacy thread.
 */
export const messages = pgTable(
  'messages',
  {
    id: serial('id').primaryKey(),
    userId: text('user_id').notNull(),
    fromTeam: boolean('from_team').notNull(),
    authorName: text('author_name'),
      // 'Growth Hub Team' for the catch-all, or the operator's name when known
    body: text('body').notNull(),
    readAt: timestamp('read_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => ({
    userCreatedIdx: index('messages_user_created_idx').on(t.userId, t.createdAt),
  }),
);

export type Message = typeof messages.$inferSelect;
export type NewMessage = typeof messages.$inferInsert;

/**
 * Customer-requested engagements with one of the Payload Services
 * (Growth Call, Website Setup, Marketing Coaching, etc.).
 *
 * Status flow:
 *   requested    — customer just submitted the form (initial state)
 *   scheduled    — ops has booked a time / call
 *   in_progress  — active engagement
 *   completed    — done
 *
 * v1 customers can only create rows (status=requested). Ops handles the
 * later transitions in Neon directly until we ship the ops console.
 *
 * `serviceSlug` is the Payload Service.slug (text) — we keep it loose
 * because services live in the Payload schema, not the public schema.
 * If a service is renamed/removed in Payload, existing bookings keep
 * their slug as a label.
 */
export const serviceBookings = pgTable(
  'service_bookings',
  {
    id: serial('id').primaryKey(),
    userId: text('user_id').notNull(),
    serviceSlug: text('service_slug').notNull(),
    serviceTitle: text('service_title').notNull(),
      // Denormalised at insert time so the dashboard "Active services" card
      // can render the correct label even if the Payload row is later edited.
    status: varchar('status', { length: 20 }).default('requested').notNull(),
      // 'requested' | 'scheduled' | 'in_progress' | 'completed' | 'cancelled'
    notes: text('notes'),
    datePreference: text('date_preference'),
      // Free-text describing when the customer is available — e.g.
      // "Weekday mornings", "Next week", "ASAP".
    requestedAt: timestamp('requested_at', { withTimezone: true }).defaultNow().notNull(),
    scheduledAt: timestamp('scheduled_at', { withTimezone: true }),
    completedAt: timestamp('completed_at', { withTimezone: true }),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => ({
    userStatusIdx: index('service_bookings_user_status_idx').on(t.userId, t.status),
  }),
);

export type ServiceBooking = typeof serviceBookings.$inferSelect;
export type NewServiceBooking = typeof serviceBookings.$inferInsert;

/**
 * Referral attribution + credit tracking.
 *
 * A row is created when a new user signs up with a `?ref=GROW-…` code on
 * their landing URL. status flow:
 *   pending    — new user just signed up via referral, hasn't qualified
 *   qualified  — referred user has booked their first Growth Call
 *   credited   — A$50 Stripe customer-balance credit has been issued to
 *                both sides (only possible once each side has a Stripe
 *                customer ID via a paid plan)
 *   declined   — fraud / self-referral / manual reject
 *
 * referredUserId is UNIQUE — a user can only be attributed to one
 * referrer. Self-referrals (referrer === referred) are blocked at insert.
 */
export const referrals = pgTable(
  'referrals',
  {
    id: serial('id').primaryKey(),
    referrerUserId: text('referrer_user_id').notNull(),
    referredUserId: text('referred_user_id').notNull().unique(),
    referCode: text('refer_code').notNull(),
      // Snapshot of the code that was used — referrer.referCode may be
      // regenerated later, so we keep what the URL actually carried.
    status: varchar('status', { length: 20 }).default('pending').notNull(),
      // 'pending' | 'qualified' | 'credited' | 'declined'
    creditedAmountCents: integer('credited_amount_cents').default(0).notNull(),
      // Total credit in cents issued to BOTH sides. 0 until status=credited.
    qualifiedAt: timestamp('qualified_at', { withTimezone: true }),
    creditedAt: timestamp('credited_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => ({
    referrerIdx: index('referrals_referrer_idx').on(t.referrerUserId, t.status),
  }),
);

export type Referral = typeof referrals.$inferSelect;
export type NewReferral = typeof referrals.$inferInsert;

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

/**
 * Cancellation log — denormalised so /ops/cancellations can query it
 * directly instead of round-tripping Stripe Search per page load.
 *
 * Written by two paths, both idempotent via ON CONFLICT DO UPDATE on
 * stripeSubscriptionId:
 *   1. POST /api/cancel-subscription — when a member cancels via the
 *      in-app CancelDialog. Reason + comment come from the survey.
 *   2. Stripe webhook customer.subscription.updated — when a member
 *      cancels via the Stripe Customer Portal (bypassing our endpoint).
 *      Reason is read from sub.metadata if the user came through
 *      CancelDialog first, otherwise empty.
 *
 * `cancelAt` is when access ends (current_period_end from Stripe).
 * `restoredAt` is set if the cancellation is undone before period end.
 */
export const subscriptionCancellations = pgTable(
  'subscription_cancellations',
  {
    id: serial('id').primaryKey(),
    userId: text('user_id').notNull(),
    stripeSubscriptionId: text('stripe_subscription_id').notNull().unique(),
    planTier: varchar('plan_tier', { length: 20 }),
    reason: varchar('reason', { length: 40 }).notNull().default(''),
    comment: text('comment').notNull().default(''),
    cancelAt: timestamp('cancel_at', { withTimezone: true }),
    restoredAt: timestamp('restored_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => ({
    createdIdx: index('subscription_cancellations_created_idx').on(t.createdAt),
    reasonIdx: index('subscription_cancellations_reason_idx').on(t.reason),
  }),
);

export type SubscriptionCancellation = typeof subscriptionCancellations.$inferSelect;
export type NewSubscriptionCancellation = typeof subscriptionCancellations.$inferInsert;
