# The Growth Hub — Next.js + Payload app

Next.js 16 (App Router) + Payload CMS 3 + Drizzle/Neon marketing site and member portal for [The Growth Hub](https://thegrowthhub.com.au) (portal at [app.thegrowthhub.com.au](https://app.thegrowthhub.com.au)), a Social Traders Verified social enterprise in Canberra, Australia.

## Running locally

> **⚠️ Before `npm run dev`, check where `DATABASE_URL` points.** A handoff `.env.local`
> may be a copy of the production environment — its `DATABASE_URL` is the **live Neon
> database**, and `npm run dev`, every `npm run seed*` / data-fix script and
> `npm run test:e2e` will read and write it. Create a Neon branch and point
> `DATABASE_URL` at it first (see `STAGING.md` §1). The scripts and the E2E seed refuse
> to run against production unless you set `ALLOW_PROD=1` deliberately
> (`scripts/_guard.mjs`); `next dev` itself has no such guard.

```bash
nvm use          # Node 20 (see .nvmrc; package.json engines >=20.9)
npm install
cp .env.example .env.local   # then fill in the values — every variable is documented there
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Environment variables

All variables — what they do and which are **required in production** — are documented
in [`.env.example`](.env.example). Copy it to `.env.local` and fill in the blanks;
`.env.local` is gitignored and must stay that way.

## Checks

```bash
npm run typecheck            # tsc --noEmit
npm run lint                 # eslint src scripts tests
npm test                     # both of the above — what CI runs (.github/workflows/ci.yml)
npm run test:e2e             # Playwright against BASE_URL (default http://localhost:3000);
                             # needs PLAYWRIGHT_TEST_TOKEN and a NON-production DATABASE_URL
npm run test:e2e:smoke:prod  # public-surface smoke against https://thegrowthhub.com.au — no DB, no auth bypass
```

## Deploying to Vercel

1. Push to GitHub — Vercel builds `master` to production. `vercel-build` runs the pending
   **Drizzle** migrations first (`scripts/prod-migrate.mjs`), then `next build`. Payload
   migrations are applied by hand (see `DEPLOY_CHECKLIST.md`).
2. Set the production variables listed in `.env.example` in Vercel → Environment Variables.
3. `vercel.json` sets region to `syd1` (Sydney) for lowest Canberra latency.

## Project structure

```
src/
  app/
    layout.tsx               Root layout (Navbar, Footer, fonts)
    page.tsx                 Home page
    sitemap.ts / robots.ts
    api/contact/route.ts     POST → sends email via Resend
    signup/foundations|growth|accelerate/page.tsx
  components/
    Navbar.tsx / Footer.tsx / SignupPage.tsx
    sections/                Hero, SupportedBy, HowItWorks, PricingSection,
                             FAQ, Community, BigQuote, Testimonials,
                             About, FinalCTA, Contact
public/
  fonts/BiroScript.otf
  images/  (himayat-logo.png, workshop.jpg, himayat-logomark.png)
```

## Contact form

POSTs JSON to `/api/contact` → Resend sends formatted HTML to `hello@himayat.com.au` with `Reply-To` set to the enquirer. Requires Resend account with `himayat.com.au` verified as a sending domain. For local dev, swap the `from` address in `route.ts` to `onboarding@resend.dev`.
