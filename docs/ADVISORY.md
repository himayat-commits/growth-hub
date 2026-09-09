# Advisory triage — intake → routing → 360 → outcome → CRM

How a member's request for help becomes a held, recorded conversation. Built
against §3.4 of the Sep 2026 GTM review (F4.1–F4.12). Portal-native — the
HubSpot Meetings shortcut was rejected because it bypasses `service_bookings`
(dashboard engagements, the one-free-call rule, referral qualification and the
ops console would all go blind).

## 1. Intake — `/services/[slug]` → `POST /api/service-bookings`

The form (`src/app/(app)/services/[slug]/BookingForm.tsx`) captures:

| Field | Column | Notes |
|---|---|---|
| **Need** (required) | `service_bookings.need varchar(32)` | One of `starting_business`, `behind_on_digital`, `marketing_growth`, `website`, `funding_grants`, `other` (`src/lib/advisory/needs.ts`). Prefilled from `user_profiles.help_areas` via `needFromHelpAreas`. |
| **Preferred slots** (≥1, ≤3) | `preferred_slots jsonb` | `[{ day: 'YYYY-MM-DD', window: 'morning'\|'midday'\|'afternoon' }]` |
| Notes (optional) | `notes` | Member's own words — never overwritten by ops. |

The route zod-validates the body, rate-limits 5/10 min per member, then:

1. **Growth Call lifetime rule (F4.8).** `growth-call` is a Free-tier benefit,
   **one per member for life**: any non-cancelled growth-call row → `409`.
   Other services keep the "one open request per slug" rule
   (`hasEverBookedGrowthCall` / `hasOpenBookingFor` in `src/lib/db/bookings.ts`).
2. **Routing.** `strategist_slug` = `profile.assignedStrategistId`. A still-
   unassigned member is matched now via `pickNextStrategistSlug(need)` and the
   profile is updated.
3. Inserts the `requested` row, drops an in-app notification.
4. **Emails.** Ops (`OPS_NOTIFICATION_EMAIL`) with the strategist **CC'd**
   (F4.2) and a button to `/ops/members/<userId>` — no `replyTo=member` any
   more (F4.10). The member gets a confirmation ("We've got your … request").
5. **HubSpot** (fire-and-forget): contact upsert + timeline note
   `Booked <service>: need=…, slots=…, notes=…` — see `docs/HUBSPOT_CRM.md`.

Referral qualification **no longer happens on request** — see §4.

## 2. Routing — Strategist specialties (F4.5)

`Strategists.specialties` (Payload hasMany select, same values as the need
taxonomy). `pickNextStrategistSlug(need?)` in
`src/lib/auth/ensure-user-record.ts`:

1. candidates = active strategists whose `specialties` include `need`
   (falls back to all active strategists when nobody covers it, or no need);
2. least-loaded by current `user_profiles.assigned_strategist_id` count;
3. Payload `order` ascending breaks ties.

Called at first sign-in (no need known yet → pure least-loaded) and from the
booking POST for unassigned members (need known). `/services` shows a
**"Your strategist"** card (photo, role, specialties, bio, Calendly) and the
service detail page shows it beside the form (F4.9).

Payload migration `src/migrations/20260909_strategists_specialties.ts` must be
applied by hand (raw SQL) **before** deploying — see the SQL in that file.

## 3. Adviser 360 — `/ops/members/[userId]` (F4.3)

One page per member: WorkOS name/email (via `getMemberContact`, which falls
back to the WorkOS User Management API because Free members have no
`subscriptions` row), profile (business, stage, industry, help areas, city,
language), plan tier/status, assigned strategist + specialties + Calendly,
onboarding-wizard summary (`loadOnboardingRow`: business name, categories,
provisioning status/mode), every booking with need/slots/prep notes/outcome and
inline `BookingActions`, the last 30 messages of the thread, and a HubSpot
contact search link
(`https://app-ap1.hubspot.com/contacts/442026767/objects/0-1/views/all/list?query=<email>`).

Linked from every `/ops/bookings` row (member cell) and the `/ops/inbox/[userId]`
header. Access: ops layout gate + `canAccessMemberThread` (strategists see only
their own members; admins see everyone).

## 4. Status workflow + outcome — `PATCH /api/ops/bookings/[id]` (F4.6)

Server-side transition map (`BOOKING_TRANSITIONS`, `src/lib/db/bookings.ts`):

```
requested  → scheduled | cancelled
scheduled  → completed | cancelled
completed  → (terminal)
cancelled  → requested            # re-open a mistaken cancel
in_progress→ completed | cancelled  # legacy rows only; never a target
```

Illegal moves → `409`. Every status change stamps `status_changed_by` (ops
email) and `status_changed_at`. Body also accepts `preSessionNotes` (ops-only
prep, saveable at any time), `outcome` (required to complete) and `nextStep`.

Side effects on `scheduled` / `completed` (best-effort):

- in-app notification kind `booking_status` **if** `profile.notif_booking`;
- email "Your `<service>` is scheduled" / "… is complete" (with next step).

On `completed` for `growth-call`: **the referral qualifies here** —
`qualifyReferral(userId)` (to be renamed
`qualifyReferralForCompletedGrowthCall` when the referral branch merges) and
both sides are notified. A no-show can no longer unlock the A$50 credit.

On `completed` the outcome + next step are also written to HubSpot as a note.

## 5. CRM — HubSpot contact + notes (F4.4)

`src/lib/hubspot/crm.ts` (`HUBSPOT_PRIVATE_APP_TOKEN`). Called from first
sign-in (contact upsert), booking POST (upsert + note) and ops PATCH completed
(note). Fire-and-forget, 10 s timeout, Sentry on failure, single console.warn
when the token is unset. Custom `gh_*` properties, scopes and the one-off
`ensureProperties()` helper are documented in `docs/HUBSPOT_CRM.md`.

## Migrations shipped with this feature

- Drizzle `drizzle/0018_service_bookings_triage.sql` — runs automatically via
  `scripts/prod-migrate.mjs` on the production build.
- Payload `src/migrations/20260909_strategists_specialties.ts` — **apply by
  hand before deploy** (creates `payload.enum_strategists_specialties` +
  `payload.strategists_specialties`).

## Not done / follow-ups

- F4.11: paid services remain manual (price is display text). Documented only.
- F4.12: profile copy about "matched when you book" — owned by the copy agent.
- API tests from the review's "highest-value test" are not in this branch.
