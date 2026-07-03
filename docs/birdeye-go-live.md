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
- `BIRDEYE_API_KEY` — reseller-scoped API key (currently a placeholder).
- `BIRDEYE_RESELLER_ID` — reseller id (placeholder; route falls back to `demo-reseller`).
- Confirm `BIRDEYE_API_HOST` (we assume `https://api.birdeye.com/resources`).
- The canonical customer dashboard deep-link, ideally with a `{businessNumber}`
  slot (for `BIRDEYE_DASHBOARD_URL_TEMPLATE`).
- Whether a **sandbox / deletable test sub-accounts** exist, and whether each
  `create_subaccount` is billable.

### Contract assumptions to validate against real docs/sandbox
The payload builders in [`payloads.ts`](../src/lib/birdeye/payloads.ts) are
blueprint-derived. The code cannot self-verify these — confirm before live:
1. **Create response shape** — does `POST /v1/signup/reseller/subaccount` return
   `businessId`, `businessNumber`, both, or nested? Adjust
   [`extractIdentifiers()`](../src/lib/birdeye/client.ts) to match.
2. **businessId vs businessNumber** — which value goes in the `PUT /v1/business/{id}`
   path, the `x-business-number` header, and `businessIds[]`. The code currently
   threads one value for all three.
3. **Idempotency** — does create honour `externalReferenceId` (we send it)? Is
   there a GET to look up a sub-account by external ref / email (orphan recovery)?
4. Exact endpoints / required fields / API versions for all six calls; the auth
   header (`x-api-key` vs token); the error envelope (the `code` numbers mapped in
   `ERROR_HINTS`); whether media accepts remote URLs; the `userRole` enum;
   field formats (hours day index, `HH:MM`, special-hours `MM/DD/YYYY`).
5. Confirm module **entitlement** + **Webchat** truly can't be set via the public
   API (today they're routed to ops — see Phase 3 / notify-ops).

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
| `OPS_EMAILS` | already `waheed@himayat.com.au`; this is the live allowlist |

Then **remove** `NEXT_PUBLIC_PROVISION_MODE` from Vercel (it's now only a
transitional fallback in code; delete the fallback in a later cleanup).

---

## Phase 2 — Staged rollout

The effective per-call mode is resolved in
[`/api/provision`](../src/app/api/provision/route.ts) via
`resolveEffectiveMode(getProvisionMode(), isOpsEmail(user.email))`.

1. **`live_allowlist` (internal only).** Set `PROVISION_MODE=live_allowlist`.
   Only `OPS_EMAILS` users hit the real API; every other paid user transparently
   stays on mock. Run the smoke test below as `waheed@himayat.com.au`.
2. **Pilot.** Add a few friendly paying customers' emails to `OPS_EMAILS`.
3. **`live` (all paid).** Set `PROVISION_MODE=live`. The allowlist becomes an
   override only.

The Playwright E2E user (`playwright@test.himayat.com.au`) is **not** on the
allowlist and runs under `mock`, so the suite stays green throughout.

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

- **Monitor:** `provisioning_logs` (failures: `WHERE ok = false`; cost: count of
  distinct `create_subaccount` rows; ops gaps: `kind='notify_ops' AND ok=false`).
  Sentry tags `area:provision` with `step` + `mode` — set an alert on the first
  `level:error`.
- **Partial runs:** surface as the "Setup needs attention" banner on `/services`
  and an `action_required` ops email; the user can retry safely (resume skips create).
- **Rollback:** set `PROVISION_MODE=mock` in Vercel. Next request returns
  deterministic mock responses with zero real API calls.

---

## Access model (shipped)

- **Paid users** → provision a real Birdeye account (this flow).
- **Free users** → the action-plan report (`/onboarding/action-plan`) + Foundations
  upgrade CTA. They never call `/api/provision`, which additionally enforces
  `isActive(sub)` server-side. Provisioning is strictly paid-only because each
  `create_subaccount` is a billable reseller seat.
