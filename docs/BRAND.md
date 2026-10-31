# Growth Hub brand and voice guide

For anyone writing for Growth Hub: the website, Eventbrite listings, emails,
slides, social posts and the Growth Hub Sites platform. Last updated 30 Oct 2026.

## What Growth Hub is

**One line:** Free monthly Sessions, hands-on Growth Labs and websites you can
run yourself, for Canberra small businesses and sole traders.

**Who it's for:** built for the Canberra owners big agencies overlook: new and
emerging owners, migrant and refugee founders, sole traders and owners doing it
tough. Open to every small business in Canberra and the region, at any stage
(starting out, trading, growing). Name these groups so people recognise
themselves, and always say everyone's welcome. Warm and plain, never
charity-speak ("disadvantaged", "vulnerable", "the needy").

**Free Growth Lab seats:** for hardship and partner referrals. Asking is a
message, with no proof and no reasons asked for. Every mention links "How to
ask" to `/free-seats` (use `FreeSeatNote`, so the wording stays in one place).

**Access:** plain English and helpers at every table; slides and next steps by
email after a Session; interpreter, Auslan or access support, or a companion,
arranged on request. Don't promise translated materials.

**What we promise:**
- Practical: one topic, one change to make this week.
- In a room, with people beside you. A person answers.
- Honest: plain prices, no sales pitch in a free Session.
- For everyone: interpreters, Auslan and access support on request; free Build
  Lab seats for hardship and partner referrals.

**The ladder** (keep this order everywhere):

| Step | What | Price |
|---|---|---|
| Free guides | One checklist per Session topic (`/guides`) | Free |
| Growth Hub Session | 90 minutes, 2nd Wednesday, 12:00–1:30pm | Free |
| Growth Lab | 3 hours, 4th Wednesday, 9:30am–12:30pm; leave with a site that's live | A$179 |
| Growth Hub Sites: Starter | One site, five pages, on a Growth Hub web address | Free with a Growth Lab or program code |
| Growth Hub Sites: Storefront | Own domain, bookings, shop, chat assistant, support | A$39 a month or A$390 a year |
| Growth Hub Sites: Storefront Plus | Storefront, one update made for you each month and a check-in call every three months | A$89 a month or A$890 a year |
| Growth Hub Sites: Launch | We build it with you | A$690 one-off, with 3 months of Storefront Plus; the Growth Lab fee comes off if booked within 30 days of a Lab |

The source of truth for dates and prices is code: `src/lib/sessions.ts`
(`SEASON`, `SESSION_FORMAT`) and the plans on `/sites`. Change them there,
not in copy.

## Names

| Write | Not |
|---|---|
| Growth Hub; Growth Hub by Himayat (first mention, footers, cards) | The Growth Hub, GrowthHub, GH |
| Growth Hub Session, a Session (capital S) | webinar, workshop, talk, masterclass |
| Growth Lab (two words, both capitals) | Site in a Session, bootcamp |
| Growth Hub Sites | the platform, Maven, the builder |
| Starter, Storefront, Storefront Plus, Launch (plan names, capitalised) | tiers, packages |
| The five topics: Get started, Get found, Run smarter, Practical AI, Stay safe | |
| CBR Innovation Network's Digital Solutions program | "our CBRIN program", "CBRIN sessions" |

Sessions are Growth Hub events, not CBRIN Digital Solutions sessions. We point
people to CBRIN's program; we never sell it or speak for it.

## Voice

- Australian English. Plain words, short sentences, second person ("you").
- Warm and direct, never salesy. Say what happens, not how amazing it is.
- Specific beats general: "leave with a website that's live" beats "transform
  your online presence".
- Don't use "real" as an intensifier ("real results", "real people") except
  where it contrasts with AI ("a person checks it with you").
- Avoid: unlock, supercharge, seamless, leverage, journey, game-changer,
  cutting-edge, world-class, "AI-powered" as a selling point.
- Prices: "A$179", "A$39 a month", always including GST. Say "Free", not "$0".
- Dates and times: "Wed 11 Nov", "Wednesday 11 November", "12:00–1:30pm",
  Canberra time. En dash in ranges.

## Claims: what we can and can't say

Decided 28 Oct 2026. Add a line here when a claim is confirmed or withdrawn.

| Claim | Status |
|---|---|
| "Run by Himayat, a Canberra social enterprise" | OK |
| Phone 02 5119 0005; address Level 4, 1 Moore St, Canberra ACT 2601 | OK |
| "The padlock is set up for you" (own domains on Storefront) | OK |
| CBRIN program: "up to five hours with an expert, for $110 or free if you're doing it tough" | OK, as worded on the site |
| Social Traders Verified | Don't use |
| "Hosted in Sydney" / Australian data hosting | Don't use until Silvio confirms every data path in writing |
| Partner or co-host names, logos, "more than 30 organisations" | Don't use without the organisation's written OK |
| Streaming or recordings of Sessions | Don't promise (2026 pilot is in person only) |
| Customer numbers, results, "most owners choose…", testimonials | Only with real, permissioned evidence |
| NDIS registration, care services | Not Growth Hub; don't mention |
| Charity, PBI, DGR, tax-deductible, "not-for-profit" (for Growth Hub) | Don't use; none is in place. Say "a social enterprise, not a charity" |
| "Any surplus goes back into the community work" | OK as worded on /about; check it still holds once Growth Hub Pty Ltd is set up |
| Free Growth Lab seats, "no proof needed" | OK |
| Venue: "Canberra city, venue emailed before the day" | OK until the venue is confirmed (`VENUE_CONFIRMED` in `src/lib/sessions.ts`) |
| Partner logos on /partners | Only with written OK; add to `PARTNER_LOGOS` in the partners page |

Guides give general information, link to the official source for anything that
changes (laws, prices, phone numbers), and carry a "last checked" date.

## Look

- **Colours:** teal `#0D3F48` (text, primary), plum `#5F304B` (labels, Build
  Lab), eggshell `#F3F0E7` (background), lime `#E3F29C` (highlights, free),
  gold `#E2B842` (sparingly). Lavender is being retired.
- **Type:** Source Serif 4 for headings and body; Inter for labels, buttons and
  small print; Biro Script only for short handwritten asides
  ("beside you, not above you").
- **Signature:** the lime highlighter under "grow." in "Your business deserves
  to grow." Keep the headline.
- **Free = lime tag, Growth Lab = plum tag**, everywhere (site, Eventbrite
  cards, slides).
- **Buttons:** 12px radius; one primary action per section.
- **Photos:** real Growth Hub Sessions and owners, with permission. No stock
  people, no AI-generated people.
- **Event images:** `eventbrite-images/card.html` in the project folder makes
  the 2160×1080 Eventbrite cards in house style.

## Logo and the "by Himayat" endorsement

Growth Hub currently uses the Himayat butterfly mark with the wordmark
"Growth Hub by Himayat" (`public/images/himayat-logo.png`). Under the planned
restructure, the Himayat brand sits with Himayat Ltd and Growth Hub becomes
Growth Hub Pty Ltd. Before that happens, Growth Hub needs either a written
licence to use the Himayat name and mark, or a mark of its own with "by
Himayat" as an endorsement line that can be dropped. That's a decision for
Waheed, with advice; until then, use the current lock-up as it is.
