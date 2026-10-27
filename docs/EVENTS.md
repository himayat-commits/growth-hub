# Events: Sessions, Build Labs and the calendar

The Sessions season is **code**: `SEASON` in `src/lib/sessions.ts` lists every Growth Hub
Session and Build Lab date, title and topic. The site renders the calendar, the home-page
ticket and the top bar from it.

A **Payload event** (`/admin` → Events) on the same **Australia/Canberra calendar date** as a
season item attaches to it and supplies the booking link. Ticketing is on Eventbrite; nothing
on this site takes payment or RSVPs.

## What the visitor sees

| CMS state for that date | Calendar row / top bar / ticket |
|---|---|
| No event | "Registration opens soon" / "See dates" |
| Event without `registerUrl` | "See details" → the event page, which says "Registration opens soon" |
| Event with `registerUrl` | **"Book a seat"** → the Eventbrite page |

Events have **no drafts**: saving publishes. Enter everything, including `registerUrl`, in one
save. Changes appear immediately if the revalidate hook can reach `/api/revalidate` with
`REVALIDATION_SECRET`, otherwise within an hour.

## Fields for a Session or Build Lab

| Field | Session | Build Lab | Notes |
|---|---|---|---|
| `title` | e.g. Be found and chosen online | Build and publish your website | Replaces the season title |
| `slug` | e.g. `be-found-and-chosen-online` | e.g. `build-lab-9-dec-2026` | Unique; not a summit slug |
| `date` | Pick the day in the date picker (stored as 12:00 UTC) | same | Matched by Canberra date. Via the API use `YYYY-MM-DDT12:00:00.000Z`, never Canberra midnight |
| `time` | `12:00–1:30pm` | `9:30am–12:30pm` | Validated: must parse (`src/lib/events-time.ts`), otherwise the `.ics` would be all-day |
| `type` | `workshop` | `workshop` | Season items are always published as in-person events |
| `location` | leave blank | leave blank | Blank follows `SESSION_VENUE` / `VENUE_CONFIRMED` in `sessions.ts` |
| `registerUrl` | Eventbrite link | Eventbrite link | Validated: empty or a full `http(s)://` URL |
| `cost` | Free | `A$179` | A Lab with blank or "Free" cost shows the season price anyway |
| `tag` | Growth Hub Session | Build Lab | Label on the share card |
| `description` | 1–2 sentences | 1–2 sentences | Meta description, share card, `.ics` |
| `bespoke`, `dateDisplay` | leave unticked / blank | same | `bespoke` redirects to a hand-built page |

Don't create two events on the same date: only the first attaches.

## Venue

`VENUE_CONFIRMED` in `src/lib/sessions.ts` switches the venue line from "Canberra city, venue
to be confirmed" to the confirmed venue across the calendar, ticket, event pages, `.ics` and
JSON-LD. Flip it in code once the room is confirmed.

## Calendar files and search data

- `GET /api/events/ics/[slug]`: public `.ics` (Canberra time zone), linked as "Add to calendar".
- `EventJsonLd`: schema.org Event with an offline Place, the venue and a numeric AUD price.
- Past events drop off the calendar and sitemap after their Canberra date.

## The July 2026 summit

`/events/entrepreneurship-for-everyone` is a hand-built page (`bespoke`), now in its
"how the day ran" state. It is not part of the season.
