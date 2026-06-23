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
| `BIRDEYE_API_KEY` | leave unset, or set `NEXT_PUBLIC_PROVISION_MODE=mock` so provisioning never hits live Birdeye |
| `PAYLOAD_SECRET`, `BLOB_READ_WRITE_TOKEN`, `RESEND_API_KEY` | staging-specific (Resend can stay on a test/sandbox domain) |
| `OPS_EMAILS` | e.g. `you@himayat.com.au:admin, teammate@himayat.com.au:support` to exercise the new roles |
| `PLAYWRIGHT_TEST_TOKEN` | set a random secret so the E2E auth-bypass works on staging (it's auto-disabled in Production) |

## 4. Make migrations run on staging

`scripts/prod-migrate.mjs` currently gates on `VERCEL_ENV === 'production'`.
To migrate the staging DB on deploy, broaden that check so it also runs on the
staging environment, e.g.:

```js
const env = process.env.VERCEL_ENV ?? '(unset)';
// Run migrations on production AND on the staging branch.
const isStaging = process.env.VERCEL_GIT_COMMIT_REF === 'staging';
if (env === 'production' || (env === 'preview' && isStaging)) {
  execSync('npx drizzle-kit migrate', { stdio: 'inherit' });
}
```

Then run the Payload migrations too (the build already runs
`payload generate:importmap && next build`; add `payload migrate` for staging if
you rely on the hand-written Payload migrations — e.g. the new
`20260623_site_settings_community_links`).

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

## 6. Add a privacy policy page

The consent banner links to `/privacy`, which doesn't exist yet. Add a
`/(main)/privacy/page.tsx` (or a CMS page with slug `privacy`) before relying on
the banner in production.
