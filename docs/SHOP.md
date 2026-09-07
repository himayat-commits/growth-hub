# Shop (merch e-commerce)

Public storefront at `/shop` selling physical merchandise with variants, a
multi-item cart, Stripe Checkout (one-time payment), stock tracking, member
pricing for active paid subscribers, and fulfilment from the `/ops` console.

## Where things live

| Concern | Where | Notes |
|---|---|---|
| Catalogue (name, images, price, variants) | Payload `products` collection (`src/collections/Products.ts`) | Editors work in `/admin`. Only `status: published` products are visible or purchasable. |
| Stock per SKU | Drizzle `public.inventory` (`src/lib/db/inventory.ts`) | **Not** in Payload: the postgres adapter rewrites array rows on every save, and the Neon HTTP driver has no transactions, so atomicity comes from `db.batch()` + `CHECK (stock >= 0)`. Edited in `/ops/inventory`. |
| Orders | Drizzle `public.orders` + `order_items` (`src/lib/db/orders.ts`) | Created `pending` before the Stripe session; `pending → paid` is an idempotent conditional update. |
| Pricing | `src/lib/shop/pricing.ts` | Pure functions used by BOTH the UI and the checkout route so display never diverges from charge. |
| Checkout | `POST /api/shop/checkout` | Guest-capable. Re-prices every line from the catalogue, checks stock, creates a `mode: 'payment'` Checkout Session with inline `price_data`, AU-only shipping address, two Stripe Shipping Rates, GST tax rate, `invoice_creation`. |
| Fulfilment from Stripe | `src/lib/shop/fulfil-order.ts` | Shared by the webhook and `/shop/success`. Claims the order, decrements stock atomically, sends the confirmation email, fires the Purchase conversion. |
| Webhook | `src/app/api/stripe/webhook/route.ts` | New events: `checkout.session.async_payment_succeeded`, `checkout.session.expired`, `charge.refunded`. Subscription path unchanged. |
| Cart | `src/components/shop/CartProvider.tsx` | localStorage `gh_cart_v1 = [{ sku, qty }]`. Hydrated from `GET /api/shop/products?skus=` (server-authoritative prices, stock, member status). |
| Member history | `/orders`, `/orders/[id]` (app host) | Matched by WorkOS id OR email, so guest orders appear after sign-in. |
| Ops | `/ops/orders`, `/ops/orders/[id]`, `/ops/inventory` | `PATCH /api/ops/orders/[id]` (ship / cancel), `PATCH /api/ops/inventory/[sku]` (`{delta}` or `{set}`). |
| Emails | `src/lib/email/templates/order-emails.ts` via `src/lib/shop/emails.ts` | Confirmation (doubles as tax invoice: GST component, ABN) and shipped (tracking). Resend. |

## The join key is the SKU

Payload and Drizzle live in different Postgres schemas with no cross-schema
foreign keys. Inventory rows and order items reference the variant **SKU**
string; orders also snapshot name, variant label, image and prices so later
catalogue edits never rewrite history. **Never rename a SKU once it has sold.**

## Money and GST

- Prices are integer AUD cents, GST-inclusive.
- Member discount is `memberDiscountPct` per product (default 10, 0 = none),
  applied server-side as a lower `unit_amount`. No Stripe coupons.
- `automatic_tax` is off. `STRIPE_TAX_RATE_GST_INCLUSIVE` (a 10% inclusive
  Stripe Tax Rate) is attached to every line so Stripe receipts/invoices
  itemise GST without changing the price. The confirmation email prints the
  GST component (`total / 11`) and `SHOP_ABN`.
- Shipping is AU-only via two Stripe Shipping Rates (Standard, Express).
  Optional free-shipping rate above `SHOP_FREE_SHIPPING_THRESHOLD_CENTS`.

## Order lifecycle

```
pending ──(payment: webhook or /shop/success)──▶ paid ──(ops: tracking)──▶ shipped
   │                                                │
   └──(checkout.session.expired)──▶ cancelled       └──(Stripe refund)──▶ refunded
```

- Stock is **not reserved** at checkout; it is checked when the session is
  created and decremented on payment. If two buyers pay for the last unit
  inside the 30-minute session window, the second order is flagged
  `oversold`, ops is emailed, and the order shows a warning in `/ops/orders`
  until it is restocked-and-shipped or refunded in Stripe.
- Refunds do not restock automatically. Adjust stock in `/ops/inventory`.

## Environment

See `.env.example` → "Shop". Required for checkout:
`STRIPE_SHIPPING_RATE_STANDARD`, `STRIPE_SHIPPING_RATE_EXPRESS`.
Recommended: `STRIPE_TAX_RATE_GST_INCLUSIVE`, `SHOP_ABN`.
Optional: `STRIPE_SHIPPING_RATE_FREE` + `SHOP_FREE_SHIPPING_THRESHOLD_CENTS`.

Stripe Dashboard → Developers → Webhooks: add `checkout.session.async_payment_succeeded`,
`checkout.session.expired`, `charge.refunded` to the existing endpoint.

## Migrations (two systems)

- **Payload** (`payload` schema): `src/migrations/20260907_add_products.ts`.
  Not run in CI. Apply the SQL by hand (Neon SQL editor) **before** the code
  deploys — otherwise `/shop` renders empty and checkout 409s everything.
  Every statement is `IF NOT EXISTS` / duplicate-guarded, so re-running is safe.
- **Drizzle** (`public` schema): `drizzle/0015_shop_orders_inventory.sql`.
  Applied automatically on the production Vercel build by
  `scripts/prod-migrate.mjs`. Locally: `npm run db:migrate`.

## Local development

```bash
# 1. Apply both migrations to your dev DB (see above)
npm run db:migrate
# 2. Seed a demo product (3 variants, one sold out, stock on the others)
npm run shop:seed-demo
# 3. Stripe test keys in .env.local + shipping/tax rate IDs from TEST mode, then:
stripe listen --forward-to localhost:3000/api/stripe/webhook
npm run dev
```

Pay with `4242 4242 4242 4242`; you land on `/shop/success` with the order
summary. Check `orders.status = 'paid'`, `inventory.stock` decremented, and
the confirmation email in Resend. Refund in the Stripe test dashboard → the
row flips to `refunded`.

## Tests

`tests/e2e/shop.spec.ts` — always-on checks (rendering, empty states, API
validation, auth gating) plus product-flow checks that auto-skip unless the
demo product exists.
