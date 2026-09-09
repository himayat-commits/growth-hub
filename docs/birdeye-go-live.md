# Birdeye provisioning — go-live runbook

The wizard and orchestrator are built and hardened (auth, idempotency, resume,
partial-failure handling, ops handoff). What remains before real Birdeye
accounts are created is **external**: getting reseller API access, validating
the request contract, and flipping the switch in stages. This is that checklist.

The deployment switch is the server-only env var **`PROVISION_MODE`**
(`mock` | `live_allowlist` | `live`), read at request time in
[`getProvisionMode()`](../src/lib/birdeye/client.ts). Rollback to `mock` is
instant — no code change, no rebuild.

---

## Phase 0 — Get credentials + validate the contract (blocking)

### Credentials to obtain from Birdeye reseller account management
Validated read-only against the live API on 2026-07-05 (GET business +
GET child/all; no create calls made):
- ✅ `BIRDEYE_API_KEY` — real key set in Vercel Production; returns 200.
- ✅ `BIRDEYE_RESELLER_ID` — the account's business id; accepted as `pid` by
  `GET /v1/business/child/all`, which listed the account's existing child
  businesses (reseller scope confirmed). Set in Vercel Production.
- ✅ `BIRDEYE_API_HOST` — `https://api.birdeye.com/resources` confirmed.
- ✅ Auth mechanism — BOTH the `x-api-key` header (what `client.ts` sends)
  and `?api_key=` query param return 200. No client change needed.
- Bonus: `GET /v1/business/child/all?pid={resellerId}` works — usable for
  orphan recovery (find a created-but-unpersisted sub-account by name/date).
- Still to confirm with Birdeye: the canonical customer dashboard deep-link
  (`BIRDEYE_DASHBOARD_URL_TEMPLATE` with a `{businessNumber}` slot), and
  whether **sandbox / deletable test sub-accounts** exist and whether each
  `create_subaccount` is billable.

### Contract assumptions to validate against real docs/sandbox
The payload builders in [`payloads.ts`](../src/lib/birdeye/payloads.ts) are
blueprint-derived. The remaining unknowns all involve WRITE calls — they can
only be confirmed by the Phase-5 smoke test (one disposable account) or by
Birdeye support answering directly:
1. **Create response shape** — does `POST /v1/signup/reseller/subaccount` return
   `businessId`, `businessNumber`, both, or nested? Adjust
   [`extractIdentifiers()`](../src/lib/birdeye/client.ts) to match. (The GET
   business response uses a numeric `businessId`; child rows use `id`.)
2. **businessId vs businessNumber** — which value goes in the `PUT /v1/business/{id}`
   path, the `x-business-number` header, and `businessIds[]`. The code currently
   threads one value for all three.
3. **Idempotency** — does create honour `externalReferenceId` (we send it)?
   (Orphan recovery fallback exists regardless: child/all listing.)
4. Required fields / API versions for the five write calls; the error envelope
   (the `code` numbers mapped in `ERROR_HINTS`); whether media accepts remote
   URLs; the `userRole` enum; field formats (hours day index, `HH:MM`,
   special-hours `MM/DD/YYYY`). (Auth header: ✅ confirmed above.)
5. Confirm module **entitlement** + **Webchat** truly can't be set via the public
   API (today they're routed to ops — see Phase 3 / the ops handoff).

Until 1–3 are confirmed, keep `PROVISION_MODE=mock` in production.

---

## Phase 1 — Configure Vercel env (Production + Preview)

| Var | Go-live value |
|-----|---------------|
| `PROVISION_MODE` | `mock` → `live_allowlist` → `live` (staged, below) |
| `BIRDEYE_API_KEY` | real reseller key (secret) |
| `BIRDEYE_RESELLER_ID` | real reseller id |
| `BIRDEYE_API_HOST` | confirmed host |
| `BIRDEYE_DASHBOARD_URL_TEMPLATE` | e.g. `https://app.birdeye.com/businesses/{businessNumber}/dashboard` |
| `OPS_NOTIFICATION_EMAIL` | ops inbox (defaults to `hello@himayat.com.au`) |
| `OPS_NOTIFY_WEBHOOK` | optional Slack/webhook URL |
| `PROVISION_ALLOWLIST` | comma-separated customer emails allowed to go live under `live_allowlist` (separate from `OPS_EMAILS`) |
| `OPS_EMAILS` | staff console access (`/ops`, admin by default) — **not** the live allowlist; only its fallback when `PROVISION_ALLOWLIST` is unset |
| `CRON_SECRET` | required — auths the daily `/api/cron/provision-retry` auto-retry |
| `HEALTH_SECRET` | optional — headless access to `/api/health/provisioning` |

Then **remove** `NEXT_PUBLIC_PROVISION_MODE` from Vercel. The code no longer
reads it at all; `GET /api/health/provisioning` reports a `fail` while it is
still set, because a public var that looks like the switch invites someone to
flip it and believe provisioning changed.

---

## Phase 2 — Staged rollout

The effective per-call mode is resolved in
[`lib/birdeye/allowlist.ts`](../src/lib/birdeye/allowlist.ts) via
`resolveEffectiveMode(getProvisionMode(), isProvisionAllowlisted(email))`, and
every run path (user POST, ops re-run, cron) resolves against the **target
customer's** email. `isProvisionAllowlisted` reads `PROVISION_ALLOWLIST`; only
when that var is unset does it fall back to `OPS_EMAILS` (back-compat — the
health check warns about it under `live_allowlist`).

1. **`live_allowlist` (internal only).** Set `PROVISION_MODE=live_allowlist`
   and `PROVISION_ALLOWLIST=waheed@himayat.com.au`. Only that address hits the
   real API; every other paid user transparently stays on mock. Run the smoke
   test below as `waheed@himayat.com.au`.
2. **Pilot.** Add a few friendly paying customers' emails to
   `PROVISION_ALLOWLIST`. **Never** add customers to `OPS_EMAILS` — that grants
   the `/ops` staff console (a bare email parses as `admin`: signups, inbox,
   orders, referral credits, every member's data).
3. **`live` (all paid).** Set `PROVISION_MODE=live`. The allowlist becomes an
   override only.

### What happens to customers who signed up while production was `mock`

A mock run records `runStatus: "provisioned"` with a **synthetic** business
number and `provisioning.mode: "mock"` (rows written before `mode` existed
count as mock). Nothing exists in Birdeye. The portal tells those customers
"Your setup is with our team" (no number, no dashboard link, no "check your
email" claim), the ops email is prefixed `[MOCK]`, and `/ops/provisioning`
counts them in the **Mock-provisioned (needs real run)** tile.

They are **not stuck**: once their effective mode is `live`, `/api/provision`,
the ops re-run and the cron all treat the mock row as not-provisioned
(`isProvisionedFor` in [`lib/birdeye/provisioned.ts`](../src/lib/birdeye/provisioned.ts)),
and the runner discards the mock identifiers before running so
`create_subaccount` executes for real. Until then, build the account manually
from the `[MOCK]` handoff email and tick the tasks off in the ops console.

### Duplicate-create protection (live)

- `create_subaccount` is never retried in-process (`retries: 0`) — a gateway
  502 after Birdeye committed would otherwise replay into a second account.
- A create that ends transient (network / 429 / 5xx) or returns 2xx with no
  extractable id is recorded as `provisioning.unresolvedCreate` (raw response
  kept, ~4 KB) and the run lands `failed`. The runner then **refuses** to
  create again with "A previous create attempt has an unknown outcome…".
- Pre-create guard: if `provisioning_logs` already has a **live**
  `create_subaccount ok=true` row for the user and no business number is
  persisted, the runner treats it the same way (an orphan may exist).
- Only ops clears it: on `/ops/provisioning/[userId]` the button **"I checked
  Birdeye — no account exists. Clear and re-run"** (after confirming via the
  reseller console or `GET /v1/business/child/all`) sends
  `{ confirmNoOrphan: true }` to the re-run route, which records
  `unresolvedCleared { by, at }` and ignores create-log rows older than `at`.
  If an orphan **does** exist, record its number in `onboarding_states` by SQL
  instead and re-run (create is skipped when a business number is present).
- Both the user route and the re-run re-read the row **after** taking the
  lease and re-check the short-circuits, and the wizard autosave merges the
  server-owned `provisioning` block inside the upsert statement — so neither a
  double-click nor a second tab's debounced save can erase a freshly created
  id.
- A failed create always sends an `action_required` ops handoff with a
  `create_failed` task; a paid customer with no account is never silent.

The Playwright E2E user (`playwright@test.himayat.com.au`) is **not** on
`PROVISION_ALLOWLIST` and runs under `mock`, so the suite stays green
throughout `live_allowlist`. (Under `PROVISION_MODE=live` it would go live like
everyone else — run E2E against a `mock` environment.)

---

## Phase 5 — Live smoke test (one disposable account)

1. As an allowlisted user, run the full wizard with a throwaway business profile.
2. Watch the SSE stream complete on `/onboarding/review`; confirm it lands on
   `/onboarding/done` with a **real** business number.
3. Verify the "Open Birdeye dashboard" deep-link lands in the real account.
4. Confirm the ops checklist email arrived (`OPS_NOTIFICATION_EMAIL`).
5. Inspect one clean run in Neon: `provisioning_logs WHERE user_id = '<id>' ORDER BY created_at` — every `ok = true`.
6. Ask Birdeye to delete/deactivate the disposable sub-account.

### Verify idempotency
Re-POST/relaunch for the same user: it must **short-circuit** (`alreadyProvisioned`)
or **resume** (skip `create_subaccount`) — never create a second sub-account.
Confirm by counting `create_subaccount` rows in `provisioning_logs` for that user (should stay 1).

---

## Observability & rollback

- **Ops console:** `/ops/provisioning` — every run with status chips
  (running/stalled/partial/failed/provisioned), per-user step timeline from
  `provisioning_logs`, the tracked manual-step checklist
  (`provisioning_tasks` — module entitlements, Webchat, Apple, FAQs, tags,
  retries), one-click **Re-run provisioning** and **Resend handoff**.
- **Config health:** `GET /api/health/provisioning` (ops session or
  `?secret=HEALTH_SECRET`) — fails when live mode is missing credentials or
  Stripe price IDs are absent; the same checks warn at boot via
  instrumentation.
- **Auto-retry:** daily Vercel cron `/api/cron/provision-retry` (20:00 UTC — Hobby-plan crons are capped at once/day; tighten to hourly on Pro) re-runs
  `partial`/crashed runs older than 1h with `attempts < 3` (user Resume is
  uncapped; only automation respects the ceiling). Mutual exclusion with
  user/ops runs via the `lockedUntil` lease.
- **Monitor:** `provisioning_logs` (failures: `WHERE ok = false`; cost: count of
  distinct `create_subaccount` rows; ops gaps: `kind='notify_ops' AND ok=false`
  — also surfaced as a banner on the ops detail page).
  Sentry tags `area:provision` with `step` + `mode` — set an alert on the first
  `level:error`; partial terminal runs emit a `level:warning`.
- **Partial runs:** surface as the "Setup needs attention" banner on `/services`
  and an `action_required` ops email; the user can retry safely (resume skips
  create). After 3 failed attempts the run **escalates** (`escalatedAt`): user
  surfaces flip to "We're on it" and ops owns the tail.
- **Rollback:** set `PROVISION_MODE=mock` in Vercel. Next request returns
  deterministic mock responses with zero real API calls.

### Ops handoff (changed)

The old open `POST /api/notify-ops` endpoint is **gone** (it was
unauthenticated). The runner now calls `sendOpsHandoff()`
(`src/lib/ops/notify.ts`) directly: it writes the durable
`provisioning_tasks` checklist first, then webhook + Resend email (single
source of truth for both — `src/lib/ops/handoff.ts`), with a console
fallback in dev.

---

## Access model (shipped)

- **Paid users** → provision a real Birdeye account (this flow).
- **Free users** → the action-plan report (`/onboarding/action-plan`) + Foundations
  upgrade CTA. They never call `/api/provision`, which additionally enforces
  `isActive(sub)` server-side. Provisioning is strictly paid-only because each
  `create_subaccount` is a billable reseller seat.
