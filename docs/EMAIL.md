# Contact form, newsletter and email

The public site has two forms and one optional email path. Everything else that used to send
email (member portal, shop, RSVPs, reminders, Stripe notices) was removed in October 2026
(see `ARCHIVED-FEATURES.md`).

## Newsletter (`POST /api/newsletter`)

Submits the email address to the HubSpot form `HUBSPOT_FORM_ID` ("Growth Hub Newsletter") in
portal `HUBSPOT_PORTAL_ID` (442026767), region `HUBSPOT_REGION=ap1`, via the Forms v3
integration endpoint. Honeypot field `hp`: non-empty → silent 200. A HubSpot 404 (wrong
region or form id) is logged to Sentry and the visitor sees a generic error.

## Contact form (`POST /api/contact`)

"Write us a line" on `/about`. Two independent delivery channels; the request succeeds if
**either** lands:

1. **HubSpot form submission** when `HUBSPOT_PORTAL_ID` + `HUBSPOT_CONTACT_FORM_ID` are set.
   Fields sent: `firstname`, `lastname` (split from the name, only when there are two or
   more words), `email`, `company` (the form's "Business" field), `message`, and, only when
   `HUBSPOT_CONTACT_FORM_HAS_INTERESTS=1`, `gh_interests` (a **single-line text** contact
   property holding the interest chips joined with `;`). HubSpot rejects a submission that
   carries a field the form doesn't have, so add the property and field before setting that
   flag. Set the form's own notification email to hello@thegrowthhub.com.au; that's how
   the team hears about an enquiry when no email provider is configured.
2. **Email** via `sendEmail()` (below) to `CONTACT.email` (`src/lib/site.ts`,
   hello@thegrowthhub.com.au) unless `CONTACT_TO_EMAIL` is set, with reply-to = the visitor.

Response: `200 { ok, channels }` if either landed, `503` if neither is configured, `500` if
everything configured failed. Honeypot `hp`: non-empty → silent 200, nothing sent.

### Setting up the HubSpot form

1. HubSpot → Marketing → Forms → create **"Growth Hub contact"** with First name, Last name
   (optional), Email, Company and Message (multi-line). Optionally add `gh_interests`.
2. Form settings → Notifications → send to hello@thegrowthhub.com.au.
3. Copy the form GUID → Vercel production env `HUBSPOT_CONTACT_FORM_ID` (and
   `HUBSPOT_CONTACT_FORM_HAS_INTERESTS=1` if you added `gh_interests`) → redeploy.
4. Submit a test enquiry on the live site and check it arrives in HubSpot and the inbox.

## `sendEmail()` provider layer

`src/lib/email/send.ts` picks a provider from env vars, never throws, and returns
`{ ok, provider, id? | error }`.

| `EMAIL_PROVIDER` | Result |
| --- | --- |
| unset / `auto` | HubSpot single-send if `HUBSPOT_PRIVATE_APP_TOKEN` **and** `HUBSPOT_TRANSACTIONAL_EMAIL_ID` are set; else Resend if `RESEND_API_KEY` is set; else **none** |
| `hubspot` | HubSpot, or none if its two vars are missing |
| `resend` | Resend, or none if `RESEND_API_KEY` is missing |

**HubSpot single-send** needs the Transactional Email add-on, a connected sending domain for
the `from` address, a published transactional email whose subject is `{{ custom.subject }}`
and body is a single rich-text module containing `{{ custom.body_html|safe }}` (its numeric id
is `HUBSPOT_TRANSACTIONAL_EMAIL_ID`), and a private-app token with the `transactional-email`
scope (`HUBSPOT_PRIVATE_APP_TOKEN`).

**Resend**: `RESEND_API_KEY`, with the sender's domain verified in Resend. The default sender
is `DEFAULT_FROM` in `src/lib/email/resend.ts` (currently `noreply@himayat.com.au`); move it to
a thegrowthhub.com.au address once that domain is verified with the chosen provider.

As of October 2026 no provider is configured in production, so the contact form depends on
the HubSpot form (channel 1).

## Env summary

```
HUBSPOT_PORTAL_ID=442026767 / HUBSPOT_REGION=ap1   # shared by both forms
HUBSPOT_FORM_ID=                   # newsletter form
HUBSPOT_CONTACT_FORM_ID=           # contact form → CRM
HUBSPOT_CONTACT_FORM_HAS_INTERESTS=1      # only once gh_interests is on the form
CONTACT_TO_EMAIL=                  # optional; blank = hello@thegrowthhub.com.au
EMAIL_PROVIDER=                    # hubspot | resend | blank = auto
HUBSPOT_PRIVATE_APP_TOKEN=         # scope: transactional-email
HUBSPOT_TRANSACTIONAL_EMAIL_ID=
RESEND_API_KEY=
OPS_NOTIFICATION_EMAIL=            # reply-to/ops address for any future system email
```
