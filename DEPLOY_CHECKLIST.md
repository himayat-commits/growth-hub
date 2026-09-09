# Pre-deploy checklist

For shipping the changes in `PR_DESCRIPTION.md`. Do staging first (see
`STAGING.md`), then production. Nothing here has been runtime-tested — these
steps are the gate.

## 0. Before anything
- [ ] **Rotate the exposed secrets.** `.env.local` shipped in the handoff bundle with live Stripe (`sk_live`/`whsec`), WorkOS, Birdeye, and Neon credentials. If the bundle left trusted hands, rotate them in each provider and update Vercel env vars. Confirm `.env.local` stays gitignored (it is).
- [ ] Get the changed files onto a branch and open the PR (body = `PR_DESCRIPTION.md`). Review the diff.

## 1. Staging (gate)
- [ ] Stand up staging per `STAGING.md` (Neon branch + Vercel env + migrate gate). **Don't broaden the migrate gate until staging points at its own DB.**
- [ ] Deploy the branch to staging. Confirm both migrations apply cleanly:
  - `0013_add_event_rsvps_pk` — check how many `event_rsvps` rows the dedupe `DELETE` removes (expect 0 or very few). If it's a lot, investigate before prod.
  - `20260623_site_settings_community_links` — `site_settings` gains the 4 `community_links_*` columns.
- [ ] Smoke test on staging:
  - [ ] Ops RBAC: a `:support` user sees referral/strategist controls read-only and gets 403 from the PATCH APIs; an `:admin` user can act.
  - [ ] Consent: fresh browser → banner shows, **no** GA4/Meta/LinkedIn network calls until Accept; Decline keeps them off; choice persists.
  - [ ] `/privacy` renders and the banner link resolves.
  - [ ] Community: set links in Payload admin → `/benefits` shows the block; complete a profile to 100% → `community` notification appears.
  - [ ] `/ops/events` roster renders with RSVP rows.
  - [ ] `npm run test:e2e` passes.
  - [ ] Billing: with Stripe **test** keys, replay a duplicate webhook (`stripe trigger` / resend) → single referral credit only.

## 2. Production config (set BEFORE promoting)
- [ ] `OPS_EMAILS` — assign `:admin` / `:support` per teammate (bare = admin).
- [ ] Decide consent default (shipped: opt-in).
- [ ] Confirm Stripe **live** price IDs / webhook secret are present (existing).
- [ ] (Optional) Upstash for cross-instance rate limiting.

## 3. Promote to production

**Migrations run in exactly one place.** Drizzle migrations are applied only by
`scripts/prod-migrate.mjs`, which `npm run vercel-build` runs at the start of the
Vercel *production* build (`VERCEL_ENV=production`); preview builds skip it and a
failed migrate fails the build, so the deploy is blocked rather than shipped against
the wrong schema. The old `.github/workflows/db-migrate.yml` GitHub Action was
retired (Sep 2026) because it raced the Vercel build on the same push. To run a
migration manually — e.g. to rehearse against a Neon branch — create the branch in
the Neon console, then from a clean checkout:
`DATABASE_URL='<neon-branch-connection-string>' npx drizzle-kit migrate`
(never point this at the production URL by hand; let the build do that).

- [ ] Merge → production deploy. `prod-migrate` runs the **Drizzle** migration (`0013`) against prod automatically. The Payload migration (`20260623…`) is **not** run by the build — `payload migrate` hangs in CI (see `scripts/prod-migrate.mjs`) — so apply its `up` SQL by hand in the Neon SQL editor before promoting.
- [ ] Post-deploy checks:
  - [ ] Site loads; consent banner appears; pixels fire only after Accept.
  - [ ] `/privacy` resolves.
  - [ ] An ops admin can still access `/ops` and act; a support user is correctly limited.
  - [ ] A test member RSVP works; a duplicate doesn't create a second row.
  - [ ] Stripe checkout completes and the subscription syncs.

## 4. Rollback plan
- [ ] **Code:** redeploy the previous production deployment in Vercel (instant).
- [ ] **Drizzle migration `0013`:** the dedupe `DELETE` is not reversible (deleted duplicate rows are gone). There is **no `down()`** — Drizzle SQL migrations here are forward-only — so to roll the schema back you drop the compound PK and recreate the previous index by hand. Take a Neon point-in-time/branch snapshot before deploying so you can restore.
- [ ] **Payload migration:** `20260623…` has a `down()` that drops the `community_links_*` columns.
- [ ] Keep the Neon pre-deploy snapshot until you're confident.

## 5. After deploy
- [ ] Add the `support`/`admin` teammates to `OPS_EMAILS`.
- [ ] Fill the community group links in Payload admin.
- [ ] Have the `/privacy` policy reviewed by someone qualified.

## 6. Shop (merch) release — `feat/shop`
Docs: `docs/SHOP.md`.
- [ ] **Stripe (test AND live):** create two Shipping Rates (AUD, tax behaviour *inclusive*): Standard + Express; create a Tax Rate "GST" 10% *inclusive*, AU. Note the `shr_…` / `txr_…` ids.
- [ ] **Stripe webhook:** add `checkout.session.async_payment_succeeded`, `checkout.session.expired`, `charge.refunded` to the existing endpoint.
- [ ] **Vercel env (Production + Preview, test ids on Preview):** `STRIPE_SHIPPING_RATE_STANDARD`, `STRIPE_SHIPPING_RATE_EXPRESS`, `STRIPE_TAX_RATE_GST_INCLUSIVE`, `SHOP_ABN`. Optional `STRIPE_SHIPPING_RATE_FREE` + `SHOP_FREE_SHIPPING_THRESHOLD_CENTS`.
- [ ] **Payload migration — MANUAL, before deploy:** run the SQL in `src/migrations/20260907_add_products.ts` (`up`) against prod in the Neon SQL editor. Idempotent (`IF NOT EXISTS` guards).
- [ ] Merge → prod build runs Drizzle `0015_shop_orders_inventory` automatically (`inventory`, `orders`, `order_items`).
- [ ] Post-deploy: create a product in `/admin` (Shop → Products), set stock in `/ops/inventory`, add a "Shop" row to Navigation in Payload admin, place a live A$1 test order → `/shop/success`, check `/ops/orders` shows it `paid`, stock decremented, confirmation email received; mark shipped → shipped email; refund in Stripe → `refunded`.
- [ ] Rollback: redeploy previous build. Drizzle `0015` and Payload `20260907_add_products` both have `down()`; tables are additive so leaving them in place is harmless.
