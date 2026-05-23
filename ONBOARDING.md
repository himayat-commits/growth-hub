# Handover Notes — Growth Hub (May 2026 session)

**Project**: Growth Hub by Himayat — Next.js 16 + Payload CMS 3 + Neon Postgres + WorkOS + Stripe
**Working dir**: `C:\Users\WaheedJayhoon\Downloads\The Growth Hub (Remix) (Remix)-handoff\the-growth-hub-remix-remix\growth-hub`
**Repo**: `himayat-commits/growth-hub` · production: thegrowthhub.com.au + app.thegrowthhub.com.au

---

## TL;DR — what's live right now

Since the previous handover, ~20 PRs merged across two sessions covering:

- **Public marketing surface**: `/events` hub + 14-step Small Business Journey landing + generic `/events/[slug]`; `/partners` redesign (15 partners, 6 categories) + `/partners/[slug]` deep pages; `/case-studies` index + 3 stories
- **Pricing**: Free tier surfaced on home + `/pricing`, comparison table includes Free column
- **Newsletter**: inline signup on home/events/partners — now writes to **HubSpot** (was briefly Resend)
- **OG images**: site-wide + per-event/partner/case-study dynamic OG cards via `next/og`
- **Dashboard plan management**: in-app `ChangePlanDialog` (prorated preview via Stripe) + `CancelDialog` (retention + reason survey)
- **`/ops` console**: staff-only at `app.thegrowthhub.com.au/ops` — bookings, referrals, signups (+ cancellations in PR #45)
- **Sentry**: error tracking across critical server paths (Stripe webhook, provisioning, auth callback, referral credits)
- **PostHog**: SDK + identify + typed `track()` helper. Pageviews flow today; richer event hooks pending in #44

---

## Open PRs as of session end

| PR | Status | What it does | Apply notes |
|---|---|---|---|
| [#44](https://github.com/himayat-commits/growth-hub/pull/44) | open | Wire PostHog `track()` calls across nav + pricing + partners + events + case studies | None — just merge |
| [#45](https://github.com/himayat-commits/growth-hub/pull/45) | open | `/ops/cancellations` dashboard + new `subscription_cancellations` table | After merge: `npm run db:migrate` |

Both PRs are independent and can merge in either order.

---

## The 5-task plan (from end of session)

I planned these next steps and shipped 2.5 of them before context ran out:

| # | Task | Effort | Status |
|---|------|--------|--------|
| 1 | Verify HubSpot newsletter works in prod (no code) | 5 min | Awaits human test |
| 2a | PostHog dashboard in posthog.com UI (no code) | 30 min | Awaits human |
| 2b | Wire `track()` calls on nav + pricing + partners + events + case studies | 1 hr | ✅ **PR #44** |
| 3 | Cancellation log + `/ops/cancellations` | 3-4 hr | ✅ **PR #45** |
| **4a** | **Payload `Strategists` collection + assignment field** | 1-2 hr | ⏸ **Next** |
| 4b | User-facing strategist surface (`/profile`, `/messages` header, welcome) | 1-2 hr | Queued |
| 4c | `/ops/inbox` for strategists to reply | 2-3 hr | Queued |
| 5 | Playwright E2E that walks the 14-step wizard via WorkOS auth bypass | 4-6 hr | Queued |

### Full task-4 scope (Strategists)

The pain: messages are currently a single "Growth Hub Team" thread per user. No per-Strategist ownership, no assignment, no way for a strategist to see only their members' inboxes.

**PR 4a — foundation (start here)**
- New Payload collection `Strategists`: name, slug, role, photo (media), email, bio (richtext), calendlyUrl, active, order
- Drizzle migration: add `assigned_strategist_id` (text, optional) to `user_profiles`
- Ops console: add strategist column + assign dropdown to `/ops/signups`
- Auto-assignment: round-robin from `Strategists where active=true`, hook lives in `src/lib/auth/ensure-user-record.ts`

**PR 4b — user-facing**
- `/profile` page: "Your strategist" card with photo + bio + email
- `/messages` thread header: strategist name + photo replaces "Growth Hub Team"
- Welcome message seed: signed from assigned strategist's name (currently hard-coded `lib/auth/ensure-user-record.ts`)
- `/dashboard` greeting: "Hi {first}, {strategist} here"

**PR 4c — strategist-side inbox**
- `/ops/inbox` page: strategist sees only their assigned users' threads. Filter chips for "Unanswered (>24h)"
- Reply UI → writes `messages` row with `fromTeam=true, authorName=Strategist.name`
- Reply triggers `message_received` notification + Resend email to customer

**Migration concerns:**
- Existing `messages` rows have no strategist — backfill to a seeded "legacy" Strategist named "Growth Hub Team" so the UI doesn't break for pre-feature users
- Existing `user_profiles` — backfill round-robin to active strategists once on migration

### Full task-5 scope (E2E wizard test)

- Add `PLAYWRIGHT_TEST_TOKEN` env-gated middleware bypass in `src/proxy.ts` (hard-fail if `VERCEL_ENV === 'production'`)
- `tests/setup/seed-test-user.ts` — create/cleanup `playwright-user-001` profile + subscription rows
- `tests/e2e/wizard.spec.ts` — visit `/onboarding`, fill 14 steps with realistic-looking data, hit Submit, assert SSE stream completes
- Force `NEXT_PUBLIC_PROVISION_MODE=mock` for the test environment

---

## Env vars in Vercel (production)

| Var | Set when | Notes |
|---|---|---|
| `OPS_EMAILS` | this session | `waheed@himayat.com.au` — comma-separated allowlist for /ops |
| `NEXT_PUBLIC_POSTHOG_KEY` | this session | User added — PostHog public project key |
| `NEXT_PUBLIC_POSTHOG_HOST` | this session | PostHog host (US or EU) |
| `HUBSPOT_PORTAL_ID` | this session | `442026767` |
| `HUBSPOT_FORM_ID` | this session | `ab50c85e-03a7-4aa5-9de4-c89c901d1626` |
| `HUBSPOT_REGION` | this session | `ap1` — APAC. NOT NA1 (default would 404) |
| (legacy) `RESEND_API_KEY`, `STRIPE_*`, `WORKOS_*`, `BIRDEYE_*`, `DATABASE_URL`, `PAYLOAD_SECRET`, etc. | previously | Unchanged |

`RESEND_AUDIENCE_ID` is NOT set — newsletter now uses HubSpot, not Resend. Resend is still used by other routes (Stripe payment-failed email, `/api/notify-ops`, `/api/contact`).

---

## Operational notes

### Production data — already applied
- **15 partners** seeded across 6 categories (Technology, Creative & Media, Community & Delivery, Industry & Government, Accelerator & Capital, Research & Education)
- **3 case studies** seeded: Saffron Bakery, ACT Plumbing Solutions, NorthLine Care
- **All migrations through #20260522_partners_slug** applied to Neon

### Production scripts run this session
```bash
npm run partners:add-missing   # 9 created, 6 skipped → 15 total
npm run seed                   # added 2 missing case studies
```

### To apply after merging PR #45
```bash
npm run db:migrate             # adds subscription_cancellations table
```

### Cache revalidation
`REVALIDATION_SECRET` in local `.env.local` does **not** match prod. Production caches refresh via 1h TTL or via the Payload editor save hooks. Don't try `curl /api/revalidate` from local — it 401s.

---

## Recent codebase additions (this session)

```
src/
  app/
    (app)/
      ops/                          ← NEW staff console (PR #40, #45)
        layout.tsx                  guard via getOpsUser()
        page.tsx                    overview tiles
        bookings/page.tsx + BookingActions.tsx
        referrals/page.tsx + ReferralActions.tsx
        signups/page.tsx
        cancellations/page.tsx      (PR #45)
      plan/page.tsx                 in-app ChangePlanDialog + CancelDialog wiring
    (main)/
      events/                       full public events surface
      partners/                     redesigned + [slug] deep pages
      case-studies/                 index + [slug]
      opengraph-image.tsx           site-wide OG default
    api/
      newsletter/route.ts           HubSpot Forms submit (region-aware)
      change-plan/route.ts          stripe.subscriptions.update with proration
      cancel-subscription/route.ts  cancel_at_period_end + survey upsert
      ops/bookings/[id]/route.ts    PATCH status
      ops/referrals/[id]/route.ts   PATCH status
  components/
    billing/ChangePlanDialog.tsx    native <dialog>
    billing/CancelDialog.tsx        native <dialog>
    PostHogProvider.tsx + PostHogIdentify.tsx
    RevealOnScroll.tsx              fixes the .reveal opacity:0 bug
    NewsletterForm.tsx + NewsletterStrip.tsx
    TrackOnMount.tsx                generic mount-time PostHog fire
  lib/
    analytics.ts                    typed track() with event union
    auth/ops.ts                     OPS_EMAILS allowlist
    db/cancellations.ts             upsert helper
    events-data.ts                  Payload-event → render-shape adapter
scripts/
  add-missing-partners.ts           idempotent partner seed
```

---

## Quirks / gotchas (still relevant)

1. **Two route groups** (`(main)` apex, `(app)` subdomain). `/ops` is in `(app)` and added to `APP_PATHS` in `src/proxy.ts`.
2. **`.reveal` CSS** was opacity:0 forever — fixed in PR #36. New convention: `.reveal { opacity: 1 }` by default, `RevealOnScroll` mounts once in `(main)/layout.tsx` and progressively adds `.reveal-init` → `.in` for the animation.
3. **Defensive CMS helpers**: every `find()` / `findGlobal()` in `src/lib/cms/index.ts` is wrapped in try/catch returning null/[]. Pages handle null via optional chaining. Means schema changes ship before migrations apply without breaking the build.
4. **`payload migrate:create` needs a TTY** — Claude Code's sandbox can't run it. Write migrations manually in `src/migrations/`. Drizzle migrations are different — they live in `drizzle/` and are managed by `drizzle-kit`.
5. **Cancellation reasons** are stored in BOTH Stripe sub metadata AND `subscription_cancellations` table (post PR #45). The DB row is the source of truth for /ops; Stripe is a fallback if the webhook fires first.
6. **HubSpot region**: portal is `ap1`, not `na1`. The newsletter route reads `HUBSPOT_REGION` to construct the right submit host. Default `na1` would silently 404 in production if the env var isn't set.

---

## How to pick up tomorrow

1. **Check PR #44 + #45 are merged** — if not, merge them; PR #45 needs `npm run db:migrate` after.
2. **Start PR 4a (Strategists foundation)** — branch off master, plan above is detailed enough to execute directly. Schema → migration → Payload collection → ops assign UI → auto-assign hook.
3. **In parallel**: PostHog UI config (define the "Visitor → Member" funnel + dashboard — see plan above).
4. **After 4a lands**: 4b (user-facing) → 4c (strategist inbox) → then task 5 (E2E).

Good luck. 🌱
