import type { Metadata } from 'next';
import Link from 'next/link';
import Contact from '@/components/sections/Contact';
import { getSiteSettings } from '@/lib/cms';

export const metadata: Metadata = {
  title: 'The Small Business Journey — Growth Hub by Himayat',
  description:
    "A full-day community event for Canberra small business. Working title — we'd love your input on the name, the program, and who else should be at the table.",
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
    ],
  },
  { time: '5:00pm', end: 'late', type: 'pin', title: 'Networking drinks & informal connections', blurb: 'Continuing the conversation — likely at an external venue/pub. Details TBC.' },
];

const WAYS_TO_HELP = [
  { t: 'Speaking engagements or workshop presentations', d: 'Lead a session in your area of expertise. 30–60 minute slots available across the day.', tag: 'Speaker' },
  { t: 'Panel discussions', d: 'Join a short, candid panel — first-time founders, tradies, or community-service operators.', tag: 'Panellist' },
  { t: 'Stallholder / exhibitor participation', d: 'Set up a table in the networking area. Bring brochures, demos, and the people behind the brand.', tag: 'Exhibitor' },
  { t: 'Inclusivity support & community engagement', d: 'Help us make the day genuinely accessible — translation, sensory-friendly spaces, advisory input.', tag: 'Inclusivity' },
  { t: 'Promotion through stakeholder networks', d: "Share the event with your members, clients and database. We'll provide co-branded assets.", tag: 'Promotion' },
  { t: 'Help desk or advisory support', d: 'Staff a one-to-one help desk — getting online, business planning, or general advice.', tag: 'Advisor' },
  { t: 'Sponsorship', d: 'Underwrite catering, materials, lucky-door prizes, or after-hours drinks. Tiered options available.', tag: 'Sponsor' },
  { t: "Collaborative opportunities", d: "Have an idea we haven't listed? Co-deliver something with us. Get in touch.", tag: 'Open' },
];

const STAKEHOLDERS = [
  { name: 'The Growth Hub', role: 'Host & convenor', host: true },
  { name: 'Himayat', role: 'Co-host & community' },
  { name: 'Asuria', role: 'Business planning' },
  { name: 'Realise Business', role: 'Advisory' },
  { name: 'Many Rivers', role: 'Microfinance' },
  { name: 'Canberra Business Chamber', role: 'Industry' },
  { name: 'Navitas', role: 'Skills & training' },
  { name: 'Normtech', role: 'IT & cyber security' },
  { name: 'What Works', role: 'Tradie support' },
  { name: 'Her Zest', role: 'Women in business' },
  { name: 'National Self Employment Association', role: 'Self-employment' },
  { name: 'DEWR', role: 'Government' },
  { name: 'RD Consulting', role: 'Marketing & LinkedIn' },
  { name: 'Small Business Digital', role: 'Digital programs' },
  { name: 'ICN', role: 'Industry capability' },
  { name: 'CWB', role: 'Community business' },
  { name: 'MARSS', role: 'Migrant & refugee' },
  { name: 'Red Cross', role: 'Community services' },
  { name: 'Hands Across Canberra', role: 'Community funding' },
  { name: 'Mill House Ventures', role: 'Social enterprise' },
];

export default async function SmallBusinessJourneyPage() {
  const siteSettings = await getSiteSettings();

  return (
    <main>
      {/* HERO */}
      <section className="hero event-hero" id="top">
        <div className="wrap">
          <Link
            href="/events"
            className="ed-back"
            style={{ display: 'inline-flex', alignItems: 'center', gap: 8, color: 'var(--plum)', fontSize: 14, marginBottom: 24 }}
          >
            ← All events
          </Link>
          <div className="hero-eyebrow">
            <span className="dot" />
            A community day for Canberra small business
          </div>
          <h1 className="hero-h1">
            The Small Business <span className="grow">Journey</span>
            <span className="draft-tag">Working title</span>
          </h1>
          <div className="hero-handnote" style={{ marginTop: 24 }}>
            <span className="txt handscript">Start. Build. Grow — together.</span>
          </div>
          <p className="hero-sub">
            A one-day program of talks, workshops and help-desks for people starting,
            running and growing small businesses in Canberra — with dedicated tracks
            for diverse founders, tradies, and emerging community-service operators.
          </p>
          <div className="hero-ctas">
            <a className="btn btn-primary" href="#involved">
              Get involved
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" aria-hidden="true"><path d="M3 7h8M7 3l4 4-4 4" /></svg>
            </a>
            <a className="btn btn-secondary" href="#program">See the draft program</a>
          </div>

          <div className="event-keyfacts">
            <div className="event-keyfact"><span className="lbl">Date</span><span className="val"><em>To be confirmed</em> · 2026</span></div>
            <div className="event-keyfact"><span className="lbl">Location</span><span className="val">Canberra ACT</span></div>
            <div className="event-keyfact"><span className="lbl">Format</span><span className="val">Free · all-day · inclusive</span></div>
            <div className="event-keyfact"><span className="lbl">Audience</span><span className="val">Small &amp; emerging business</span></div>
          </div>
        </div>
      </section>

      {/* SCHEDULE */}
      <section className="schedule" id="program">
        <div className="wrap">
          <div className="schedule-head">
            <span className="section-label">Draft program</span>
            <h2 className="section-h2">A full day of practical<br />help — from welcome<br />to last orders.</h2>
            <p className="naming-lead">
              For discussion purposes only. The schedule will continue evolving as
              stakeholders come onboard and we expand content around NDIS, aged care,
              disability-led businesses and community service pathways.
            </p>
            <span className="draft-pill">
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" aria-hidden="true"><circle cx="7" cy="7" r="5" /><path d="M7 4v3l2 1.5" /></svg>
              Subject to change · stakeholders welcome
            </span>
          </div>

          <div className="schedule-list">
            {PROGRAM.map((slot, i) => (
              <div
                key={i}
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
                        <li key={j} className={'session' + (s.helpdesk ? ' is-helpdesk' : '') + (s.proposed ? ' is-proposed' : '')}>
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
            ))}
          </div>
        </div>
      </section>

      {/* GET INVOLVED */}
      <section className="involved" id="involved">
        <div className="wrap">
          <span className="section-label">Get involved</span>
          <h2 className="section-h2">Eight ways to be<br />part of the day.</h2>
          <p className="involved-lead">
            We&apos;re actively seeking stakeholder involvement across the program. If any of
            the following fits what your organisation does, we&apos;d love to hear from you.
          </p>
          <div className="involved-grid">
            {WAYS_TO_HELP.map((w, i) => (
              <div className="inv-card" key={i}>
                <span className="inv-num">No. 0{i + 1}</span>
                <h3>{w.t}</h3>
                <p>{w.d}</p>
                <span className="inv-tag">{w.tag}</span>
              </div>
            ))}
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
          <div className="stakes-grid">
            {STAKEHOLDERS.map((s) => (
              <div className={'stake-cell' + (s.host ? ' is-host' : '')} key={s.name}>
                <span className="stake-name">{s.name}</span>
                <span className="stake-role">{s.role}</span>
              </div>
            ))}
          </div>
          <div className="stakes-foot">
            <span>And not limited to the above.</span>
            <span className="dot" />
            <span>Want to be added? <a href="#feedback" style={{ color: 'var(--plum)', textDecoration: 'underline', textUnderlineOffset: 3 }}>Drop us a line.</a></span>
          </div>
        </div>
      </section>

      {/* FEEDBACK CTA */}
      <section className="feedback-cta" id="feedback">
        <div className="wrap">
          <div className="feedback-card">
            <div>
              <span className="section-label handscript" style={{ color: 'var(--lime)', textTransform: 'none', fontSize: 22, letterSpacing: 0 }}>
                We&apos;d love your input →
              </span>
              <h2 className="section-h2" style={{ marginTop: 12 }}>Help shape the day.</h2>
              <p>
                We&apos;re still building this — the name, the program, the stallholders, the
                after-hours pub. Tell us what we&apos;re missing, what you&apos;d attend, or what
                your organisation could bring.
              </p>
              <span className="hand">— honest feedback only, no marketing speak.</span>
              <div className="hero-ctas" style={{ marginTop: 24 }}>
                <a className="btn btn-primary" href="mailto:hello@himayat.com.au?subject=Event%20feedback%20%E2%80%94%20Small%20Business%20Journey">
                  Send feedback
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" aria-hidden="true"><path d="M3 7h8M7 3l4 4-4 4" /></svg>
                </a>
                <a className="btn btn-secondary" href="mailto:hello@himayat.com.au?subject=Stakeholder%20interest%20%E2%80%94%20Small%20Business%20Journey">
                  Register interest
                </a>
              </div>
            </div>
            <div className="feedback-side">
              <h4>What we&apos;re asking</h4>
              <ul>
                <li>Which working name lands best — or what should we call it?</li>
                <li>Are there sessions or topics missing from the draft program?</li>
                <li>What role would your organisation like to play?</li>
                <li>Who else should be at the table?</li>
                <li>What would make this day genuinely accessible for your community?</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      <Contact
        supportEmail={siteSettings?.supportEmail ?? null}
        phone={siteSettings?.phone ?? null}
        address={siteSettings?.address ?? null}
      />
    </main>
  );
}
