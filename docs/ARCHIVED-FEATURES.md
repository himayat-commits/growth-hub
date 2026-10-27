# Archived features (Oct 2026)

On 27 Oct 2026 the member portal, the merch shop, the ops console, WorkOS
sign-in and Stripe billing were removed from this site. Growth Hub Sites
(app.thegrowthhub.com.au) is now the product customers sign in to; these
features may come back later in a different form.

## Where the code is

Tag **`archive/member-portal-and-shop-2026-10`** (commit `fab93e6`, the last
master before removal). To look at or restore something:

```sh
git show archive/member-portal-and-shop-2026-10:src/app/api/stripe/webhook/route.ts
git checkout -b restore-portal archive/member-portal-and-shop-2026-10
```

The old runbooks went with the code: `docs/SHOP.md`, `docs/STRIPE.md`,
`docs/ADVISORY.md`, `docs/HUBSPOT_CRM.md`, `docs/birdeye-go-live.md`, and the
full env var list in `.env.example`.

## What was removed

- **Member portal** (`src/app/(app)`, served on my.thegrowthhub.com.au):
  dashboard, plan, profile, benefits/referrals, messages, my-events, resources,
  search, services and bookings, and the Birdeye onboarding wizard and
  provisioning.
- **Ops console** (`/ops`): bookings, cancellations, events roster, inbox,
  members, provisioning, referrals, sign-ups, orders and inventory.
- **Shop**: `/shop`, cart, checkout, order emails, `/orders`.
- **Sign-in**: WorkOS AuthKit (`/sign-in`, `/sign-up`, `/auth/callback`,
  `src/proxy.ts`).
- **Billing**: Stripe checkout, plan changes, billing portal, cancellation,
  the Stripe webhook, referral credits, Meta server-side conversions.
- **API routes and crons** that only served the above, including the
  `provision-retry` and `event-reminders` Vercel crons and `/api/expo-apply`.
- **Payload**: the Products, Resources, Services and Strategists collections
  and the SignupPageContent global are no longer registered.

Old URLs redirect (`next.config.ts`): anything on my.thegrowthhub.com.au goes
to the home page; `/sign-in`, `/sign-up`, `/portal`, `/dashboard`, `/plan` and
`/account` go to `/sites`; `/shop` goes home.

## Data is retained

Nothing was deleted and no migration was written or run.

- The Drizzle tables (`subscriptions`, `user_profiles`, `onboarding_states`,
  `provisioning_logs`, `provisioning_tasks`, `notifications`, `messages`,
  `service_bookings`, `referrals`, `event_rsvps`,
  `subscription_cancellations`, `inventory`, `orders`, `order_items`) and their
  rows are still in the production database. `src/lib/db/schema.ts` and
  `drizzle/` are unchanged, and the production build still runs
  `scripts/prod-migrate.mjs`.
- The Payload tables for the removed collections and global are still in the
  `payload` schema (Payload runs with `push: false`, so it doesn't touch them).
- Copies held by outside services (Stripe, WorkOS, HubSpot, Vercel Blob,
  PostHog, Sentry) are unchanged.

How long to keep this data, and whether to export or delete any of it, is a
separate decision for the owner with advice.

## External clean-up still owed

- **Stripe**: cancel the one internal A$0 subscription and delete the webhook
  endpoint (`we_1TbAav273Ow9BUr7edh7tE5r`); `/api/stripe/webhook` now returns
  404, so Stripe will retry and eventually flag it until it's deleted.
  Archiving the plan prices and shop products is optional.
- **WorkOS**: nothing required. The application can be deleted later.
- **Vercel environment variables** no longer used (remove any that are set):
  `WORKOS_*`, `NEXT_PUBLIC_WORKOS_REDIRECT_URI`, `STRIPE_*`, `SHOP_*`,
  `BIRDEYE_*`, `PROVISION_MODE`, `PROVISION_ALLOWLIST`, `OPS_EMAILS`,
  `OPS_NOTIFICATION_EMAIL`, `OPS_NOTIFY_WEBHOOK`, `CRON_SECRET`,
  `HEALTH_SECRET`, `PLAYWRIGHT_TEST_TOKEN`, `META_CAPI_*`,
  `GOOGLE_ADS_CONVERSION_ACTION_ID`, `NEXT_PUBLIC_APP_URL`, `PORTAL_PARKED`.
- **my.thegrowthhub.com.au**: while it stays attached to the Vercel project it
  redirects to the home page. Decide whether to keep it or detach it.
- **Vercel crons**: deregistered automatically by the next production deploy.
