// Single source of truth for the flagship "Entrepreneurship for Everyone"
// summit (9 July 2026, CBR Innovation Network). Change a date / venue / link
// here once and every surface updates together — the landing page, its OG
// image + JSON-LD, the homepage announcement band, the events hub featured
// card, and the partners recruitment banner all import from here.

export interface SummitInfo {
  name: string;
  /** URL slug + path of the canonical landing page. */
  slug: string;
  path: string;
  tagline: string;
  /** Human date string, e.g. "Thursday 9 July 2026". */
  dateLong: string;
  /** Calendar date (no time), e.g. "2026-07-09". */
  dateIso: string;
  /** Start / end as full ISO with the AEST (+10:00) offset — used for JSON-LD. */
  startIso: string;
  endIso: string;
  /** Display time range, e.g. "9:00am – 5:00pm". */
  time: string;
  /** Short venue line for cards / key-facts. */
  venue: string;
  /** Full postal venue line for structured data. */
  venueFull: string;
  cost: string;
  /**
   * Attendee registration is hosted on Eventbrite by CBRIN. Until the link is
   * live, leave this EMPTY: the attendee "Register" CTA stays hidden and the
   * page steers people to the newsletter instead. Dropping the URL in here is
   * the only edit needed to switch registration on across the whole site.
   */
  eventbriteUrl: string;
  /** Contributors (stallholders / facilitators / speakers / sponsors) apply
   *  via the existing HubSpot form. */
  applyPath: string;
}

export const SUMMIT: SummitInfo = {
  name: 'Entrepreneurship for Everyone',
  slug: 'entrepreneurship-for-everyone',
  path: '/events/entrepreneurship-for-everyone',
  tagline: 'Start. Build. Grow — together.',
  dateLong: 'Thursday 9 July 2026',
  dateIso: '2026-07-09',
  startIso: '2026-07-09T09:00:00+10:00',
  endIso: '2026-07-09T17:00:00+10:00',
  time: '9:00am – 5:00pm',
  venue: 'CBR Innovation Network, Canberra',
  venueFull: 'CBR Innovation Network · Level 5, 1 Moore Street, Canberra ACT 2601',
  cost: 'Free · all welcome',
  eventbriteUrl: 'https://www.eventbrite.com.au/e/entrepreneurship-for-everyone-tickets-1990920554974',
  applyPath: '/expo/apply',
};

/** True once the Eventbrite attendee link has been set. Drives whether the
 *  attendee "Register" CTA renders or the "get notified" fallback shows. */
export function isSummitRegistrationOpen(): boolean {
  return SUMMIT.eventbriteUrl.trim().length > 0;
}
