# Security review fixes + portal hardening, community, RSVP integrity, ops RBAC, consent

Implements the prioritised fixes from the full portal review (P0 security/billing → P2 hardening), plus several P1 product items. Full findings + status live in the review plan; this PR is the code.

> ⚠️ **Verification status:** all changes pass `tsc --noEmit` and `eslint`. They have **not** been runtime-tested — the review was done from a handoff bundle whose `.env.local` points at the production DB, so the app was never booted. **Deploy to staging and run the checks in `STAGING.md` before promoting to production.** See `DEPLOY_CHECKLIST.md`.

## What's in here

### P0 — Security & billing correctness
- **Auth + ownership** on `POST /api/provision` and `POST /api/notify-ops` (`withAuth()` + `user.id === onboardingId`). `notify-ops` logic extracted to `lib/ops/notify.ts` and called in-process by provision, removing the user-controllable `origin`-header dependency.
- **Ops-inbox IDOR closed** — new `lib/auth/ops-inbox.ts` (`getOpsStrategistSlug`, `canAccessMemberThread`) enforced on the inbox thread page + reply API; the list view was DRY'd onto the same helper.
- **Stripe idempotency keys** on checkout (customer + session), change-plan commit, and both referral balance credits (fixes a webhook-retry double-credit).
- **Webhook retry correctness** — cancellation-audit + referral-credit failures now propagate (→ 500 → Stripe retry) instead of catch-and-return-200; referral credit decoupled from the one-shot `newlyActive` guard so retries re-attempt.
- **HTML-escaped** all user input in the `/api/contact` email.

### Security hardening (P2)
- **Rate limiting** on public `contact` / `newsletter` / `expo-apply` (`lib/rate-limit.ts`, in-memory, 5/min/IP, fail-open). Best-effort per-instance — see note in the file re: Upstash for cross-instance.
- **Constant-time token compare** (`timingSafeEqual`) on `/api/test/auth`.
- **Birdeye client resilience** — `callBirdeye` now has a 15s timeout + 3-attempt exponential backoff on network/5xx/rate-limit; redundant inline retry in `/api/provision` removed.

### Ops RBAC (P2 / review S7)
- `OPS_EMAILS` now supports `email:role` (`admin` | `support`). **A bare email = admin (back-compat)** — no one loses access until you assign `support`.
- `support` can view everything, triage bookings, and reply in the inbox; **referral crediting and strategist reassignment are admin-only** (server 403 + UI hidden for support). Active role shown in the ops header.

### Community (P1)
- New `communityLinks` group (Slack/Facebook/WhatsApp/forum) on the SiteSettings CMS global; `/benefits` renders a real "Join the community" block when links are set (hidden otherwise); a `community` notification fires on first 100%-profile completion. **Editors fill the links in Payload admin.**

### Event RSVP integrity + ops roster (P1)
- Added the **compound primary key** `(user_id, event_id)` on `event_rsvps` and switched `rsvpToEvent` to an idempotent upsert — concurrent double-RSVPs are now impossible at the DB level.
- New `/ops/events` page: per-event attendee roster (name/email/plan + captured attribution).

### Privacy & consent (P2 / review S9)
- **Opt-in cookie-consent banner** (`ConsentBanner` + `ConsentGate` + `lib/consent.ts`) gates the GA4/Meta/LinkedIn pixels on the public site — nothing loads until the visitor accepts. PostHog is **not** gated (privacy-configured); gate it too for full coverage.
- New **`/privacy` page** (the banner links to it). Plain-English baseline — **have it reviewed before relying on it.**

## Migrations (run automatically on deploy via `prod-migrate`)
1. **Drizzle `drizzle/0013_add_event_rsvps_pk.sql`** — ⚠️ includes a **dedupe `DELETE`** that collapses any existing duplicate `event_rsvps` rows (keeps the earliest) before adding the PK. Review the row count on staging first.
2. **Payload `src/migrations/20260623_site_settings_community_links.ts`** — adds the `community_links_*` columns to `site_settings`.

## Config / env changes
- `OPS_EMAILS` — optionally add `:admin` / `:support` per entry.
- Consent default is **opt-in** (privacy-correct; switch to implied-consent if preferred).
- (Optional) back the rate limiter with Upstash for cross-instance limiting.

## Out of scope / follow-ups
Public `mailto:`→API RSVP unification (product/privacy call), RSVP reminder emails (cron), goal-based module sequencing on `/services` (mapping needs product input), the **Payload-CMS** role/access-rules (distinct from ops RBAC; needs its own migration + editor/admin policy), Birdeye resume-from-failed-step, gating PostHog, and **rotating the exposed `.env.local` secrets**.

🤖 Generated with [Claude Code](https://claude.com/claude-code)
