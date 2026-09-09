# Transactional email

Every email the app sends goes through one function, `sendEmail()` in
`src/lib/email/send.ts`. It picks a provider from env vars, never throws, and
returns `{ ok, provider, id? | error }`. Callers decide what a failure means
(the contact form returns 503/500; everything else is best-effort and logs).

## Why

Production Vercel never had `RESEND_API_KEY`, so for months every
transactional email — welcome, RSVP confirmation, reminders, order
confirmations, ops handoffs, payment-failed notices, contact enquiries — was
silently skipped by `if (!resend) return` guards. The owner wants **HubSpot**
(portal 442026767, region ap1) to be the sender. Resend stays as a fallback.

## Routing

| `EMAIL_PROVIDER` | Result |
| --- | --- |
| unset / `auto` | HubSpot if `HUBSPOT_PRIVATE_APP_TOKEN` **and** `HUBSPOT_TRANSACTIONAL_EMAIL_ID` are set; else Resend if `RESEND_API_KEY` is set; else **none** |
| `hubspot` | HubSpot, or **none** if its two vars are missing |
| `resend` | Resend, or **none** if `RESEND_API_KEY` is missing |

**none** → `sendEmail()` returns `{ ok: false, provider: 'none' }`, logs one
`console.error` per process and raises one Sentry message
(`email: no provider configured`). Config health (`/api/health/provisioning`,
startup instrumentation) reports `email_provider` as **fail**.

## How HubSpot sending works

HubSpot's only code path for transactional mail is the **Single-send API**:

```
POST https://api.hubapi.com/marketing/v3/transactional/single-email/send
Authorization: Bearer <private app token with scope transactional-email>

{
  "emailId": 123456789,                         // int64 — the transactional email's id
  "message": {
    "to": "member@example.com",
    "from": "Growth Hub <noreply@himayat.com.au>",
    "replyTo": ["hello@himayat.com.au"]         // array of strings
  },
  "customProperties": {
    "subject":   "Welcome to The Growth Hub",
    "body_html": "<div>…fully rendered HTML…</div>",
    "preheader": "first 140 chars of the plain-text version"
  }
}
```

(Shape verified against HubSpot's published OpenAPI spec,
`PublicApiSpecs/Marketing/Transactional Single Send/.../v3/transactionalSingleSend.json`:
`emailId` int64 required, `message.to` required, `replyTo`/`cc`/`bcc` are
`string[]`, `customProperties` is a free map rendered as `{{ custom.NAME }}`.)

It sends a **pre-built HubSpot email** identified by `emailId`, personalised
through `customProperties`. It does **not** accept an arbitrary HTML body or
attachments. So the app keeps **one generic template** whose subject and body
are tokens, and passes the rendered HTML as a custom property.

A 2xx with `sendResult` other than `SENT`/`QUEUED` (e.g. `ADDRESS_OPTED_OUT`,
`INVALID_FROM_ADDRESS`, `UNCONFIGURED_SENDING_DOMAIN`) is treated as a failure.
Requests time out after 10 s. Failures go to Sentry tagged
`area=email provider=hubspot`.

### Requirements on the HubSpot side

- **Transactional Email add-on** on the portal (Marketing Hub Professional /
  Enterprise add-on). Without it the endpoint returns 403.
- The **`from` domain must be a connected sending domain** in HubSpot
  (Settings → Website → Domains & URLs → Connect a domain → Email sending).
  The app sends from `noreply@himayat.com.au` by default (`DEFAULT_FROM`),
  plus `hello@himayat.com.au` for the payment-failed notice, so connect
  `himayat.com.au`. An unconnected domain surfaces as
  `sendResult: UNCONFIGURED_SENDING_DOMAIN` / `INVALID_FROM_ADDRESS`.

### Setup steps

1. **Create the template.** Marketing → Email → Create email → choose
   **Transactional** (the type only appears once the add-on is active).
   Name it **"Growth Hub — system email"**.
2. **Subject**: exactly `{{ custom.subject }}`.
   **Preview text**: `{{ custom.preheader }}` (optional).
3. **Body**: delete the default modules, add a single **Rich text** module and
   in its source view put:

   ```
   {{ custom.body_html|safe }}
   ```

   `|safe` marks the value as pre-rendered HTML. HubSpot's HubL docs describe
   `safe` as "in an environment with automatic escaping enabled this variable
   will not be escaped" without stating whether transactional emails escape by
   default, so `|safe` is the belt-and-braces choice: harmless if no
   autoescaping, essential if there is. **Verify on the first test send** —
   if the email shows literal `<div style=…>` text, the filter is missing.
   Do not add any other content that could inherit HubSpot's own
   unsubscribe/footer requirements beyond what HubSpot inserts itself.
4. **From**: any address on the connected domain (the API `from` overrides it).
   Set a plain-text version if HubSpot asks; it can also be `{{ custom.preheader }}`.
5. **Publish**, then copy the numeric id from the URL
   (`…/email/<PORTAL>/edit/<EMAIL_ID>/…`). That is `HUBSPOT_TRANSACTIONAL_EMAIL_ID`.
6. **Private app.** Settings → Integrations → Private Apps → Create. Scope:
   `transactional-email`. (Add `crm.objects.contacts.write` later if we start
   writing contacts from code.) Copy the access token →
   `HUBSPOT_PRIVATE_APP_TOKEN`.
7. **Vercel** → Settings → Environment Variables (Production, and Preview if
   you want previews to send): `HUBSPOT_PRIVATE_APP_TOKEN`,
   `HUBSPOT_TRANSACTIONAL_EMAIL_ID`, and optionally `EMAIL_PROVIDER=hubspot`
   to pin it. Redeploy.
8. **Smoke test**: submit the contact form on the live site (goes to
   `hello@himayat.com.au`) and check the HTML renders, not escaped source.
   Config health at `/api/health/provisioning` should show
   `email_provider: pass — transactional email via hubspot`.

### Attachments limitation

Single-send cannot carry attachments. The only attachment the app produces is
the member `.ics` on RSVP confirmations. On HubSpot the provider layer appends
an **"Attachments"** footer to the HTML listing each file, and when the caller
passes `tags.icsUrl` (events do: `${SITE_URL}/api/events/ics/<slug>`) the
`.ics` entry becomes a link. The RSVP template body already carries an "Add to
calendar (.ics)" link too, so attendees lose nothing except the meeting URL
inside the calendar file (the public ICS route deliberately omits it). On
Resend the real attachment is still sent.

## Falling back to Resend

Set `RESEND_API_KEY` (domain `himayat.com.au` verified in Resend) and either
unset the two HubSpot vars or set `EMAIL_PROVIDER=resend`. Resend is the only
provider that delivers real attachments. Resend's SDK reports failures as
`{ error }` rather than throwing; the provider layer checks that explicitly.

## Contact form → HubSpot CRM (F7.11)

`/api/contact` also submits the enquiry to a HubSpot **form** (Forms v3
integration endpoint, same host logic as `/api/newsletter`) when
`HUBSPOT_CONTACT_FORM_ID` is set. Fields sent: `firstname`, `lastname` (split
from the name), `email`, `message`, and — only when
`HUBSPOT_CONTACT_FORM_HAS_INTERESTS=1` — `gh_interests`, a plain single-line
text contact property holding the interest chips joined with `;`. HubSpot
rejects a submission that carries a field the form doesn't have, so create
the property and add it to the form before flipping that flag. Business name
and the enquiry ref are in the email only (add a `company` field later if
wanted). Context: `pageUri: growth-hub:contact`, `pageName: Contact form (<ref>)`.

The form submit and the email are independent: the route returns
`200 { ok: true, channels: ['hubspot', 'email'] }` if either landed, `503` if
neither is configured, `500` if everything configured failed.

## Every email the app sends

| Email | Trigger | To | From | Where |
| --- | --- | --- | --- | --- |
| Contact enquiry | `POST /api/contact` | hello@himayat.com.au (reply-to visitor) | Growth Hub noreply | `src/app/api/contact/route.ts` |
| Welcome | first ever sign-in (WorkOS callback) | new member | "<strategist> via Growth Hub" noreply (reply-to strategist) | `src/app/auth/callback/route.ts` |
| Team reply notification | staff reply in `/ops/inbox` | member | "<strategist> via Growth Hub" noreply | `src/app/api/ops/inbox/[userId]/route.ts` |
| Service booking alert | `POST /api/service-bookings` | OPS_EMAIL (reply-to member) | Growth Hub noreply | `src/app/api/service-bookings/route.ts` |
| Payment failed | Stripe `invoice.payment_failed` | Stripe customer email | Himayat hello@ | `src/app/api/stripe/webhook/route.ts` |
| Order confirmation (tax invoice) | shop checkout fulfilled | buyer | Growth Hub noreply (reply-to ops) | `src/lib/shop/emails.ts` |
| Order shipped | ops marks order shipped | buyer | Growth Hub noreply | `src/lib/shop/emails.ts` |
| Oversold alert | paid order but stock decrement failed | OPS_EMAIL | Growth Hub noreply | `src/lib/shop/emails.ts` |
| RSVP confirmation (+ .ics) | event RSVP created | attendee | Growth Hub noreply (reply-to ops) | `src/lib/events-emails.ts` |
| Event reminder (tomorrow / today) | reminders cron | attendee | Growth Hub noreply | `src/lib/events-emails.ts` |
| Ops provisioning handoff | Birdeye provisioning run finishes | OPS_EMAIL | Growth Hub noreply | `src/lib/ops/notify.ts` |

Behaviour with **no provider configured**: contact form → 503 (unless the
HubSpot form is configured, in which case the CRM submission alone counts as
success); ops handoff → `ok=false` unless the webhook or console fallback
applies; order confirmation → `confirmationEmailSentAt` stays unset so a retry
can send it later; event reminder → returns `false` so the cron does not mark
the row sent; everything else logs and carries on.

## Env summary

```
EMAIL_PROVIDER=                    # hubspot | resend | blank = auto
HUBSPOT_PRIVATE_APP_TOKEN=         # scope: transactional-email
HUBSPOT_TRANSACTIONAL_EMAIL_ID=    # numeric id of "Growth Hub — system email"
RESEND_API_KEY=                    # fallback provider
HUBSPOT_PORTAL_ID= / HUBSPOT_REGION=ap1   # shared with /api/newsletter
HUBSPOT_CONTACT_FORM_ID=           # contact form → CRM
HUBSPOT_CONTACT_FORM_HAS_INTERESTS=1      # only once gh_interests is on the form
```
