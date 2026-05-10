# Growth Hub by Himayat — Next.js App

Production-ready Next.js 15 App Router site for [Growth Hub by Himayat](https://growthhub.himayat.com.au), a Social Traders Verified social enterprise in Canberra, Australia.

## Running locally

```bash
nvm use          # Node 20 (see .nvmrc)
npm install
cp .env.example .env.local   # add RESEND_API_KEY
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Environment variables

| Variable | Required | Description |
|---|---|---|
| `RESEND_API_KEY` | Yes | API key from [resend.com](https://resend.com) |
| `NEXT_PUBLIC_SITE_URL` | Yes | Deployed URL, e.g. `https://growthhub.himayat.com.au` |

## Deploying to Vercel

1. Push to GitHub and import into Vercel.
2. Add `RESEND_API_KEY` and `NEXT_PUBLIC_SITE_URL` in Vercel → Environment Variables.
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
