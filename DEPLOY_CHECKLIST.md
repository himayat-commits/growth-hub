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
- [ ] Merge → production deploy. `prod-migrate` runs the two migrations against prod automatically.
- [ ] Post-deploy checks:
  - [ ] Site loads; consent banner appears; pixels fire only after Accept.
  - [ ] `/privacy` resolves.
  - [ ] An ops admin can still access `/ops` and act; a support user is correctly limited.
  - [ ] A test member RSVP works; a duplicate doesn't create a second row.
  - [ ] Stripe checkout completes and the subscription syncs.

## 4. Rollback plan
- [ ] **Code:** redeploy the previous production deployment in Vercel (instant).
- [ ] **Drizzle migration `0013`:** the dedupe `DELETE` is not reversible (deleted duplicate rows are gone). The schema change is — `down()` drops the PK and restores the index (`drizzle/0013` has no down; recreate the index manually if needed). Take a Neon point-in-time/branch snapshot before deploying so you can restore.
- [ ] **Payload migration:** `20260623…` has a `down()` that drops the `community_links_*` columns.
- [ ] Keep the Neon pre-deploy snapshot until you're confident.

## 5. After deploy
- [ ] Add the `support`/`admin` teammates to `OPS_EMAILS`.
- [ ] Fill the community group links in Payload admin.
- [ ] Have the `/privacy` policy reviewed by someone qualified.
