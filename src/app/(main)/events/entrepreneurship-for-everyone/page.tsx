import type { Metadata } from 'next';
import Link from 'next/link';
import Contact from '@/components/sections/Contact';
import NewsletterStrip from '@/components/NewsletterStrip';
import { JsonLd } from '@/components/seo/JsonLd';
import { BreadcrumbListJsonLd } from '@/components/seo/BreadcrumbListJsonLd';
import { getSiteSettings } from '@/lib/cms';
import { SUMMIT, isSummitRegistrationOpen } from '@/lib/summit';
import CaptureAttribution from '../[slug]/CaptureAttribution';
import SummitCtas, { SummitApplyLink } from './SummitCtas';

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
  { time: '9:00am', end: '9:30am', type: 'pin', title: 'Welcome to Country & opening', blurb: 'Welcome to Country, introductions, an inclusivity welcome, and an overview of the day.' },
  {
    time: '9:30am', end: '10:45am',
    title: 'Getting started — fundamentals',
    blurb: 'Foundational sessions for early-stage and first-time founders. Help desk open throughout.',
    sessions: [
      { t: 'Know Your Business', p: 'The Chatbot Agency' },
      { t: 'Google Business Profile setup', p: 'The Chatbot Agency' },
      { t: 'Google Analytics', p: 'The Chatbot Agency' },
      { t: 'Thinking of Starting a Small Business', p: 'Justin' },
      { t: 'Business Planning Support', p: 'Asuria' },
      { t: 'Help Desk — Getting Online', p: 'All', helpdesk: true },
    ],
  },
  { time: '10:45am', end: '11:15am', type: 'break', title: 'Networking break + quiet catch-up area', blurb: "Coffee, conversations, and a low-stimulation room for those who'd rather chat 1:1." },
  {
    time: '11:15am', end: '1:00pm',
    title: 'Marketing, IT & trades',
    blurb: 'For operators ready to sharpen the way they reach customers and protect their business.',
    sessions: [
      { t: 'Digital Marketing & Social Media', p: 'RD Consulting' },
      { t: 'IT Basics & Cyber Security', p: 'Normtech' },
      { t: 'Tradie Business Support', p: 'What Works' },
      { t: 'Small Business Help Desk', p: 'All', helpdesk: true },
    ],
  },
  { time: '1:00pm', end: '1:30pm', type: 'pin', title: 'Lunch + lucky door prize', blurb: 'Catered lunch with space to keep talking.' },
  {
    time: '1:30pm', end: '2:30pm',
    title: 'Brand, content & connections',
    blurb: 'Sharper messaging, smarter networking, and a working LinkedIn presence.',
    sessions: [
      { t: 'Content Creation & Branding', p: 'TBC' },
      { t: 'LinkedIn Masterclass', p: 'RD Consulting' },
      { t: 'Networking & Pitching', p: 'TBC' },
      { t: 'Business Support Help Desk', p: 'All', helpdesk: true },
    ],
  },
  {
    time: '2:30pm', end: '3:30pm',
    title: 'Leads, money & pathways',
    blurb: 'Funding, financial literacy, and dedicated content for NDIS, aged-care and community-service operators.',
    sessions: [
      { t: 'Meta Business Suite & Lead Generation', p: 'The Chatbot Agency' },
      { t: 'Grants & Funding', p: 'TBC' },
      { t: 'Financial Literacy', p: 'TBC' },
      { t: 'NDIS / Aged Care / Community Business Pathways', p: 'TBC', proposed: true },
    ],
  },
  {
    time: '3:45pm', end: '5:00pm',
    title: 'Build & automate',
    blurb: 'Putting the pieces together — your website, your brand, and AI to do the boring bits.',
    sessions: [
      { t: 'Website Building & Branding', p: 'Casual Dot · The Chatbot Agency' },
      { t: 'AI & Automation for Productivity', p: 'TBC' },
      { t: 'Best Practices of Gen AI Prompting', p: 'Cyber Cure' },
    ],
  },
  { time: '5:00pm', end: 'late', type: 'pin', title: 'Networking drinks & informal connections', blurb: 'Continuing the conversation — likely at an external venue/pub. Details to follow.' },
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
  const registrationOpen = isSummitRegistrationOpen();

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

      {/* Fonts for this page only — hoisted to <head> by React. The rest of the
          site keeps its serif (Source Serif 4); this summit page uses a
          grotesque display + body and a mono for the day-sheet voice. */}
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      <link
        href="https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,400;12..96,500;12..96,600;12..96,700;12..96,800&family=Hanken+Grotesk:wght@400;500;600;700&family=Spline+Sans+Mono:wght@400;500;600&display=swap"
        rel="stylesheet"
      />

      <div className="efe">
        {/* HERO */}
        <section className="efe-hero" id="top">
          <div className="efe-wrap">
            <span className="efe-eyebrow">
              <span className="efe-tick" aria-hidden="true" />
              A free community day for Canberra small business · with CBR Innovation Network
            </span>

            <h1 className="efe-h1">
              Entrepreneurship<br />
              for <span className="efe-ev">everyone<span className="efe-ul" aria-hidden="true" /></span>
            </h1>

            <div className="efe-define">
              <p className="efe-def-head">
                <b>everyone</b> &nbsp;/ˈɛv.ri.wʌn/&nbsp; <i>noun</i> — the people this day is for:
              </p>
              <p className="efe-def-body">
                the tradie pricing a job from the front seat of the ute; the new arrival with a
                craft and no local network — yet; the woman turning a weekend side-hustle into the
                main thing; the carer setting up an NDIS or aged-care service; anyone with an idea
                and the nerve to start.<span className="efe-you"> — and you.</span>
              </p>
            </div>

            <p className="efe-sub">
              A free, full-day program of talks, workshops and help-desks for people starting,
              running and growing small businesses in Canberra — with dedicated tracks for diverse
              founders, tradies, and emerging community-service operators.
            </p>

            <SummitCtas surface="hero" />

            <div className="efe-ticket">
              <div className="efe-cell">
                <div className="efe-k">Date</div>
                <div className="efe-v">{SUMMIT.dateLong}</div>
              </div>
              <div className="efe-cell">
                <div className="efe-k">Time</div>
                <div className="efe-v">{SUMMIT.time}<small>networking drinks after</small></div>
              </div>
              <div className="efe-cell">
                <div className="efe-k">Where</div>
                <div className="efe-v">CBR Innovation Network<small>Level 5, 1 Moore Street, Canberra</small></div>
              </div>
              <div className="efe-cell">
                <div className="efe-k">Cost</div>
                <div className="efe-v">Free<small>all welcome</small></div>
              </div>
            </div>
          </div>
        </section>

        {/* RUNNING ORDER */}
        <section className="efe-order" id="program">
          <div className="efe-wrap">
            <div className="efe-order-head">
              <div>
                <span className="efe-seclabel">The running order</span>
                <h2 className="efe-h2">From welcome to country<br />to last orders.</h2>
              </div>
              <div>
                <p className="efe-lead">
                  The shape of the day. A handful of sessions are still locking in presenters —
                  everything else is confirmed. We&apos;re continuing to expand content around NDIS,
                  aged care, disability-led businesses and community-service pathways.
                </p>
                <span className="efe-pill">Free entry · {SUMMIT.dateLong}</span>
              </div>
            </div>

            <div className="efe-rail">
              {PROGRAM.map((slot, i) => (
                <div
                  key={i}
                  className={
                    'efe-slot' +
                    (slot.type === 'pin' ? ' efe-pin' : '') +
                    (slot.type === 'break' ? ' efe-brk' : '')
                  }
                >
                  <div className="efe-time">
                    {slot.time}
                    {slot.end && <span className="efe-end">→ {slot.end}</span>}
                  </div>
                  <div className="efe-slot-body">
                    <h3>{slot.title}</h3>
                    {slot.blurb && <p className="efe-blurb">{slot.blurb}</p>}
                    {slot.sessions && (
                      <ul className="efe-sessions">
                        {slot.sessions.map((s, j) => (
                          <li key={j} className={'efe-session' + (s.helpdesk ? ' efe-help' : '')}>
                            <span className="efe-st">{s.t}</span>
                            <span className="efe-sp">
                              <span className="efe-d" aria-hidden="true" />
                              {s.p === 'TBC' ? <span className="efe-tbc">Presenter TBC</span> : <span>{s.p}</span>}
                            </span>
                            {s.helpdesk && <span className="efe-tag efe-help-tag">Help desk</span>}
                            {s.proposed && <span className="efe-tag efe-prop">Proposed</span>}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* TAKE PART */}
        <section className="efe-part" id="involved">
          <div className="efe-wrap">
            <span className="efe-seclabel">Be part of it</span>
            <h2 className="efe-h2">Eight ways to take part.</h2>
            <p className="efe-lead">
              We&apos;re bringing partners in across the whole program. If any of the following fits
              what your organisation does, apply to take part — we read every application and reply
              within a few business days.
            </p>
            <div className="efe-part-grid">
              {WAYS_TO_HELP.map((w, i) => (
                <div className="efe-pcard" key={i}>
                  <span className="efe-role">{w.tag}</span>
                  <h3>{w.t}</h3>
                  <p>{w.d}</p>
                </div>
              ))}
            </div>
            <div className="efe-part-foot">
              <SummitApplyLink surface="involved" label="Apply to take part" />
            </div>
          </div>
        </section>

        {/* STAKEHOLDERS */}
        <section className="efe-table" id="stakeholders">
          <div className="efe-wrap">
            <div className="efe-table-head">
              <div>
                <span className="efe-seclabel">Who&apos;s at the table</span>
                <h2 className="efe-h2">Thirty-plus partners,<br />and counting.</h2>
              </div>
              <p className="efe-lead">
                Currently involved or invited — and growing. If you don&apos;t see your organisation
                here, that&apos;s our cue to send the next invite.
              </p>
            </div>
            <div className="efe-stk-groups">
              {STAKEHOLDER_GROUPS.map((g) => (
                <div className="efe-stk-group" key={g.label}>
                  <h3 className="efe-group-label">{g.label}</h3>
                  <div className="efe-stk">
                    {g.members.map((s) => (
                      <div className={'efe-scell' + (s.host ? ' efe-host' : '')} key={s.name}>
                        <span className="efe-n">{s.name}</span>
                        <span className="efe-r">{s.role}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
            <div className="efe-table-foot">
              <span>And not limited to the above.</span>
              <span className="efe-dot" aria-hidden="true" />
              <span>Want to be added? <Link href={SUMMIT.applyPath}>Apply to take part.</Link></span>
            </div>
          </div>
        </section>

        {/* REGISTER / GET NOTIFIED */}
        <section className="efe-close" id="get-notified">
          <div className="efe-wrap efe-close-card">
            <div>
              <span className="efe-save">{registrationOpen ? 'Registration is open →' : 'Save the date →'}</span>
              <h2>Be there on 9 July.</h2>
              {registrationOpen ? (
                <p>
                  Entry is free and everyone&apos;s welcome — founders, tradies, side-hustlers, and
                  anyone thinking about starting. Grab your free ticket on Eventbrite, and we&apos;ll
                  email the final program before the day.
                </p>
              ) : (
                <p>
                  Entry is free and everyone&apos;s welcome — founders, tradies, side-hustlers, and
                  anyone thinking about starting. Add the day to your calendar now, and we&apos;ll
                  send the registration link and final program as soon as they&apos;re live.
                </p>
              )}
              <span className="efe-hand">No spam, no drip sequence — one email when it matters.</span>
              <SummitCtas surface="register-section" />
            </div>
            <aside className="efe-onday">
              <h4>On the day</h4>
              <ul>
                <li><span className="efe-b" aria-hidden="true">›</span> {SUMMIT.dateLong}, {SUMMIT.time}</li>
                <li><span className="efe-b" aria-hidden="true">›</span> {SUMMIT.venueFull}</li>
                <li><span className="efe-b" aria-hidden="true">›</span> Free entry · all welcome</li>
                <li><span className="efe-b" aria-hidden="true">›</span> Talks, hands-on workshops &amp; one-to-one help desks</li>
                <li><span className="efe-b" aria-hidden="true">›</span> Quiet catch-up area &amp; accessibility support</li>
              </ul>
            </aside>
          </div>
        </section>
      </div>

      <NewsletterStrip
        source={`event-${SUMMIT.slug}`}
        heading={registrationOpen ? 'Get the final program first.' : 'Get the registration link first.'}
        sub={
          registrationOpen
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
