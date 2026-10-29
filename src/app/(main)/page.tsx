import type { Metadata } from 'next';
import { ogBase, twitterBase } from './shared-metadata';
import Link from 'next/link';
import NewsletterStrip from '@/components/NewsletterStrip';
import BrowserMock from '@/components/sections/site/BrowserMock';
import FreeSeatNote from '@/components/sections/site/FreeSeatNote';
import GrowWord from '@/components/sections/site/GrowWord';
import SessionTicket from '@/components/sections/site/SessionTicket';
import { getUpcomingEvents } from '@/lib/cms';
import { buildCalendar, dateParts, nextSession, rowCta, SESSION_FORMAT } from '@/lib/sessions';
import { CBRIN_DIGITAL_SOLUTIONS_URL, FREE_SEATS } from '@/lib/site';
import type { Event as PayloadEvent } from '@/payload-types';

// The home page is built in code (it no longer renders the CMS "home" page
// blocks): one story, three ways in, and the next real date on the calendar.

const TITLE = 'Growth Hub by Himayat — Your business deserves to grow.';
const DESCRIPTION =
  'Free monthly Sessions, hands-on Build Labs and websites you can run yourself. Built for the Canberra owners big agencies overlook, and open to every small business. Run by Himayat, a Canberra social enterprise.';

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: '/' },
  openGraph: { ...ogBase, title: TITLE, description: DESCRIPTION, url: '/' },
  twitter: { ...twitterBase, title: TITLE, description: DESCRIPTION },
};

export const revalidate = 3600;

const WAYS_IN = [
  {
    kicker: '1 · Free, monthly',
    title: 'Come to a Session',
    body: 'Ninety minutes on one practical topic, with other local owners. You leave with one change to make this week.',
    href: '/events',
    cta: 'See the calendar',
  },
  {
    kicker: `2 · One morning, ${SESSION_FORMAT.lab.price}`,
    title: 'Build your site at a Build Lab',
    body: "Bring a laptop and what you know about your business. With us beside you, you leave with a website that's live.",
    href: '/events#build-lab',
    cta: 'How a Build Lab works',
  },
  {
    kicker: '3 · From A$39 a month',
    title: 'Keep growing with Growth Hub Sites',
    body: 'Your own domain, bookings, a simple shop and help when you need it. Or we build it with you.',
    href: '/sites',
    cta: 'See plans',
  },
];

// Who Growth Hub is for. Named so people recognise themselves, never so anyone
// feels shut out: the line under the cards says every owner is welcome.
const FOR_WHO = [
  {
    title: 'New and emerging owners',
    body: 'Just got an ABN, or still deciding? Start with the basics, at a table with people at the same stage.',
  },
  {
    title: 'Migrant and refugee founders',
    body: 'You may have run a business before, just not here. We cover the local side: how Canberra customers search, book and pay. Bring an interpreter or a friend if it helps.',
  },
  {
    title: 'Sole traders',
    body: 'One person doing every job. Ninety minutes, one topic and one change you can make that week.',
  },
  {
    title: 'Owners doing it tough',
    body: "Money's tight or life's got hard. Sessions are free, and you can ask for a free Build Lab seat with a message. No proof needed.",
    seats: true,
  },
];

// What "for everyone" means in practice. Each is a promise the event pages,
// the Build Lab and the About page already make; keep them in step.
const COMMITMENTS: Array<{ text: string; href?: string }> = [
  { text: 'An interpreter, Auslan or access support on request' },
  { text: 'Free Build Lab seats for hardship and partner referrals', href: FREE_SEATS.path },
  { text: 'No sales pitch in a free Session' },
  { text: 'A person answers, by email or phone' },
];

export default async function HomePage() {
  const docs = await getUpcomingEvents().catch(() => []);
  const rows = buildCalendar(docs as PayloadEvent[]);
  const next = nextSession(rows);
  const nextLab = rows.find((r) => r.kind === 'lab') ?? null;
  const season = rows.filter((r) => r.kind === 'session').slice(0, 5);
  // One label per state: "Book a seat" once there's a booking link, "See
  // details" for an event page without one, "See dates" for the calendar.
  const { label: bookLabel, href: bookHref } = rowCta(next);

  return (
    <main className="has-sticky-cta">
      <section className="site-hero">
        <div className="wrap site-split">
          <div>
            <h1 className="hero-h1">
              Your business deserves to <GrowWord />.
            </h1>
            <p className="site-lede site-lede--wide">
              Free monthly Sessions, a hands-on Build Lab and a website you can run
              yourself. Built for the Canberra owners big agencies overlook: new
              founders, migrant and refugee founders, sole traders and anyone doing
              it tough. Everyone&apos;s welcome.
            </p>
            <div className="site-ctas" style={{ marginBottom: 20 }}>
              <Link className="btn btn-primary" href={bookHref}>{bookLabel}</Link>
              <Link className="btn btn-secondary" href="/sites">See Growth Hub Sites</Link>
            </div>
            <p className="site-fine">Run by Himayat, a Canberra social enterprise.</p>
          </div>
          <SessionTicket session={next} lab={nextLab} />
        </div>
      </section>

      <section className="site-sec site-sec--white">
        <div className="wrap">
          <div className="site-head">
            <span className="section-label">How it works</span>
            <h2 className="section-h2">Three ways in. Start wherever suits you.</h2>
          </div>
          <div className="site-grid">
            {WAYS_IN.map((w) => (
              <div className="site-card site-card--egg" key={w.title}>
                <span className="site-kicker">{w.kicker}</span>
                <h3>{w.title}</h3>
                <p>{w.body}</p>
                <Link className="site-link" href={w.href}>{w.cta}</Link>
              </div>
            ))}
          </div>
          <FreeSeatNote style={{ marginTop: 24 }} />
        </div>
      </section>

      <section className="site-sec" id="who-its-for">
        <div className="wrap">
          <div className="site-head">
            <span className="section-label">Who Growth Hub is for</span>
            <h2 className="section-h2">If growth support has passed you by, start here.</h2>
          </div>
          <div className="site-grid for-who">
            {FOR_WHO.map((f) => (
              <div className="site-card" key={f.title}>
                <h3>{f.title}</h3>
                <p>{f.body}</p>
                {f.seats && <Link className="site-link" href={FREE_SEATS.path}>How to ask</Link>}
              </div>
            ))}
          </div>
          <p className="section-lead" style={{ marginTop: 28 }}>
            Not on this list? You&apos;re welcome too. Every Session is open to any
            Canberra small business.
          </p>
        </div>
      </section>

      {season.length > 0 && (
        <section className="site-sec site-sec--tight">
          <div className="wrap">
            <div className="site-head site-head--row">
              <div>
                <span className="section-label">Growth Hub Sessions · Wednesday lunchtime</span>
                <h2 className="section-h2">One practical topic a month</h2>
              </div>
              <div className="site-links">
                <Link className="site-link" href="/guides">Free guide for every topic</Link>
                <Link className="site-link" href="/events">All Sessions and Build Labs</Link>
              </div>
            </div>
            <div className="site-grid site-grid--small">
              {season.map((r) => {
                const p = dateParts(r.date);
                return (
                  <div className="season-card" key={r.key}>
                    <span className="when">{p.day} {p.month}</span>
                    {r.area && <span className="site-tag site-tag--free">{r.area}</span>}
                    {r.href ? (
                      <Link className="title" href={r.href}>{r.title}</Link>
                    ) : (
                      <span className="title">{r.title}</span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      )}

      <section className="site-sec site-sec--teal">
        <div className="wrap site-split">
          <div>
            <span className="section-label">Growth Hub Sites</span>
            <h2 className="section-h2">A website you can run yourself. Live in a morning.</h2>
            <p className="section-lead">
              Start from a template made for your kind of business, check it with us,
              and publish. Bookings, a menu or a shop when you need them.
            </p>
            <div className="site-ctas" style={{ marginTop: 28 }}>
              <Link className="btn btn-lime" href="/sites">See plans and templates</Link>
              <span className="site-fine">From A$39 a month</span>
            </div>
          </div>
          <BrowserMock />
        </div>
      </section>

      <section className="site-sec">
        <div className="wrap">
          <div className="site-panel site-panel--lime">
            <div>
              <span className="section-label">Free expert advice, too</span>
              <h2 className="section-h2">Run an ACT business? You may be eligible for five hours of one-on-one digital advice.</h2>
            </div>
            <div>
              <p>
                CBR Innovation Network&apos;s Digital Solutions program offers up to five
                hours with an expert, for $110 or free if you&apos;re doing it tough. We
                point people to the right door at every Session.
              </p>
              <a className="site-link" href={CBRIN_DIGITAL_SOLUTIONS_URL}>About the program, on CBRIN&apos;s site</a>
            </div>
          </div>
        </div>
      </section>


      <section className="site-sec site-sec--plum">
        <div className="wrap site-split">
          <div>
            <p className="site-statement">Support that starts where systems stop. With people.</p>
            <span className="site-script handscript">beside you, not above you</span>
          </div>
          <div>
            <p className="section-lead" style={{ marginTop: 0 }}>
              Himayat started by helping people find their way through systems that
              weren&apos;t built for them. Growth Hub brings the same patience to running a
              small business: plain answers, in a room, with people who&apos;ve done it.
            </p>
            <ul className="commitments">
              {COMMITMENTS.map((c) => (
                <li key={c.text}>{c.href ? <Link href={c.href}>{c.text}</Link> : c.text}</li>
              ))}
            </ul>
            <Link className="site-link" href="/about">Who we are</Link>
          </div>
        </div>
      </section>

      <div id="newsletter">
        <NewsletterStrip
          source="home"
          heading="Get the next Session in your inbox."
          sub="One email a month with what's on next."
        />
      </div>

      {next && (
        <div className="sticky-cta">
          <span className="txt">
            Next: {dateParts(next.date).weekday} {dateParts(next.date).day} {dateParts(next.date).month}
            <br />
            <b>{next.title} · free</b>
          </span>
          <Link className="btn btn-primary" href={bookHref}>
            {bookLabel}
          </Link>
        </div>
      )}
    </main>
  );
}
