# Stripe + Clerk + Neon subscription setup for growth-hub

A complete subscription billing system for Himayat tailored to your stack: **Next.js 16 (App Router) + TypeScript + Tailwind v4 + Vercel + Resend**, with **Clerk** for auth and **Neon + Drizzle** for the database.

## What's in this folder

```
stripe/
├── .env.example                                   # Required env vars
├── drizzle.config.ts                              # Drizzle config
├── middleware.ts                                  # Clerk middleware
├── lib/
│   ├── db/
│   │   ├── index.ts                               # Neon + Drizzle client
│   │   └── schema.ts                              # subscriptions table
│   ├── stripe.ts                                  # Stripe client singleton
│   ├── plans.ts                                   # Plan/Price config + lookups
│   └── subscription.ts                            # getSubscription, requireSubscription
└── app/
    ├── pricing/page.tsx                           # 3-tier pricing page w/ monthly↔annual toggle
    ├── dashboard/
    │   ├── page.tsx                               # Subscriber-only dashboard
    │   └── manage-billing-button.tsx              # Customer portal button
    ├── sign-in/[[...sign-in]]/page.tsx            # Clerk sign-in
    ├── sign-up/[[...sign-up]]/page.tsx            # Clerk sign-up
    └── api/
        ├── checkout/route.ts                      # Create Checkout session
        ├── billing-portal/route.ts                # Customer portal session
        └── stripe/webhook/route.ts                # Webhook handler
```

Drop these straight into the corresponding paths in `growth-hub`.

## Setup checklist

### 1. Install dependencies

```bash
npm install stripe @stripe/stripe-js @clerk/nextjs drizzle-orm @neondatabase/serverless
npm install -D drizzle-kit
```

(`resend` you already have.)

### 2. Create a Neon project

1. Sign up at [neon.tech](https://neon.tech) and create a project in the AWS Sydney (`ap-southeast-2`) region to keep latency low for `syd1` Vercel functions.
2. Copy the pooled connection string into `DATABASE_URL`.
3. Run the initial migration:

```bash
npx drizzle-kit generate
npx drizzle-kit migrate
```

### 3. Create a Clerk application

1. Sign up at [clerk.com](https://clerk.com) and create an application.
2. Enable Email + your preferred social providers (Google is a good default for B2B).
3. Copy the publishable + secret keys into env vars.
4. In Clerk Dashboard → User & Authentication → Email, Phone, Username, you can enable Organizations later for team accounts. (One business = one organization, multiple users on it. Doesn't affect billing wiring; the user who pays becomes the org admin.)

### 4. Create products and prices in Stripe

In Stripe Dashboard → Products → Add product, create five products with these recurring prices in **AUD**:

| Product | Monthly | Annual (2 months free) |
|---|---|---|
| Foundations | $299 | $2,990 |
| Growth | $499 | $4,990 |
| Accelerate | $799 | $7,990 |
| Search AI add-on | $99 | — |
| Referrals add-on | $175 | — |

Copy the eight `price_...` IDs into the corresponding env vars.

The annual price is exactly 10× monthly (i.e. 2 months free). The pricing page UI calculates this on the fly so the displayed amount and the Stripe price always match — but make sure the actual Stripe prices are set to those amounts.

### 5. Set environment variables

Copy `.env.example` to `.env.local` and fill in the values. Add the same set to Vercel under Project → Settings → Environment Variables (set them for Production, Preview, and Development).

### 6. Wire up the Clerk provider

In `app/layout.tsx`, wrap children with `<ClerkProvider>`:

```tsx
import { ClerkProvider } from '@clerk/nextjs';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <ClerkProvider>
      <html lang="en">
        <body>{children}</body>
      </html>
    </ClerkProvider>
  );
}
```

### 7. Run database migration

```bash
npx drizzle-kit generate   # creates drizzle/0000_*.sql
npx drizzle-kit migrate    # applies it to Neon
```

### 8. Test webhooks locally

```bash
# In one terminal
npm run dev

# In another (after installing the Stripe CLI: https://stripe.com/docs/stripe-cli)
stripe login
stripe listen --forward-to localhost:3000/api/stripe/webhook
```

The CLI prints a `whsec_...` webhook signing secret — put that in `STRIPE_WEBHOOK_SECRET` for local dev.

Use Stripe's test cards:
- `4242 4242 4242 4242` — succeeds
- `4000 0000 0000 9995` — payment fails
- `4000 0027 6000 3184` — requires 3DS

### 9. Production webhook

When you go live:

1. Stripe Dashboard → Developers → Webhooks → Add endpoint.
2. URL: `https://your-domain.com.au/api/stripe/webhook`
3. Subscribe to these events:
   - `checkout.session.completed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.paid`
   - `invoice.payment_failed`
4. Copy the **Signing secret** into Vercel's `STRIPE_WEBHOOK_SECRET` env var (Production environment only — keep local dev's CLI secret separate).

### 10. Configure the Stripe Customer Portal

Stripe Dashboard → Settings → Billing → Customer portal:

- ✅ Allow customers to update payment method
- ✅ Allow customers to view invoice history
- ✅ Allow customers to cancel subscriptions (set "at end of billing period")
- ✅ Allow customers to switch plans → add Foundations, Growth, Accelerate as switchable
- ✅ Allow customers to add/remove the Search AI and Referrals add-ons

Save. Now `/api/billing-portal` will return a working URL.

## Architecture notes

**Source of truth.** The `subscriptions` table is a *cache* — Stripe is canonical. Every webhook event for a subscription calls `syncSubscription()`, which fetches the full state from Stripe and overwrites the row. Don't try to track diffs in app code.

**Customer ↔ User mapping.** When a user first hits `/api/checkout`, we create a Stripe Customer with `metadata.clerkUserId = <user id>` and store the resulting `cus_...` in our DB. Every subsequent operation looks them up by Clerk user id.

**Add-ons.** Add-ons are extra `line_items` on the same Subscription, not separate subscriptions. The customer gets one invoice per cycle; Stripe handles proration when an add-on is added/removed mid-cycle. The pricing page UI in this scaffold doesn't expose an add-on selector — for v1, customers add them via the Stripe Customer Portal after subscribing. When you want a custom add-on UI, hit `stripe.subscriptions.update(subId, { items: [...] })` server-side.

**Annual = 10× monthly.** The pricing page just multiplies by 10 for the displayed annual figure, which gives you "2 months free". The Stripe Price for the annual SKU must match this; the page never invents a price the way Stripe doesn't have.

**Gating.** Use `requireSubscription()` in any server component or route handler that needs paid access. It redirects to `/pricing` if the user isn't subscribed.

**Resend.** The webhook fires a `payment_failed` email via Resend from `hello@himayat.com.au` — make sure that domain is verified in your Resend account.

## Optional extensions

- **HubSpot sync.** You're already using HubSpot for signup forms. On `customer.subscription.created`, push the new subscriber into HubSpot as a contact with `lifecycle_stage = customer` and a `subscription_tier` property.
- **Welcome email.** Add a Resend send on `checkout.session.completed`.
- **Internal Slack notification.** Hit a Slack webhook on every new subscription so the team sees signups in real-time.
- **Custom add-on UI.** Build a `/dashboard/billing/addons` page that lets customers toggle add-ons without going through the Customer Portal.
- **Usage metering.** If you want to charge by, say, AI message volume, use Stripe Metered Billing (`recurring.usage_type = 'metered'`) and report usage with `subscriptionItems.createUsageRecord`.
