# The Growth Hub — Next.js + Payload site

Next.js 16 (App Router) + Payload CMS 3 on Neon Postgres. This is the public website for
[The Growth Hub](https://thegrowthhub.com.au), a Canberra social enterprise by Himayat:
free monthly Growth Hub Sessions, paid Build Labs, and Growth Hub Sites.

Growth Hub Sites itself (accounts, site building, billing) runs on a separate white-label
platform at [app.thegrowthhub.com.au](https://app.thegrowthhub.com.au), not in this repo.
The former member portal, shop, ops console, WorkOS sign-in and Stripe billing were removed
in October 2026; see [`docs/ARCHIVED-FEATURES.md`](docs/ARCHIVED-FEATURES.md).

## Running locally

> **⚠️ Check where `DATABASE_URL` points before `npm run dev`.** A handoff `.env.local`
> may be a copy of production, so its `DATABASE_URL` is the **live Neon database**.
> `npm run dev`, every `npm run seed*` / data-fix script and `npm run test:e2e` will
> read and write it. Point `DATABASE_URL` at a Neon branch first. The scripts refuse to
> run against production unless you set `ALLOW_PROD=1` deliberately
> (`scripts/_guard.mjs`); `next dev` itself has no such guard.

```bash
nvm use          # Node 20+ (see .nvmrc; package.json engines >=20.9)
npm install
cp .env.example .env.local   # then fill in the values — every variable is documented there
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). The CMS is at `/admin`.

## Environment variables

All variables, what they do and which are **required in production**, are documented in
[`.env.example`](.env.example). `.env.local` is gitignored and must stay that way.

## Checks

```bash
npm run typecheck            # tsc --noEmit
npm run lint                 # eslint src scripts tests
npm test                     # both of the above — what CI runs (.github/workflows/ci.yml)
npm run test:e2e:smoke:prod  # public-surface smoke test against https://thegrowthhub.com.au
```

## Deploying

Vercel builds `master` to production (region `syd1`, see `vercel.json`).

- **Drizzle migrations** run automatically: `vercel-build` runs `scripts/prod-migrate.mjs`
  (`drizzle-kit migrate`) before `next build`, only when `VERCEL_ENV=production`. A failed
  migrate fails the build. The Drizzle tables from the archived portal and shop are kept
  (data retained); never write a migration that drops them.
- **Payload migrations are applied by hand**, as raw SQL against production, before or with
  the deploy. Commit the migration file under `src/migrations/` for the record.
  **Never add `payload migrate` to the build**: it prompts interactively on this project
  and hangs the Vercel build. `push: false` is set in `payload.config.ts`.
- To redeploy production without a code change (e.g. after changing an env var), use
  `vercel redeploy <current-production-url> --target production` rather than deploying
  from a local checkout.

## Project structure

```
src/
  app/
    (main)/                  Public site: home, events (Sessions + Build Labs), sites,
                             partners, about, privacy, community-guidelines, not-found
    (payload)/               Payload admin (/admin) and its REST API
    api/contact, api/newsletter, api/events/ics/[slug], api/revalidate
    sitemap.ts, robots.ts, global-not-found.tsx
  collections/, globals/     Payload CMS schema (Events, Partners, Media, Site Settings, …)
  lib/
    sessions.ts              The Sessions / Build Lab season plan (code), venue switch
    site.ts                  Contact details and Growth Hub Sites links
    cms/                     Cached Payload reads
    email/                   sendEmail() provider layer (used by the contact form)
    db/                      Drizzle schema + client (tables retained, see above)
  components/                Navbar, Footer, sections/ (page sections), seo/, analytics/
docs/                        EMAIL.md, EVENTS.md, SENTRY.md, ARCHIVED-FEATURES.md, reviews/
```

## Contact form and newsletter

See [`docs/EMAIL.md`](docs/EMAIL.md). Events and the Sessions calendar are in
[`docs/EVENTS.md`](docs/EVENTS.md).
