# HubSpot CRM sync (members, bookings, outcomes)

`src/lib/hubspot/crm.ts` mirrors Growth Hub members into HubSpot portal
**442026767** (ap1) so the team sees who booked, why, and what happened —
without opening the portal's ops console. Complements the existing form-based
flows (newsletter, contact, expo) which go through HubSpot Forms, not the CRM
API.

## What gets written, and when

| Trigger | Code | HubSpot write |
|---|---|---|
| First sign-in (`created`) | `src/app/auth/callback/route.ts` | Contact upsert: email, firstname, lastname, `gh_plan_tier=free`, `gh_strategist`, `gh_workos_id` |
| Member requests a service | `POST /api/service-bookings` | Contact upsert (plan, stage, industry, help areas + chosen need, strategist, company) **+ note** `Booked <service> (gh_booking_id=#N)` with need / slots / strategist / notes |
| Ops marks a booking completed | `PATCH /api/ops/bookings/[id]` | Note `Completed <service> (gh_booking_id=#N)` with actor, outcome, next step |

All calls are **fire-and-forget** (`void syncContact(...)` / `void syncNote(...)`):
10 s timeout, errors go to Sentry (`area: hubspot.crm`), never block or fail
the member-facing response. When `HUBSPOT_PRIVATE_APP_TOKEN` is unset every
call is a no-op and one `console.warn` is emitted per process.

Notes carry `gh_booking_id=#N` in the body so a replayed request is
recognisable when scanning a timeline (HubSpot has no idempotency key for
notes; duplicates are cosmetic).

## Setup (owner, once)

### 1. Private app + scopes

HubSpot → Settings → Integrations → Private Apps → the existing Growth Hub app
(the same token already used for transactional email). Add scopes:

| Scope | Needed for |
|---|---|
| `crm.objects.contacts.write` | `POST /crm/v3/objects/contacts/batch/upsert`, `POST /crm/v3/objects/notes` (notes are written under the contacts scope per the spec) |
| `crm.objects.contacts.read` | `POST /crm/v3/objects/contacts/search` (note-by-email lookup), `GET /crm/v3/properties/contacts/{name}` |
| `crm.objects.notes.write` | Belt-and-braces for note creation on portals that enforce the object-specific scope |
| `crm.schemas.contacts.write` | **Optional** — only if you run `ensureProperties()` to auto-create the `gh_*` properties. Remove afterwards if you prefer least privilege. |

Set the token as `HUBSPOT_PRIVATE_APP_TOKEN` in Vercel (Production) — it is
already the transactional-email token, so this is usually just a scope change
+ token rotation.

### 2. Custom contact properties

HubSpot rejects an upsert that references a property that doesn't exist, so
these must be created **before** the code goes live (group: Contact
information, or any group you prefer):

| Internal name | Label | Type / field type | Options |
|---|---|---|---|
| `gh_plan_tier` | GH plan tier | enumeration / dropdown select | `free`, `foundations`, `growth`, `accelerate` |
| `gh_stage` | GH business stage | enumeration / dropdown select | `idea`, `just-starting`, `running`, `established` |
| `gh_industry` | GH industry | enumeration / dropdown select | `retail`, `services`, `food`, `creative`, `trades`, `other` |
| `gh_help_areas` | GH help areas | enumeration / multiple checkboxes | `website`, `marketing`, `branding`, `pricing`, `systems`, `funding`, `confidence`, `starting_business`, `behind_on_digital`, `marketing_growth`, `funding_grants`, `other` |
| `gh_strategist` | GH strategist | string / single-line text | — (strategist slug) |
| `gh_workos_id` | GH member id | string / single-line text | — (WorkOS id; open `https://app.thegrowthhub.com.au/ops/members/<id>`) |

Standard properties also written: `email` (id property), `firstname`,
`lastname`, `company`.

Either create them by hand in Settings → Properties → Contact properties, or
run the helper once from a Node REPL / one-off script with the token in env
(**not** wired into the app; needs `crm.schemas.contacts.write`):

```ts
import { ensureProperties } from '@/lib/hubspot/crm';
const { created, existing } = await ensureProperties(); // idempotent
```

If you later add a value to `user_profiles.help_areas` or the need taxonomy
(`src/lib/advisory/needs.ts`), add the option to `gh_help_areas` too —
HubSpot drops unknown enumeration values with a 400 on the whole upsert.

### 3. Verify

1. Sign in with a fresh test account → a contact appears within seconds with
   `gh_plan_tier=free`.
2. Book a Growth Call → the contact gains `gh_help_areas` and a "Booked Growth
   Call" note on its timeline.
3. In `/ops/bookings` mark it completed with an outcome → a "Completed" note.
4. Failures: Sentry issues tagged `area:hubspot.crm`; the request that
   triggered them still succeeded for the member.

## Request shapes (verified against HubSpot's public OpenAPI specs)

Source: `github.com/HubSpot/HubSpot-public-api-spec-collection`,
`PublicApiSpecs/CRM/{Contacts,Notes,Properties}/Rollouts/*/v3/*.json`.

```http
POST https://api.hubapi.com/crm/v3/objects/contacts/batch/upsert
Authorization: Bearer <token>
{ "inputs": [ { "id": "<email>", "idProperty": "email",
                "properties": { "email": "...", "firstname": "...", "gh_plan_tier": "free", ... } } ] }
→ 200 { "status": "COMPLETE", "results": [ { "id": "12345", "new": true, "properties": {...} } ] }
→ 207 same + "errors": [...], "numErrors": n      (partial failure; crm.ts throws)

POST https://api.hubapi.com/crm/v3/objects/notes
{ "properties": { "hs_timestamp": "2026-09-09T02:00:00.000Z", "hs_note_body": "Booked Growth Call…" },
  "associations": [ { "to": { "id": "12345" },
                      "types": [ { "associationCategory": "HUBSPOT_DEFINED", "associationTypeId": 202 } ] } ] }
→ 201 { "id": "67890", "properties": {...}, "createdAt": "..." }
   (202 = HubSpot-defined association type "note → contact")

POST https://api.hubapi.com/crm/v3/objects/contacts/search
{ "filterGroups": [ { "filters": [ { "propertyName": "email", "operator": "EQ", "value": "<email>" } ] } ],
  "properties": ["email"], "limit": 1 }
→ 200 { "total": 1, "results": [ { "id": "12345", "properties": {...} } ] }

GET  https://api.hubapi.com/crm/v3/properties/contacts/gh_plan_tier   → 200 | 404
POST https://api.hubapi.com/crm/v3/properties/contacts
{ "name": "gh_plan_tier", "label": "GH plan tier", "type": "enumeration", "fieldType": "select",
  "groupName": "contactinformation", "options": [ { "label": "free", "value": "free", "hidden": false, "displayOrder": 0 }, ... ] }
```

## Not covered (deliberately)

- Messages (`/messages` thread) are not mirrored — volume and privacy; the
  360 page links to the thread instead.
- No inbound sync from HubSpot → portal.
- No deal/pipeline objects; paid services stay manual for launch (F4.11).
