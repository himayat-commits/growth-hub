import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import {
  getEventBySlug,
  getGenericEventSlugs,
  getPublicEvents,
  getSiteSettings,
} from '@/lib/cms';
import { toPublicEvent, toPublicEvents } from '@/lib/events-data';
import type { Event as PayloadEvent } from '@/payload-types';
import Contact from '@/components/sections/Contact';
import RsvpMailtoLink from './RsvpMailtoLink';

export const revalidate = 3600;

export async function generateStaticParams() {
  const slugs = await getGenericEventSlugs();
  return slugs.map((slug) => ({ slug }));
}

type Params = Promise<{ slug: string }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { slug } = await params;
  const doc = await getEventBySlug(slug);
  if (!doc) return { title: 'Event — Growth Hub by Himayat' };
  const ev = toPublicEvent(doc as PayloadEvent);
  return {
    title: `${ev.title} — Growth Hub by Himayat`,
    description: ev.desc,
  };
}

export default async function GenericEventPage({ params }: { params: Params }) {
  const { slug } = await params;
  const doc = await getEventBySlug(slug);
  if (!doc) notFound();

  const ev = toPublicEvent(doc as PayloadEvent);

  // Bespoke events have their own static route — bounce so the dynamic
  // route never out-competes the hand-built layout.
  if (ev.bespoke) redirect(`/events/${ev.slug}`);

  const [siteSettings, allDocs] = await Promise.all([
    getSiteSettings(),
    getPublicEvents(),
  ]);
  const related = toPublicEvents(allDocs as PayloadEvent[])
    .filter((e) => e.slug !== ev.slug)
    .slice(0, 3);

  return (
    <main>
      <section className="hero event-hero event-detail" id="top">
        <div className="wrap">
          <Link href="/events" className="ed-back">← All events</Link>
          <div className="hero-eyebrow">
            <span className="dot" />
            {ev.tag}
            {ev.audience ? ` · ${ev.audience}` : ''}
          </div>
          <h1 className="hero-h1">{ev.title}</h1>
          <p className="hero-sub">{ev.desc}</p>

          <div className="ed-meta">
            <div className="event-keyfact"><span className="lbl">When</span><span className="val">{ev.dateLong}</span></div>
            <div className="event-keyfact"><span className="lbl">Time</span><span className="val">{ev.time}</span></div>
            <div className="event-keyfact"><span className="lbl">Where</span><span className="val">{ev.location}</span></div>
            <div className="event-keyfact"><span className="lbl">Cost</span><span className="val">{ev.cost}</span></div>
          </div>

          <div className="ed-cta">
            {/* Client wrapper attaches the event_rsvp_intent analytics event */}
            <RsvpMailtoLink slug={ev.slug} title={ev.title} />
            <Link className="btn btn-secondary" href="/sign-up?redirect_url=%2Fmy-events">Members register inside</Link>
          </div>
        </div>
      </section>

      {related.length > 0 && (
        <section className="events-list" style={{ paddingTop: 'clamp(72px, 9vw, 120px)' }}>
          <div className="wrap">
            <span className="section-label">Also coming up</span>
            <h2 className="section-h2">Other events you might like.</h2>
            <div className="evlist" style={{ marginTop: 32 }}>
              {related.map((r) => (
                <Link className="ev-row" key={r.slug} href={`/events/${r.slug}`}>
                  <div className="ev-date">
                    <span className="month">{r.monthShort}</span>
                    <span className="day">{r.day === '?' ? <em>?</em> : r.day}</span>
                    <span className="year">{r.year}</span>
                  </div>
                  <div className="ev-main">
                    <span className={'ev-tag ' + r.tagClass}>{r.tag}</span>
                    <h3>{r.title}</h3>
                    <p className="ev-desc">{r.desc}</p>
                  </div>
                  <span className="ev-cta">View event →</span>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      <Contact
        supportEmail={siteSettings?.supportEmail ?? null}
        phone={siteSettings?.phone ?? null}
        address={siteSettings?.address ?? null}
      />
    </main>
  );
}
