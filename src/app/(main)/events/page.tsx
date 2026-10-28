import type { Metadata } from 'next';
import { ogBase, twitterBase } from '../shared-metadata';
import Link from 'next/link';
import NewsletterStrip from '@/components/NewsletterStrip';
import SessionsCalendar from '@/components/sections/site/SessionsCalendar';
import Questions from '@/components/sections/site/Questions';
import { getUpcomingEvents } from '@/lib/cms';
import { buildCalendar, dateParts, LAB_STEPS, RUN_SHEET, SESSION_AREAS, SESSION_FORMAT, SESSION_VENUE } from '@/lib/sessions';
import type { Event as PayloadEvent } from '@/payload-types';

const TITLE = 'Sessions and Build Labs — Growth Hub by Himayat';
const DESCRIPTION =
  'Free monthly Growth Hub Sessions and hands-on Build Labs in Canberra. One practical topic a month, with time to work on your own business at the table.';

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: '/events' },
  openGraph: { ...ogBase, title: TITLE, description: DESCRIPTION, url: '/events' },
  twitter: { ...twitterBase, title: TITLE, description: DESCRIPTION },
};

export const revalidate = 3600;

export default async function SessionsPage() {
  const docs = await getUpcomingEvents().catch(() => []);
  const rows = buildCalendar(docs as PayloadEvent[]);
  // Sessions sit on the 2nd Wednesday and Labs on the 4th. Name the next
  // upcoming date that breaks that rhythm (the December pilot, 2 and 9 Dec) so
  // the card stays true; it drops off once that date has passed.
  const offRhythm = (kind: 'session' | 'lab') => {
    const nth = kind === 'session' ? 2 : 4;
    const row = rows.find((r) => r.kind === kind && Math.ceil(Number(r.date.slice(8, 10)) / 7) !== nth);
    if (!row) return '';
    const { day, month, long } = dateParts(row.date);
    return ` · ${long.split(' ').pop()}'s is ${day} ${month}`;
  };

  return (
    <main>
      <section className="site-hero">
        <div className="wrap site-split">
          <div>
            <span className="section-label">Growth Hub Sessions and Build Labs</span>
            <h1 className="hero-h1">Learn it in a room. Use it the same week.</h1>
            <p className="site-lede">
              One practical topic a month, taught by people who do it, with time to
              work on your own business at the table. No pitches, no jargon.
            </p>
            <div className="site-ctas">
              <a className="btn btn-primary" href="#whats-on">See dates</a>
              <a className="btn btn-secondary" href="#build-lab">How a Build Lab works</a>
            </div>
          </div>
          <div className="site-grid" style={{ gridTemplateColumns: '1fr' }}>
            <div className="site-card">
              <span className="site-tag site-tag--free">Session · {SESSION_FORMAT.session.price}</span>
              <h3>Second Wednesday{offRhythm('session')}</h3>
              <p>
                {SESSION_FORMAT.session.time} in {SESSION_VENUE.short}. Ninety
                minutes, one topic, one change to make this week.
              </p>
            </div>
            <div className="site-card">
              <span className="site-tag site-tag--lab">Build Lab · {SESSION_FORMAT.lab.price}</span>
              <h3>Fourth Wednesday{offRhythm('lab')}</h3>
              <p>
                {SESSION_FORMAT.lab.time}, same venue, in person. Bring a laptop and
                leave with a website that&apos;s live.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="site-sec site-sec--white" id="whats-on">
        <div className="wrap">
          <div className="site-head site-head--row">
            <h2 className="section-h2">What&apos;s on</h2>
            <a className="site-link" href="#newsletter">Get new dates by email</a>
          </div>
          <SessionsCalendar rows={rows} />
        </div>
      </section>

      <section className="site-sec">
        <div className="wrap">
          <div className="site-head">
            <span className="section-label">Inside a Session</span>
            <h2 className="section-h2">Ninety minutes. Half of it is about your business.</h2>
          </div>
          <div className="runsheet">
            {RUN_SHEET.map((s) => (
              <div className={`runsheet-step${s.yours ? ' is-yours' : ''}`} key={s.t}>
                <span className="t">{s.t}</span>
                <span className="h">{s.h}</span>
                <span className="p">{s.p}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="site-sec site-sec--teal" id="build-lab">
        <div className="wrap site-split" style={{ alignItems: 'start' }}>
          <div>
            <span className="section-label">Build Lab · one morning · {SESSION_FORMAT.lab.price}</span>
            <h2 className="section-h2">Walk in with a laptop. Walk out with a website that&apos;s live.</h2>
            <p className="section-lead">
              Ten to twelve owners, two helpers and three hours. We check every site with
              you before it goes live, so nothing goes out with placeholder details.
            </p>
            <p className="site-fine" style={{ margin: '20px 0 28px' }}>
              Price includes GST and your first site on the Starter plan. Free seats for
              hardship and partner referrals: just ask.
            </p>
            <div className="site-ctas">
              <a className="btn btn-lime" href="#whats-on">See Build Lab dates</a>
              <Link className="site-link" href="/sites">About Growth Hub Sites</Link>
            </div>
          </div>
          <ol className="lab-steps">
            {LAB_STEPS.map((s) => (
              <li className="lab-step" key={s.h}>
                <span className="t">{s.t}</span>
                <span>
                  <b>{s.h}</b> <span>{s.p}</span>
                </span>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="site-sec">
        <div className="wrap">
          <div className="site-head">
            <span className="section-label">The five topics</span>
            <h2 className="section-h2">Each one comes round once a season</h2>
          </div>
          <div className="site-grid site-grid--small">
            {SESSION_AREAS.map((a) => (
              <div className="site-card" key={a.area}>
                <h3>{a.area}</h3>
                <p>{a.blurb}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="site-sec site-sec--tight">
        <div className="wrap">
          <div className="site-panel site-panel--lavender">
            <div>
              <span className="section-label">For organisations</span>
              <h2 className="section-h2">Co-host a Session with us</h2>
            </div>
            <div>
              <p>
                Bring your expertise and your community. We bring the room, the format
                and the follow-up. Settlement services, employment providers and
                industry groups are all welcome.
              </p>
              <Link className="site-link" href="/partners#work-with-us">Ways to work with us</Link>
            </div>
          </div>
        </div>
      </section>

      <section className="site-sec site-sec--white">
        <div className="wrap">
          <h2 className="section-h2">Questions</h2>
          <Questions
            items={[
              {
                q: 'Is it really free?',
                a: 'Yes. Sessions are free and there is no pitch. Build Labs cost A$179 because you leave with a working website and two people helping you get there.',
              },
              {
                q: "I'm only just starting out. Is it for me?",
                a: "Yes. Tables are grouped by stage (starting out, trading or growing), so you'll be working with people at the same point as you.",
              },
              {
                q: 'Is this the CBRIN Digital Solutions program?',
                a: "No. Sessions are run by Growth Hub. CBR Innovation Network's program is separate and offers one-on-one advice; we'll show you how to apply.",
              },
              {
                q: 'Can I watch online, or later?',
                a: 'Not for the 2026 pilot Sessions: they are in person. Everyone who registers gets the slides and three next steps by email afterwards.',
              },
              {
                q: 'Can I bring an interpreter, or ask for other support?',
                a: "Yes. Tell us what you need when you register, whether that's an interpreter, Auslan or access support, and we'll arrange it.",
              },
            ]}
          />
        </div>
      </section>

      <div id="newsletter">
        <NewsletterStrip
          source="events"
          heading="Get new Session dates by email."
          sub="One email a month with what's on next."
        />
      </div>
    </main>
  );
}
