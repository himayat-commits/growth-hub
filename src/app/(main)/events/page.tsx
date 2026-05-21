import type { Metadata } from 'next';
import Link from 'next/link';
import { toPublicEvents } from '@/lib/events-data';
import UpcomingFilterList from './UpcomingFilterList';
import Contact from '@/components/sections/Contact';
import { getPublicEvents, getSiteSettings } from '@/lib/cms';
import type { Event as PayloadEvent } from '@/payload-types';

// Past-event "from the archive" snapshot. Kept inline rather than in
// Payload because these are static historical references with bespoke
// stats; promoting them to a schema would add a `pastEventStats` field
// nobody asked for. Migrate when there's a real editor request.
const PAST_PUBLIC_EVENTS = [
  { title: 'Digital Marketing Day 2025', desc: 'A one-day intensive across SEO, paid social, content and CRM basics — co-hosted with RD Consulting.', tag: 'Workshop', tagClass: 'tag-workshop', date: 'November 2025', stats: [{ n: '84', l: 'Attendees' }, { n: '92%', l: 'Would recommend' }] },
  { title: 'Birdeye Partnership Launch', desc: 'Marking our reputation-tooling partnership with Birdeye — onboarding 12 founding-cohort members on the night.', tag: 'Mixer', tagClass: 'tag-mixer', date: 'September 2025', stats: [{ n: '60+', l: 'Founders' }, { n: '12', l: 'Cohort onboarded' }] },
  { title: 'Welcome to Country Kickoff', desc: 'Our 2025 program opener — Welcome to Country, year ahead, and the first community grant announcement.', tag: 'Community', tagClass: 'tag-community', date: 'February 2025', stats: [{ n: '120', l: 'In the room' }, { n: '$25K', l: 'Grants announced' }] },
];

export const metadata: Metadata = {
  title: 'Events — Growth Hub by Himayat',
  description:
    'Workshops, founder mixers, free clinics and our annual summit — practical, community-first events in Canberra. Mostly free, always inclusive.',
};

export const revalidate = 3600;

// Partner glyph re-used from the partners page vocabulary.
function PartnerGlyph({ shape }: { shape: string }) {
  const stroke = 'var(--teal)';
  const common = {
    fill: 'none',
    stroke,
    strokeWidth: 1.4,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
  };
  const inner: Record<string, React.ReactNode> = {
    leaf: <path d="M4 22 C 4 12, 12 4, 22 4 L 22 22 Z" />,
    arc: <path d="M4 22 A 18 18 0 0 1 22 4" />,
    diamond: <path d="M13 3 L 23 13 L 13 23 L 3 13 Z" />,
    circle: <circle cx={13} cy={13} r={9} />,
    triangle: <path d="M13 4 L 22 22 L 4 22 Z" />,
    bars: (
      <g>
        <rect x={4} y={6} width={3} height={14} />
        <rect x={10} y={10} width={3} height={10} />
        <rect x={16} y={4} width={3} height={16} />
      </g>
    ),
    cross: (
      <g>
        <path d="M5 13 H 21" />
        <path d="M13 5 V 21" />
      </g>
    ),
    hex: <path d="M13 3 L 22 8 L 22 18 L 13 23 L 4 18 L 4 8 Z" />,
  };
  return (
    <svg viewBox="0 0 26 26" width="22" height="22" {...common}>
      {inner[shape] ?? inner.circle}
    </svg>
  );
}

const EVENT_PARTNERS: Array<{ name: string; shape: string; role: string }> = [
  { name: 'Birdeye', shape: 'circle', role: 'Technology' },
  { name: 'CBR Innovation Network', shape: 'hex', role: 'Industry' },
  { name: 'ACT Government', shape: 'diamond', role: 'Funding' },
  { name: 'Canberra Business Chamber', shape: 'bars', role: 'Industry' },
  { name: 'GRIFFIN Accelerator', shape: 'triangle', role: 'Programs' },
  { name: 'Lighthouse Business', shape: 'arc', role: 'Advisory' },
  { name: 'Muslim Community Co-op', shape: 'leaf', role: 'Community' },
  { name: 'What Works', shape: 'cross', role: 'Tradie support' },
  { name: 'RD Consulting', shape: 'bars', role: 'Marketing' },
  { name: 'Normtech', shape: 'hex', role: 'IT & cyber' },
  { name: 'Asuria', shape: 'circle', role: 'Business planning' },
  { name: 'Hands Across Canberra', shape: 'leaf', role: 'Community funding' },
];

const TESTIMONIALS = [
  { q: "Walked in with a half-built website and walked out with the next three things to fix. Every other workshop I've been to is selling something — this one wasn't.", name: 'Priya Subramaniam', role: 'Founder · Saffron Bakery', initials: 'PS', event: 'Digital Marketing Day' },
  { q: "I'd never been in a room with twenty other migrant founders before. Everyone got it. I didn't have to explain.", name: 'Hossein A.', role: "Owner · Hossein's Persian Kitchen", initials: 'HA', event: 'Migrant Founders Mixer' },
  { q: "Showed up to office hours with a grant draft that wasn't going anywhere. Left with a re-scoped application that got funded six weeks later.", name: 'Tara Whittaker', role: 'Director · NorthLine Care', initials: 'TW', event: 'Grants Office Hours' },
  { q: "Best two hours of CPD I've done all year. I'm a sparky, I don't usually rate workshops — this one I'd send my apprentices to.", name: 'Dean P.', role: 'Sole-trader · Capital Sparks', initials: 'DP', event: 'Tradie Tax Time' },
  { q: "It's the quiet catch-up area that did it for me. I'm autistic — most networking is exhausting. They thought about it.", name: 'Erin Mclean', role: 'Founder · Quiet Hour Studio', initials: 'EM', event: 'Digital Marketing Day' },
  { q: "Genuinely the only event where I've ever been introduced to a customer in the same hour I met them. Not the keynote — the side conversation.", name: 'Joseph K.', role: 'Co-founder · Brindabella Build', initials: 'JK', event: 'Founders Yarn' },
];

export default async function EventsHubPage() {
  const [siteSettings, eventDocs] = await Promise.all([
    getSiteSettings(),
    getPublicEvents(),
  ]);
  const PUBLIC_EVENTS = toPublicEvents(eventDocs as PayloadEvent[]);
  const featured = PUBLIC_EVENTS.find((e) => e.featured) ?? PUBLIC_EVENTS[0];

  return (
    <main>
      {/* HERO */}
      <section className="hero events-hero" id="top">
        <div className="wrap">
          <div className="hero-eyebrow">
            <span className="dot" />
            Workshops, mixers, summits &amp; clinics
          </div>
          <h1 className="hero-h1">
            Where the work <span className="grow">happens</span>.
          </h1>
          <div className="hero-handnote" style={{ marginTop: 24 }}>
            <span className="txt handscript">In a room. Off a screen. With people.</span>
          </div>
          <p className="hero-sub">
            Our events are how the Growth Hub shows up in the neighbourhood — practical
            workshops, founder mixers, free clinics, and an annual summit. All in
            Canberra, mostly free, always inclusive.
          </p>
          <div className="events-meta">
            <div className="stat"><span className="n">50+</span><span className="l">Events delivered</span></div>
            <div className="stat"><span className="n">400+</span><span className="l">People in the room</span></div>
            <div className="stat"><span className="n">12</span><span className="l">Partner orgs co-hosting</span></div>
            <div className="stat"><span className="n">100%</span><span className="l">Free entry · always</span></div>
          </div>
        </div>
      </section>

      {/* FEATURED */}
      {featured && (
        <section className="featured-event">
          <div className="wrap">
            <Link className="featured-card" href={`/events/${featured.slug}`}>
              <div className="fe-copy">
                <div>
                  <span className="fe-badge"><span className="pulse" />Next up · annual summit</span>
                  <h2>{featured.title}</h2>
                  <span className="fe-script">Start. Build. Grow — together.</span>
                  <p className="fe-desc">{featured.desc}</p>
                </div>
                <div>
                  <div className="fe-meta">
                    <div className="it"><span className="l">When</span><span className="v">{featured.dateLong}</span></div>
                    <div className="it"><span className="l">Where</span><span className="v">{featured.location}</span></div>
                    <div className="it"><span className="l">Cost</span><span className="v">{featured.cost} · all-day</span></div>
                  </div>
                  <span className="fe-arrow">
                    See the program &amp; get involved
                    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" aria-hidden="true">
                      <path d="M3 9h11M9 4l5 5-5 5" />
                    </svg>
                  </span>
                </div>
              </div>
              <div className="fe-side">
                <div className="fe-date-block">
                  <span className="month">{featured.monthShort}</span>
                  <span className="day"><em>?</em></span>
                  <span className="year">{featured.year}</span>
                </div>
                <div className="fe-side-foot">
                  <span className="label">Currently working on</span>
                  <div className="row"><span>Name &amp; branding</span><span className="v">In review</span></div>
                  <div className="row"><span>Stakeholder lineup</span><span className="v">20 invited</span></div>
                  <div className="row"><span>Sponsorship</span><span className="v">Open</span></div>
                </div>
              </div>
            </Link>
          </div>
        </section>
      )}

      {/* UPCOMING */}
      <section className="events-list" id="upcoming">
        <div className="wrap">
          <div className="events-list-head">
            <div>
              <span className="section-label">Upcoming events</span>
              <h2 className="section-h2">What&apos;s coming up.</h2>
            </div>
            <p className="ep-lead">
              Workshops, mixers and clinics across the next few months. Tap any event to
              see the details.
            </p>
          </div>
          <UpcomingFilterList events={PUBLIC_EVENTS} />
        </div>
      </section>

      {/* PAST */}
      <section className="past-events" id="past">
        <div className="wrap">
          <span className="section-label">From the archive</span>
          <h2 className="section-h2">Past events.</h2>
          <p className="ep-lead" style={{ marginTop: 12 }}>
            A snapshot of what we&apos;ve already delivered. The full archive is available on request.
          </p>
          <div className="past-grid">
            {PAST_PUBLIC_EVENTS.map((e, i) => (
              <div className="past-card" key={i}>
                <span className={'ev-tag ' + e.tagClass}>{e.tag}</span>
                <h3>{e.title}</h3>
                <span className="past-date">{e.date}</span>
                <p>{e.desc}</p>
                <div className="past-numbers">
                  {e.stats.map((s, j) => (
                    <div key={j}>
                      <span className="n">{s.n}</span>
                      <span className="l">{s.l}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* EVENT PARTNERS */}
      <section className="event-partners" id="partners">
        <div className="wrap">
          <div className="ep-head">
            <div>
              <span className="section-label">Event partners</span>
              <h2 className="section-h2">The orgs who make<br />the room happen.</h2>
            </div>
            <p className="ep-lead">
              Speakers, sponsors, co-hosts, help-desk volunteers. Some are with us every
              event; others come in for the specialised ones. All show up.
            </p>
          </div>
          <div className="ep-grid">
            {EVENT_PARTNERS.map((p) => (
              <div className="ep-cell" key={p.name}>
                <span className="ep-mark"><PartnerGlyph shape={p.shape} /></span>
                <span className="ep-name">{p.name}</span>
                <span className="ep-role">{p.role}</span>
              </div>
            ))}
          </div>
          <div className="ep-foot">
            <span>Want to co-host?</span>
            <span className="sep" />
            <Link href="/partners" style={{ color: 'var(--plum)', textDecoration: 'underline', textUnderlineOffset: 3 }}>Read our partnership page →</Link>
          </div>
        </div>
      </section>

      {/* TESTIMONIALS */}
      <section className="event-tms" id="testimonials">
        <div className="wrap">
          <span className="section-label">What people say</span>
          <h2 className="section-h2">Six voices.<br />One room at a time.</h2>
          <p className="section-lead">
            Testimonials from attendees of recent events. No promo. No marketing speak.
          </p>
          <div className="tm-grid">
            {TESTIMONIALS.map((t) => (
              <article className="tm-card" key={t.name}>
                <span className="qmark">&ldquo;</span>
                <p>{t.q}</p>
                <span className="tm-stars" aria-label="5 out of 5">
                  {[0, 1, 2, 3, 4].map((k) => (
                    <svg key={k} width="14" height="14" viewBox="0 0 14 14" fill="currentColor" aria-hidden="true">
                      <path d="M7 1.5l1.7 3.4 3.8.5-2.7 2.7.6 3.8L7 10.1 3.6 11.9l.6-3.8L1.5 5.4l3.8-.5z" />
                    </svg>
                  ))}
                </span>
                <footer>
                  <span className="tm-avatar">{t.initials}</span>
                  <span className="tm-who">
                    <span className="name">{t.name}</span>
                    <span className="role">{t.role}</span>
                  </span>
                  <span className="tm-event">{t.event}</span>
                </footer>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* PROPOSE CTA */}
      <section className="propose" id="propose">
        <div className="wrap">
          <div className="propose-card">
            <div>
              <span className="section-label handscript" style={{ color: 'var(--lime)', textTransform: 'none', fontSize: 22, letterSpacing: 0 }}>
                Got an idea? →
              </span>
              <h2 className="section-h2" style={{ marginTop: 12 }}>
                Run an event with us.
              </h2>
              <p>
                We co-host with partners every month — workshops, panels, clinics, mixers.
                If you&apos;ve got an audience that needs the room, or a session you&apos;ve been
                meaning to teach, let&apos;s talk.
              </p>
              <div className="hero-ctas" style={{ marginTop: 24 }}>
                <a className="btn btn-primary" href="mailto:hello@himayat.com.au?subject=Propose%20an%20event">
                  Propose an event
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" aria-hidden="true"><path d="M3 7h8M7 3l4 4-4 4" /></svg>
                </a>
                <a className="btn btn-secondary" href="mailto:hello@himayat.com.au?subject=Event%20newsletter">Get the events newsletter</a>
              </div>
            </div>
            <div className="propose-side">
              <h4>What we co-host best</h4>
              <ul>
                <li>Practical, hands-on workshops (max 2 hours)</li>
                <li>Founder mixers with structure — not just drinks</li>
                <li>Drop-in clinics on specific topics (grants, AI, tax, cyber)</li>
                <li>Annual or seasonal summits with multiple tracks</li>
                <li>Community circles for under-served founder groups</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Contact reuses the shared marketing form. */}
      <Contact
        supportEmail={siteSettings?.supportEmail ?? null}
        phone={siteSettings?.phone ?? null}
        address={siteSettings?.address ?? null}
      />
    </main>
  );
}
