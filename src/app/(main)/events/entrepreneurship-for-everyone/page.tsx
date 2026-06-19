import type { Metadata } from 'next';
import { Fragment } from 'react';
import Link from 'next/link';
import Contact from '@/components/sections/Contact';
import NewsletterStrip from '@/components/NewsletterStrip';
import { JsonLd } from '@/components/seo/JsonLd';
import { BreadcrumbListJsonLd } from '@/components/seo/BreadcrumbListJsonLd';
import { getSiteSettings } from '@/lib/cms';
import { SUMMIT, isSummitRegistrationOpen } from '@/lib/summit';
import CaptureAttribution from '../[slug]/CaptureAttribution';
import SummitCtas, { SummitApplyLink } from './SummitCtas';
import SummitHeroHeadline from './SummitHeroHeadline';
import PlanYourDayPanel from './PlanYourDayPanel';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://thegrowthhub.com.au';

const OG_DESC =
  'A free full-day summit for Canberra small business — talks, workshops and help-desks on 9 July 2026 at CBR Innovation Network. Tracks for diverse founders, tradies and community-service operators.';

export const metadata: Metadata = {
  title: `${SUMMIT.name} — a free small-business summit | Growth Hub by Himayat`,
  description: OG_DESC,
  alternates: { canonical: SUMMIT.path },
  openGraph: {
    title: `${SUMMIT.name} — 9 July 2026, Canberra`,
    description: OG_DESC,
    url: SUMMIT.path,
    type: 'website',
    siteName: 'Growth Hub by Himayat',
    locale: 'en_AU',
  },
  twitter: {
    card: 'summary_large_image',
    title: `${SUMMIT.name} — 9 July 2026, Canberra`,
    description: OG_DESC,
  },
};

export const revalidate = 3600;

interface ProgramSlot {
  time: string;
  end?: string;
  type?: 'pin' | 'break';
  title: string;
  blurb?: string;
  sessions?: Array<{ t: string; p: string; helpdesk?: boolean; proposed?: boolean }>;
}

const PROGRAM: ProgramSlot[] = [
  { time: '9:00am', end: '9:30am', type: 'pin', title: 'Welcome + housekeeping', blurb: 'A warm welcome, housekeeping, and a quick overview of the day.' },
  { time: '9:30am', end: '10:30am', title: 'How to Position Your Business', blurb: 'Presented by What Works.' },
  { time: '10:30am', end: '11:30am', title: 'Networking & Pitching', blurb: 'Presented by CBRIN.' },
  { time: '11:30am', end: '12:30pm', title: 'Digital & Social Media Marketing', blurb: 'Presented by RD Consulting.' },
  { time: '12:30pm', end: '1:30pm', type: 'pin', title: 'Lunch', blurb: 'Catered lunch with space to keep talking.' },
  { time: '1:30pm', end: '2:30pm', title: 'LinkedIn Masterclass', blurb: 'Presented by RD Consulting.' },
  { time: '2:30pm', end: '3:00pm', title: 'Safe AI', blurb: 'Presented by CyberWardens.' },
  { time: '3:00pm', end: '4:00pm', title: 'Intro to Getting Your Business Online', blurb: 'Presented by Small Business Digital.' },
];

const WAYS_TO_HELP = [
  { t: 'Speaking engagements or workshop presentations', d: 'Lead a session in your area of expertise. 30–60 minute slots available across the day.', tag: 'Speaker' },
  { t: 'Panel discussions', d: 'Join a short, candid panel — first-time founders, tradies, or community-service operators.', tag: 'Panellist' },
  { t: 'Stallholder / exhibitor participation', d: 'Set up a table in the networking area. Bring brochures, demos, and the people behind the brand.', tag: 'Exhibitor' },
  { t: 'Inclusivity support & community engagement', d: 'Help us make the day genuinely accessible — translation, sensory-friendly spaces, advisory input.', tag: 'Inclusivity' },
  { t: 'Promotion through stakeholder networks', d: "Share the event with your members, clients and database. We'll provide co-branded assets.", tag: 'Promotion' },
  { t: 'Help desk or advisory support', d: 'Staff a one-to-one help desk — getting online, business planning, or general advice.', tag: 'Advisor' },
  { t: 'Sponsorship', d: 'Underwrite catering, materials, lucky-door prizes, or after-hours drinks. Tiered options available.', tag: 'Sponsor' },
  { t: 'Collaborative opportunities', d: "Have an idea we haven't listed? Co-deliver something with us. Get in touch.", tag: 'Open' },
];

interface Stakeholder {
  name: string;
  role: string;
  host?: boolean;
}

// Grouped by what each organisation brings to the day, so 30+ names read as a
// map of the ecosystem rather than an undifferentiated wall. The host leads
// the first group.
const STAKEHOLDER_GROUPS: Array<{ label: string; members: Stakeholder[] }> = [
  {
    label: 'Hosts & venue',
    members: [
      { name: 'The Growth Hub', role: 'Host & convenor', host: true },
      { name: 'Himayat', role: 'Co-host & community' },
      { name: 'CBRIN', role: 'Venue & ecosystem' },
    ],
  },
  {
    label: 'Advice, mentoring & funding',
    members: [
      { name: 'Asuria', role: 'Business planning & employment' },
      { name: 'Many Rivers', role: 'Microenterprise & microfinance' },
      { name: 'National Self Employment Association', role: 'Self-employment' },
      { name: 'The Mill House Ventures', role: 'Social enterprise & ventures' },
      { name: 'RKDN', role: 'Advisory & consulting' },
      { name: 'Canberra Business Advice & Support Service', role: 'Business advisory' },
      { name: 'Bendigo Bank', role: 'Banking & finance' },
      { name: 'Hands Across Canberra', role: 'Community funding' },
      { name: 'Justin Stanic', role: 'Small business mentor' },
    ],
  },
  {
    label: 'Industry, trades & skills',
    members: [
      { name: 'Canberra Business Chamber', role: 'Industry & advocacy' },
      { name: 'What Works', role: 'Tradie & workflow support' },
      { name: 'ICN', role: 'Industry capability' },
      { name: 'Master Builders Association', role: 'Building industry' },
      { name: 'Navitas Skilled Futures', role: 'Skills & training' },
      { name: 'MTC Australia', role: 'Employment & training' },
      { name: 'DEWR', role: 'Government' },
      { name: 'Small Business Digital', role: 'Digital programs' },
    ],
  },
  {
    label: 'Digital, marketing & creative',
    members: [
      { name: 'RD Consulting', role: 'Marketing & LinkedIn' },
      { name: 'Normtech', role: 'IT & cyber security' },
      { name: 'Allara Creative', role: 'Creative & branding' },
    ],
  },
  {
    label: 'Community, multicultural & inclusion',
    members: [
      { name: 'Her Zest', role: 'Women in business' },
      { name: 'Canberra Women in Business', role: 'Women in business' },
      { name: 'MARSS ACT', role: 'Migrant & refugee settlement' },
      { name: 'Catalysr', role: 'Migrant entrepreneur accelerator' },
      { name: 'Australian Red Cross (ACT)', role: 'Community services' },
      { name: 'Canberra Multicultural Community Forum', role: 'Multicultural community' },
      { name: 'Multicultural Hub Canberra', role: 'Multicultural community' },
      { name: "Women's Centre for Health Matters", role: 'Health & wellbeing' },
    ],
  },
];

const eventJsonLd: Record<string, unknown> = {
  '@context': 'https://schema.org',
  '@type': 'Event',
  name: SUMMIT.name,
  description: OG_DESC,
  startDate: SUMMIT.startIso,
  endDate: SUMMIT.endIso,
  eventStatus: 'https://schema.org/EventScheduled',
  eventAttendanceMode: 'https://schema.org/OfflineEventAttendanceMode',
  organizer: { '@type': 'Organization', name: 'Growth Hub by Himayat', url: SITE_URL },
  location: {
    '@type': 'Place',
    name: 'CBR Innovation Network',
    address: {
      '@type': 'PostalAddress',
      streetAddress: 'Level 5, 1 Moore Street',
      addressLocality: 'Canberra',
      addressRegion: 'ACT',
      postalCode: '2601',
      addressCountry: 'AU',
    },
  },
  offers: {
    '@type': 'Offer',
    url: `${SITE_URL}${SUMMIT.path}`,
    price: '0',
    priceCurrency: 'AUD',
    availability: 'https://schema.org/InStock',
  },
  url: `${SITE_URL}${SUMMIT.path}`,
};

export default async function EntrepreneurshipForEveryonePage() {
  const siteSettings = await getSiteSettings();

  // Condensed running order for the hero "see the draft program" disclosure.
  const programBlocks = PROGRAM.map((s) => ({
    time: s.time,
    title: s.title,
    pin: s.type === 'pin',
    brk: s.type === 'break',
  }));

  return (
    <main>
      <CaptureAttribution slug={SUMMIT.slug} />
      <JsonLd data={eventJsonLd} />
      <BreadcrumbListJsonLd
        crumbs={[
          { name: 'Events', path: '/events' },
          { name: SUMMIT.name, path: SUMMIT.path },
        ]}
      />

      {/* HERO */}
      <section className="hero event-hero" id="top">
        <div className="wrap">
          <p className="event-eyebrow">
            <span className="rule" aria-hidden="true" />
            A free community day for Canberra small business · with CBR Innovation Network
          </p>
          <SummitHeroHeadline />
          <div className="hero-handnote" style={{ marginTop: 24 }}>
            <span className="txt handscript">{SUMMIT.tagline}</span>
          </div>
          <p className="hero-sub">
            A free, full-day program of talks, workshops and help-desks for people starting,
            running and growing small businesses in Canberra — with dedicated tracks for
            diverse founders, tradies, and emerging community-service operators.
          </p>

          <SummitCtas surface="hero" />

          <div className="event-hero-grid">
            <div className="event-hero-facts">
              <span className="section-label">At a glance</span>
              <div className="event-keyfacts">
                <div className="event-keyfact"><span className="lbl">Date</span><span className="val">{SUMMIT.dateLong}</span></div>
                <div className="event-keyfact"><span className="lbl">Location</span><span className="val">{SUMMIT.venue}</span></div>
                <div className="event-keyfact"><span className="lbl">Hours</span><span className="val">{SUMMIT.time}</span></div>
                <div className="event-keyfact"><span className="lbl">Cost</span><span className="val">{SUMMIT.cost}</span></div>
              </div>
            </div>

            <aside className="event-hero-side" aria-label="Plan your day">
              <PlanYourDayPanel blocks={programBlocks} />
            </aside>
          </div>
        </div>
      </section>

      {/* SCHEDULE */}
      <section className="schedule" id="program">
        <div className="wrap">
          <div className="schedule-head">
            <span className="section-label">Program</span>
            <h2 className="section-h2">A full day of practical help, start to finish.</h2>
            <p className="naming-lead">
              Three things run side by side: hands-on workshops in The Lab, drop-in one-to-one
              advisors in the Events Room all day, and an afternoon of stalls and a panel up on
              Level 4. We&apos;re still finalising a few sessions and timings.
            </p>
            <span className="draft-pill">
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" aria-hidden="true"><circle cx="7" cy="7" r="5" /><path d="M7 4v3l2 1.5" /></svg>
              Free entry · {SUMMIT.dateLong}
            </span>
          </div>

          <h3 className="schedule-room is-lead">The Lab <span className="room-sub">workshops</span></h3>
          <div className="schedule-list">
            {PROGRAM.map((slot, i) => {
              const isLunch = slot.title.toLowerCase().startsWith('lunch');
              return (
                <Fragment key={i}>
                  {i === 0 && (
                    <div className="schedule-part"><span className="schedule-part-label">Morning</span></div>
                  )}
                  {isLunch && (
                    <div className="schedule-part"><span className="schedule-part-label">Afternoon</span></div>
                  )}
                  <div
                    className={
                      'slot' +
                      (slot.type === 'pin' ? ' is-pin' : '') +
                      (slot.type === 'break' ? ' is-break' : '')
                    }
                  >
                    <div className="slot-time">
                      {slot.time}
                      {slot.end && <span className="end">→ {slot.end}</span>}
                    </div>
                    <div className="slot-dot" />
                    <div className="slot-body">
                      <div className="slot-mobile-time">{slot.time}{slot.end ? ` — ${slot.end}` : ''}</div>
                      <h3>{slot.title}</h3>
                      {slot.blurb && <p className="slot-blurb">{slot.blurb}</p>}
                      {slot.sessions && (
                        <ul className="sessions">
                          {slot.sessions.map((s, j) => (
                            <li key={j} className={'session' + (s.helpdesk ? ' is-helpdesk' : '') + (s.proposed ? ' is-proposed' : '') + (s.p === 'TBC' ? ' is-tbc' : '')}>
                              <span className="session-title">{s.t}</span>
                              <span className="session-pres">
                                <span className="pres-dot" />
                                {s.p === 'TBC' ? <span className="tbc">Presenter TBC</span> : <span>{s.p}</span>}
                                {s.proposed && <span className="proposed-tag">Proposed</span>}
                              </span>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  </div>
                </Fragment>
              );
            })}
          </div>

          <div className="schedule-rooms">
            <div className="room-card">
              <h3 className="schedule-room">The Events Room <span className="room-sub">drop-in advisory</span></h3>
              <p className="room-time">10:00am – 4:00pm</p>
              <p className="room-note">
                One-to-one help desks with advisors and mentors — drop in any time across the
                day, no booking needed.
              </p>
            </div>
            <div className="room-card">
              <h3 className="schedule-room">Level 4 <span className="room-sub">stalls &amp; panel</span></h3>
              <ul className="room-lines">
                <li><span className="t">4:30 – 6:30pm</span> Stalls &amp; networking</li>
                <li><span className="t">5:00 – 6:00pm</span> Panel discussion</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* GET INVOLVED */}
      <section className="involved" id="involved">
        <div className="wrap">
          <span className="section-label">Get involved</span>
          <h2 className="section-h2">Eight ways to be part of the day.</h2>
          <p className="involved-lead">
            We&apos;re bringing partners in across the whole program. If any of the following
            fits what your organisation does, apply to take part — we read every application
            and reply within a few business days.
          </p>
          <div className="involved-grid">
            {WAYS_TO_HELP.map((w, i) => (
              <div className="inv-card" key={i}>
                <span className="inv-tag">{w.tag}</span>
                <h3>{w.t}</h3>
                <p>{w.d}</p>
              </div>
            ))}
          </div>
          <div className="hero-ctas" style={{ marginTop: 32 }}>
            <SummitApplyLink surface="involved" label="Apply to take part" />
          </div>
        </div>
      </section>

      {/* STAKEHOLDERS */}
      <section className="stakes" id="stakeholders">
        <div className="wrap">
          <div className="stakes-head">
            <div>
              <span className="section-label">Stakeholders</span>
              <h2 className="section-h2">Who&apos;s already at the table.</h2>
            </div>
            <p className="naming-lead">
              Currently involved or invited — and growing. If you don&apos;t see your
              organisation here, that&apos;s our cue to send the next invite.
            </p>
          </div>
          <div className="stakes-groups">
            {STAKEHOLDER_GROUPS.map((g) => (
              <div className="stake-group" key={g.label}>
                <h3 className="stake-group-label">{g.label}</h3>
                <div className="stakes-grid">
                  {g.members.map((s) => (
                    <div className={'stake-cell' + (s.host ? ' is-host' : '')} key={s.name}>
                      <span className="stake-name">{s.name}</span>
                      <span className="stake-role">{s.role}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
          <div className="stakes-foot">
            <span>And not limited to the above.</span>
            <span className="dot" />
            <span>Want to be added? <Link href={SUMMIT.applyPath} style={{ color: 'var(--plum)', textDecoration: 'underline', textUnderlineOffset: 3 }}>Apply to take part.</Link></span>
          </div>
        </div>
      </section>

      {/* REGISTER / GET NOTIFIED */}
      <section className="feedback-cta" id="get-notified">
        <div className="wrap">
          <div className="feedback-card">
            <div>
              <span className="section-label handscript" style={{ color: 'var(--lime)', textTransform: 'none', fontSize: 22, letterSpacing: 0 }}>
                {isSummitRegistrationOpen() ? 'Registration is open →' : 'Save the date →'}
              </span>
              <h2 className="section-h2" style={{ marginTop: 12 }}>Be there on 9 July.</h2>
              {isSummitRegistrationOpen() ? (
                <p>
                  Entry is free and everyone&apos;s welcome — founders, tradies, side-hustlers,
                  and anyone thinking about starting. Grab your free ticket on Eventbrite,
                  and we&apos;ll email the final program before the day.
                </p>
              ) : (
                <p>
                  Entry is free and everyone&apos;s welcome — founders, tradies, side-hustlers,
                  and anyone thinking about starting. Add the day to your calendar now, and
                  we&apos;ll send the registration link and final program as soon as they&apos;re
                  live.
                </p>
              )}
              <span className="hand">— no spam, no drip sequence. One email when it matters.</span>
              <SummitCtas surface="register-section" />
            </div>
            <div className="feedback-side">
              <h4>On the day</h4>
              <ul>
                <li>{SUMMIT.dateLong}, {SUMMIT.time}</li>
                <li>{SUMMIT.venueFull}</li>
                <li>Free entry · all welcome</li>
                <li>Talks, hands-on workshops &amp; one-to-one help desks</li>
                <li>Quiet catch-up area &amp; accessibility support</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      <NewsletterStrip
        source={`event-${SUMMIT.slug}`}
        heading={
          isSummitRegistrationOpen()
            ? 'Get the final program first.'
            : 'Get the registration link first.'
        }
        sub={
          isSummitRegistrationOpen()
            ? 'One email with the full session lineup before the day — plus any late additions. No drip sequence.'
            : 'One email when attendee registration opens — plus the final program. No drip sequence.'
        }
      />

      <Contact
        supportEmail={siteSettings?.supportEmail ?? null}
        phone={siteSettings?.phone ?? null}
        address={siteSettings?.address ?? null}
      />
    </main>
  );
}
