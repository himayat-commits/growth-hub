# Staging environment setup (Vercel + Neon)

A coding agent can't create this for you — it needs authenticated access to your
Vercel and Neon accounts. This is the exact runbook to stand up a safe staging
environment so changes can be verified **before** they touch production.

> **The core problem this solves:** today `.env.local` and Vercel **Preview**
> both point at the **production** Neon database (`DATABASE_URL`), and
> `scripts/prod-migrate.mjs` only runs migrations when `VERCEL_ENV=production`.
> So Preview deploys read/write prod data and never get their own migrations.
> Staging must have its **own database** or it isn't really staging.

---

## 1. Create an isolated staging database (Neon branch)

Neon supports instant branching — a copy-on-write branch is the cheapest way to
get a real, separate Postgres for staging.

1. Neon console → your project → **Branches** → **New branch** (e.g. `staging`,
   branched from `main`/production).
2. Copy the branch's pooled connection string → this is your staging
   `DATABASE_URL`.
3. (Both Payload's `payload` schema and Drizzle's `public` schema live in this
   one database, so a single branch covers both.)
4. Point your local `.env.local` `DATABASE_URL` at the branch too. The one-off
   scripts (`npm run seed*`, `partners:*`, `event:*`, `shop:seed-demo`) and the
   Playwright test-user seed **refuse to run** while `DATABASE_URL` is the
   production endpoint; set `ALLOW_PROD=1` only when you mean to hit prod
   (`scripts/_guard.mjs`).

## 2. Create the Vercel "staging" environment

Pick **one** of these (Option A is simplest):

**Option A — a dedicated `staging` branch + Preview env**
1. In your Git repo, create a long-lived `staging` branch.
2. Vercel → Project → **Settings → Git** → confirm Preview deploys are enabled
   for branches.
3. A push to `staging` produces a Preview deployment with `VERCEL_ENV=preview`.

**Option B — a Vercel "Custom Environment" named Staging** (Pro plans)
1. Vercel → Project → **Settings → Environments → Create** → name it `Staging`,
   attach it to the `staging` branch.
2. Set its env vars (next step) scoped to that environment.

## 3. Point staging at the staging DB + test keys

In Vercel → **Settings → Environment Variables**, set these for the
**Preview/Staging** environment (NOT Production):

| Variable | Staging value |
|---|---|
| `DATABASE_URL` | the **Neon `staging` branch** connection string (step 1) |
| `STRIPE_SECRET_KEY` / `STRIPE_WEBHOOK_SECRET` / `STRIPE_PRICE_*` | Stripe **test-mode** keys + test price IDs |
| `WORKOS_API_KEY` / `WORKOS_CLIENT_ID` / redirect URIs | a WorkOS **staging** environment (add the preview URL as a redirect) |
| `BIRDEYE_API_KEY` | leave unset, and set `PROVISION_MODE=mock` (the default) so provisioning never hits live Birdeye. Do **not** set `NEXT_PUBLIC_PROVISION_MODE` — it is ignored and the health check fails on it |
| `PAYLOAD_SECRET`, `BLOB_READ_WRITE_TOKEN`, `RESEND_API_KEY` | staging-specific (Resend can stay on a test/sandbox domain) |
| `OPS_EMAILS` | e.g. `you@himayat.com.au:admin, teammate@himayat.com.au:support` to exercise the new roles |
| `PLAYWRIGHT_TEST_TOKEN` | set a random secret so the E2E auth-bypass works on staging (it's auto-disabled in Production) |

## 4. Make migrations run on staging

`scripts/prod-migrate.mjs` runs the **Drizzle** migrations only (`npx drizzle-kit
migrate`), and only when `VERCEL_ENV === 'production'`. Payload (CMS) migrations
are deliberately **not** run by it: `payload migrate` is interactive on this
project (the `payload_migrations` table was never populated because the Payload
schema was applied out-of-band), so it prompts and hangs the build — that is
what stalled the 23 June 2026 deploy. Payload schema changes are applied as raw
SQL in the Neon SQL editor instead (see the script header and
`DEPLOY_CHECKLIST.md`). **Never add `npx payload migrate` to the build.**

To migrate the staging DB on deploy, broaden the gate so it also fires on the
staging branch, e.g.:

```js
const env = process.env.VERCEL_ENV ?? '(unset)';
// Run Drizzle migrations on production AND on the staging branch.
const isStaging = process.env.VERCEL_GIT_COMMIT_REF === 'staging';
if (env === 'production' || (env === 'preview' && isStaging)) {
  execSync('npx drizzle-kit migrate', { stdio: 'inherit' });
}
```

This applies the pending Drizzle migrations (e.g. `0013_add_event_rsvps_pk`
with its dedupe `DELETE`); they are journaled and idempotent. Payload
migrations such as `20260623_site_settings_community_links` (the
`community_links_*` columns on `site_settings`) still have to be applied by
hand — run the `up` SQL from `src/migrations/<name>.ts` against the staging
branch.

> ⚠️ Because today Preview shares the prod `DATABASE_URL`, do **not** broaden the
> migrate gate until step 3 has repointed staging at the Neon branch — otherwise
> a staging deploy would migrate production.

## 5. Verify the recent changes on staging

Once staging is live with its own DB:

- **Ops roles:** sign in as a `:support` user → `/ops/referrals` and `/ops/signups`
  show status/assignment read-only; the PATCH APIs return 403. Sign in as `:admin`
  → controls work.
- **Cookie consent:** load a public page in a fresh browser → banner appears,
  no GA4/Meta/LinkedIn network calls until **Accept**; **Decline** keeps them off;
  choice persists across reloads.
- **Community links:** after the Payload migration runs, set the links in Payload
  admin → `/benefits` shows the "Join the community" block; completing a profile
  to 100% creates the `community` notification.
- **Event RSVP integrity:** run `npm run test:e2e`; double-RSVP attempts collapse
  to one row (compound PK).
- **Billing idempotency:** use the Stripe CLI against the test keys
  (`stripe listen` + `stripe trigger`) to replay duplicate webhooks and confirm a
  single referral credit.
