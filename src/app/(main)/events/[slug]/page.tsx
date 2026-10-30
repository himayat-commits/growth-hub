import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { getEventBySlug, getGenericEventSlugs, getUpcomingEvents } from '@/lib/cms';
import { guideForArea } from '@/lib/guides';
import { toPublicEvent } from '@/lib/events-data';
import { isBeforeCanberraToday } from '@/lib/events-time';
import {
  buildCalendar,
  dateParts,
  eventFacts,
  LAB_REFUND,
  LAB_STEPS,
  PILOT_NOTE,
  registerUrlOf,
  RUN_SHEET,
  seasonItemFor,
  SESSION_FORMAT,
} from '@/lib/sessions';
import type { Event as PayloadEvent } from '@/payload-types';
import NewsletterStrip from '@/components/NewsletterStrip';
import RsvpMailtoLink from './RsvpMailtoLink';
import AddToCalendarLink from './AddToCalendarLink';
import CaptureAttribution from './CaptureAttribution';
import { EventJsonLd } from '@/components/seo/EventJsonLd';
import { BreadcrumbListJsonLd } from '@/components/seo/BreadcrumbListJsonLd';
import { PartnerLockup } from '@/components/sections/events/PartnerLockup';
import ShareButtons from '@/components/sections/ShareButtons';
import FreeSeatNote from '@/components/sections/site/FreeSeatNote';
import SessionDate from '@/components/sections/site/SessionDate';
import ThreeDoors from '@/components/sections/site/ThreeDoors';

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
  const path = `/events/${ev.slug}`;
  // Season dates repeat titles ("Build and publish your website"), so the date
  // goes in the title and description to keep each page distinct.
  const season = seasonItemFor(doc as PayloadEvent);
  const d = season ? dateParts(season.date) : null;
  const title = d
    ? `${ev.title}, ${d.weekday} ${d.day} ${d.month} — Growth Hub by Himayat`
    : `${ev.title} — Growth Hub by Himayat`;
  const description = d ? `${d.long}${ev.time ? `, ${ev.time}` : ''}. ${ev.desc}` : ev.desc;
  return {
    title,
    description,
    alternates: { canonical: path },
    openGraph: {
      title,
      description,
      url: path,
      type: 'website',
      siteName: 'Growth Hub by Himayat',
      locale: 'en_AU',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
    },
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

  // Season Sessions and Build Labs get their format (tag, run sheet, three
  // doors, and price and venue from code when the CMS leaves them blank);
  // anything else (a webinar, a one-off) renders as a plain event.
  const { season, price, location } = eventFacts(doc as PayloadEvent);
  const kind = season?.kind ?? 'other';
  const label = season ? SESSION_FORMAT[season.kind].label : ev.tag;
  const registerUrl = registerUrlOf(doc as PayloadEvent);
  const seats = (doc as { seats?: string | null }).seats ?? null;
  const guide = kind === 'lab' ? guideForArea('Build Lab') : guideForArea(season?.area);

  const upcoming = await getUpcomingEvents().catch(() => []);
  const related = buildCalendar(upcoming as PayloadEvent[])
    .filter((r) => r.href !== `/events/${ev.slug}`)
    .slice(0, 3);

  // Past events keep their page (SEO, recap) but must not invite bookings or
  // calendar adds for a day that has already happened (in Canberra).
  const hasEnded = doc.date ? isBeforeCanberraToday(String(doc.date)) : false;

  return (
    <main>
      <CaptureAttribution slug={ev.slug} />
      <EventJsonLd ev={doc as PayloadEvent} />
      <BreadcrumbListJsonLd
        crumbs={[
          { name: 'Sessions', path: '/events' },
          { name: ev.title, path: `/events/${ev.slug}` },
        ]}
      />

      <section className="site-sec" style={{ paddingTop: 32 }}>
        <div className="wrap">
          <p className="session-crumb">
            <Link href="/events">Sessions</Link> / {ev.title}
          </p>

          <div className="session-layout" style={{ marginTop: 24 }}>
            <div className="session-main">
              <div>
                <span className="cal-tags">
                  <span className={`site-tag${kind === 'lab' ? ' site-tag--lab' : kind === 'session' ? ' site-tag--free' : ''}`}>
                    {season ? `Growth Hub ${label}` : label} · {price}
                  </span>
                  {season?.area && <span>{season.area}{season.pilot ? ' · pilot' : ''}</span>}
                </span>
                <h1>{ev.title}</h1>
                {ev.desc && (
                  <p className="site-lede" style={{ margin: 0, maxWidth: '60ch' }}>{ev.desc}</p>
                )}
                {season?.pilot && (
                  <p className="site-fine" style={{ marginTop: 14, maxWidth: '60ch' }}>{PILOT_NOTE}</p>
                )}
              </div>

              {kind === 'session' && (
                <div>
                  <h2>How the ninety minutes run</h2>
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
              )}

              {kind === 'lab' && (
                <div className="site-sec--teal" style={{ borderRadius: 24, padding: 'clamp(24px, 3vw, 36px)' }}>
                  <h2 style={{ color: 'var(--eggshell)' }}>How the morning runs</h2>
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
              )}

              <div className="site-grid">
                <div className="site-card">
                  <h3>It&apos;s for you if</h3>
                  <p>
                    {ev.audience ||
                      'You run a small business or work for yourself in the ACT or region, whether you are starting out, trading or ready to grow.'}
                  </p>
                </div>
                <div className="site-card">
                  <h3>Bring</h3>
                  <p>
                    {kind === 'lab'
                      ? 'A laptop, your logo and a few photos if you have them, and the basics: what you sell, who to, and where.'
                      : 'Your phone (a laptop helps but isn’t needed), a question about your own business, and a business friend if you like.'}
                  </p>
                  {guide && (
                    <Link className="site-link" href={`/guides/${guide.slug}`}>
                      {kind === 'lab' ? 'How to get ready' : 'Read the free guide first'}
                    </Link>
                  )}
                </div>
              </div>

              <PartnerLockup
                host={(doc as { host?: unknown }).host as Parameters<typeof PartnerLockup>[0]['host']}
                partners={(doc as { partners?: unknown }).partners as Parameters<typeof PartnerLockup>[0]['partners']}
              />

              {kind === 'session' && (
                <div>
                  <h2>After the Session, three doors</h2>
                  <ThreeDoors />
                </div>
              )}

              <ShareButtons title={ev.title} path={`/events/${ev.slug}`} surface="event" />
            </div>

            <aside className="session-aside">
              <div className="session-book">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 12 }}>
                  <span className="price">{price}</span>
                  {seats && !hasEnded && <span className="cal-seats">{seats}</span>}
                </div>
                <dl>
                  <dt>When</dt>
                  <dd>
                    {ev.dateLong}
                    {ev.time && (
                      <>
                        <br />
                        <span style={{ fontWeight: 400 }}>{ev.time}</span>
                      </>
                    )}
                  </dd>
                  <dt>Where</dt>
                  <dd>{location || 'Online'}</dd>
                  {kind === 'lab' && (
                    <>
                      <dt>Refunds</dt>
                      <dd style={{ fontWeight: 400 }}>{LAB_REFUND}</dd>
                    </>
                  )}
                </dl>
                {hasEnded ? (
                  <>
                    <span className="btn btn-secondary" aria-disabled="true">This event has run</span>
                    <Link className="btn btn-primary" href="/events#whats-on">See dates</Link>
                  </>
                ) : (
                  <>
                    {registerUrl ? (
                      <RsvpMailtoLink slug={ev.slug} title={ev.title} registerUrl={registerUrl} label="Book a seat" />
                    ) : (
                      <span className="cal-soon">Registration opens soon</span>
                    )}
                    <AddToCalendarLink slug={ev.slug} title={ev.title} />
                    {kind === 'lab' && <FreeSeatNote>Free seats for hardship and partner referrals.</FreeSeatNote>}
                  </>
                )}
              </div>
              <div className="session-note">
                <b>Language and access</b>
                {season && 'Plain English, and helpers at every table. '}
                Need an interpreter, Auslan or access support, or want to bring someone
                with you? Tell us when you book, or any time before, and we&apos;ll arrange
                it. <Link href="/about#contact">Ask us&nbsp;→</Link>
              </div>
            </aside>
          </div>
        </div>
      </section>

      {related.length > 0 && (
        <section className="site-sec site-sec--white">
          <div className="wrap">
            <div className="site-head site-head--row">
              <h2 className="section-h2">Also coming up</h2>
              <Link className="site-link" href="/events#whats-on">Everything that&apos;s on</Link>
            </div>
            <div className="site-grid">
              {related.map((r) => (
                <div className="site-card" key={r.key} style={{ flexDirection: 'row', gap: 16, alignItems: 'center' }}>
                  <SessionDate date={r.date} kind={r.kind} muted={!r.href} />
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 4, minWidth: 0 }}>
                    <span className="site-kicker">{r.label} · {r.price}</span>
                    {r.href ? (
                      <Link className="cal-title" href={r.href} style={{ fontSize: 19 }}>{r.title}</Link>
                    ) : (
                      <span className="cal-title" style={{ fontSize: 19 }}>{r.title}</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      <NewsletterStrip
        source={`event-${ev.slug}`}
        heading={hasEnded ? 'Get new Session dates by email.' : `Can't make ${ev.title}?`}
        sub="One email a month with what's on next."
      />
    </main>
  );
}
