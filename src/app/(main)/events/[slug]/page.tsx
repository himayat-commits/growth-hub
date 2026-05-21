import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { getPublicEventBySlug, getGenericEventSlugs, PUBLIC_EVENTS } from '@/lib/events-data';
import Contact from '@/components/sections/Contact';
import { getSiteSettings } from '@/lib/cms';

export const revalidate = 3600;

export function generateStaticParams() {
  return getGenericEventSlugs().map((slug) => ({ slug }));
}

type Params = Promise<{ slug: string }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { slug } = await params;
  const ev = getPublicEventBySlug(slug);
  if (!ev) return { title: 'Event — Growth Hub by Himayat' };
  return {
    title: `${ev.title} — Growth Hub by Himayat`,
    description: ev.desc,
  };
}

export default async function GenericEventPage({ params }: { params: Params }) {
  const { slug } = await params;
  const ev = getPublicEventBySlug(slug);
  if (!ev) notFound();

  // Bespoke events have their own static route. If someone hits the dynamic
  // route for a bespoke slug, send them to the dedicated page.
  if (ev.bespoke) redirect(`/events/${ev.slug}`);

  const siteSettings = await getSiteSettings();
  const related = PUBLIC_EVENTS.filter((e) => e.slug !== ev.slug).slice(0, 3);

  return (
    <main>
      <section className="hero event-hero event-detail" id="top">
        <div className="wrap">
          <Link href="/events" className="ed-back">← All events</Link>
          <div className="hero-eyebrow">
            <span className="dot" />
            {ev.tag} · {ev.audience}
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
            <a
              className="btn btn-primary"
              href={`mailto:hello@himayat.com.au?subject=${encodeURIComponent(`RSVP — ${ev.title}`)}`}
            >
              RSVP by email
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" aria-hidden="true">
                <path d="M3 7h8M7 3l4 4-4 4" />
              </svg>
            </a>
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
