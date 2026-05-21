// Public events catalogue — hardcoded for now. Mirrors the data shown in
// the Events Hub mockup. The authenticated dashboard's RSVP system still
// reads from the Payload `events` collection at /(app)/my-events;
// this file is just the public marketing surface.
//
// When ready to migrate, wire this through Payload by adding a `slug`
// field to the Events collection and swapping `getPublicEvents()` for a
// CMS query.

export type EventCategory = 'Summit' | 'Workshop' | 'Mixer' | 'Clinic' | 'Community';

export interface PublicEvent {
  slug: string;
  title: string;
  desc: string;
  tag: string;
  tagClass: 'tag-summit' | 'tag-workshop' | 'tag-mixer' | 'tag-clinic' | 'tag-community';
  monthShort: string;
  day: string;
  year: string;
  dateLong: string;
  time: string;
  location: string;
  cost: string;
  audience: string;
  cat: EventCategory;
  featured?: boolean;
  /** Set when the event has a bespoke landing page hand-built outside [slug]. */
  bespoke?: boolean;
}

export interface PastEvent {
  title: string;
  desc: string;
  tag: string;
  tagClass: PublicEvent['tagClass'];
  date: string;
  stats: Array<{ n: string; l: string }>;
}

export const PUBLIC_EVENTS: PublicEvent[] = [
  {
    slug: 'small-business-journey',
    title: 'The Small Business Journey',
    desc: "A full-day program of talks, workshops and help-desks for people starting, running and growing small businesses in Canberra. With dedicated tracks for diverse founders, tradies and community-service operators.",
    tag: 'Annual Summit', tagClass: 'tag-summit',
    monthShort: 'TBC', day: '—', year: '2026',
    dateLong: 'Date to be confirmed',
    time: '9am – late',
    location: 'Canberra ACT',
    cost: 'Free',
    audience: 'Small & emerging business',
    cat: 'Summit',
    featured: true,
    bespoke: true,
  },
  {
    slug: 'ai-for-small-business',
    title: 'AI for Small Business — hands-on workshop',
    desc: "Two hours. Real laptops. Real tools. We'll set up an AI customer-message workflow, a reviews responder, and a content drafting helper — and you'll leave with all three working.",
    tag: 'Workshop', tagClass: 'tag-workshop',
    monthShort: 'Jun', day: '12', year: '2026',
    dateLong: 'Friday 12 June 2026',
    time: '10:00am – 12:00pm',
    location: 'Level 4, 1 Moore St · Canberra',
    cost: 'Free for members · $40 guests',
    audience: 'Existing owner-operators',
    cat: 'Workshop',
  },
  {
    slug: 'migrant-founders-mixer',
    title: 'Migrant Founders Mixer',
    desc: 'An evening for founders from migrant and refugee backgrounds — short stories from three operators, supper, and a long, unhurried chat. Translators on hand.',
    tag: 'Mixer', tagClass: 'tag-mixer',
    monthShort: 'Jun', day: '26', year: '2026',
    dateLong: 'Thursday 26 June 2026',
    time: '5:30pm – 8:00pm',
    location: 'The Loft · Kingston',
    cost: 'Free · RSVP',
    audience: 'Migrant & refugee founders',
    cat: 'Mixer',
  },
  {
    slug: 'tradie-tax-time-bootcamp',
    title: 'Tradie Tax Time Bootcamp',
    desc: "BAS, deductions, GST on quotes, and the apps that won't break your morning. Co-hosted with What Works. Bring last quarter's mess.",
    tag: 'Workshop', tagClass: 'tag-workshop',
    monthShort: 'Jul', day: '08', year: '2026',
    dateLong: 'Wednesday 8 July 2026',
    time: '6:30am – 8:30am',
    location: 'Mitchell Trade Hub',
    cost: 'Free',
    audience: 'Sole-trader tradies',
    cat: 'Workshop',
  },
  {
    slug: 'grants-office-hours',
    title: 'Grants & Funding Office Hours',
    desc: "Monthly drop-in. Bring a half-written application or a vague idea — we'll help shape it, pressure-test it, and tell you what's competitive this round.",
    tag: 'Clinic', tagClass: 'tag-clinic',
    monthShort: 'Jul', day: '17', year: '2026',
    dateLong: 'Thursday 17 July 2026',
    time: '10:00am – 2:00pm',
    location: 'Level 4, 1 Moore St · Canberra',
    cost: 'Free · drop in',
    audience: 'Any stage',
    cat: 'Clinic',
  },
  {
    slug: 'founders-yarn',
    title: "Founders' Yarn — community circle",
    desc: 'A quiet, structured peer-support circle for owner-operators in their first three years. Same time every fortnight. No pitching, no selling.',
    tag: 'Community', tagClass: 'tag-community',
    monthShort: 'Recurring', day: '·', year: 'fortnightly',
    dateLong: 'Fortnightly · alternating Tuesdays',
    time: '12:30pm – 1:30pm',
    location: 'Level 4, 1 Moore St · Canberra',
    cost: 'Free',
    audience: 'First 3 years',
    cat: 'Community',
  },
];

export const PAST_PUBLIC_EVENTS: PastEvent[] = [
  {
    title: 'Digital Marketing Day 2025',
    desc: 'A one-day intensive across SEO, paid social, content and CRM basics — co-hosted with RD Consulting.',
    tag: 'Workshop', tagClass: 'tag-workshop',
    date: 'November 2025',
    stats: [{ n: '84', l: 'Attendees' }, { n: '92%', l: 'Would recommend' }],
  },
  {
    title: 'Birdeye Partnership Launch',
    desc: 'Marking our reputation-tooling partnership with Birdeye — onboarding 12 founding-cohort members on the night.',
    tag: 'Mixer', tagClass: 'tag-mixer',
    date: 'September 2025',
    stats: [{ n: '60+', l: 'Founders' }, { n: '12', l: 'Cohort onboarded' }],
  },
  {
    title: 'Welcome to Country Kickoff',
    desc: 'Our 2025 program opener — Welcome to Country, year ahead, and the first community grant announcement.',
    tag: 'Community', tagClass: 'tag-community',
    date: 'February 2025',
    stats: [{ n: '120', l: 'In the room' }, { n: '$25K', l: 'Grants announced' }],
  },
];

export function getPublicEventBySlug(slug: string): PublicEvent | undefined {
  return PUBLIC_EVENTS.find((e) => e.slug === slug);
}

export function getGenericEventSlugs(): string[] {
  return PUBLIC_EVENTS.filter((e) => !e.bespoke).map((e) => e.slug);
}
