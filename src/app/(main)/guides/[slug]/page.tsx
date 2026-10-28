import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ogBase, twitterBase } from '../../shared-metadata';
import NewsletterStrip from '@/components/NewsletterStrip';
import PrintButton from '@/components/sections/site/PrintButton';
import SessionDate from '@/components/sections/site/SessionDate';
import ThreeDoors from '@/components/sections/site/ThreeDoors';
import { BreadcrumbListJsonLd } from '@/components/seo/BreadcrumbListJsonLd';
import { getUpcomingEvents } from '@/lib/cms';
import { canberraDateKey } from '@/lib/events-time';
import { GUIDES, getGuide, guideUpdated } from '@/lib/guides';
import { buildCalendar, dateParts, rowCta } from '@/lib/sessions';
import type { Event as PayloadEvent } from '@/payload-types';

export const revalidate = 3600;
export const dynamicParams = false;

export function generateStaticParams() {
  return GUIDES.map((g) => ({ slug: g.slug }));
}

type Params = Promise<{ slug: string }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { slug } = await params;
  const guide = getGuide(slug);
  if (!guide) return { title: 'Guide — Growth Hub by Himayat' };
  const title = `${guide.title}: a free guide — Growth Hub by Himayat`;
  const path = `/guides/${guide.slug}`;
  return {
    title,
    description: guide.summary,
    alternates: { canonical: path },
    openGraph: { ...ogBase, title, description: guide.summary, url: path },
    twitter: { ...twitterBase, title, description: guide.summary },
  };
}

export default async function GuidePage({ params }: { params: Params }) {
  const { slug } = await params;
  const guide = getGuide(slug);
  if (!guide) notFound();

  // The next date on this guide's topic: the next Build Lab for the prep
  // guide, else the next Session in the same area. Topics come round once a
  // season, so fall back to the next Session of any kind.
  const docs = await getUpcomingEvents().catch(() => []);
  const rows = buildCalendar(docs as PayloadEvent[]);
  const isLab = guide.area === 'Build Lab';
  const onTopic = rows.find((r) => (isLab ? r.kind === 'lab' : r.kind === 'session' && r.area === guide.area)) ?? null;
  const next = onTopic ?? rows.find((r) => r.kind === 'session') ?? null;
  const cta = rowCta(next);
  // A topic can be months away, so also point to any free Session before it.
  const sooner = !isLab && onTopic ? rows.find((r) => r.kind === 'session' && r.date < onTopic.date) ?? null : null;
  const thisYear = dateParts(canberraDateKey(new Date())).year;
  const others = GUIDES.filter((g) => g.slug !== guide.slug && g.area !== 'Build Lab').slice(0, 3);
  // Steps are numbered straight through the guide, across its sections.
  const firstStep = guide.sections.map((_, i) =>
    guide.sections.slice(0, i).reduce((total, s) => total + s.steps.length, 1),
  );

  return (
    <main className="guide">
      <BreadcrumbListJsonLd
        crumbs={[
          { name: 'Guides', path: '/guides' },
          { name: guide.title, path: `/guides/${guide.slug}` },
        ]}
      />

      <section className="site-sec" style={{ paddingTop: 32 }}>
        <div className="wrap">
          <p className="session-crumb">
            <Link href="/guides">Guides</Link> / {guide.title}
          </p>

          <div className="session-layout" style={{ marginTop: 24 }}>
            <div className="session-main">
              <div>
                <span className="cal-tags">
                  <span className={`site-tag${isLab ? ' site-tag--lab' : ' site-tag--free'}`}>{guide.area}</span>
                  <span>Free guide · {guide.time}</span>
                </span>
                <h1>{guide.title}</h1>
                <p className="site-lede" style={{ margin: 0, maxWidth: '60ch' }}>{guide.intro}</p>
              </div>

              {guide.sections.map((section, si) => (
                <div key={section.h}>
                  <h2>{section.h}</h2>
                  <ol className="guide-steps">
                    {section.steps.map((step, i) => (
                      <li className="guide-step" key={step.h}>
                        <span className="guide-box" aria-hidden="true">{firstStep[si] + i}</span>
                        <div>
                          <h3>{step.h}</h3>
                          <p>{step.p}</p>
                        </div>
                      </li>
                    ))}
                  </ol>
                </div>
              ))}

              <div className="site-panel site-panel--lime guide-next" style={{ gridTemplateColumns: '1fr' }}>
                <div>
                  <span className="section-label">Your three next steps</span>
                  <ol>
                    {guide.nextSteps.map((s) => (
                      <li key={s}>{s}</li>
                    ))}
                  </ol>
                </div>
              </div>

              <div>
                <h2>Where to check the detail</h2>
                <p className="site-fine" style={{ marginBottom: 12 }}>
                  Rules, prices and phone numbers change. These official pages have the current version.
                </p>
                <ul className="guide-sources">
                  {guide.sources.map((s) => (
                    <li key={s.href}>
                      <a className="site-link" href={s.href} target="_blank" rel="noopener noreferrer">{s.label}</a>
                    </li>
                  ))}
                </ul>
              </div>

              {!isLab && (
                <div className="guide-doors">
                  <h2>Want a hand with it?</h2>
                  <ThreeDoors />
                </div>
              )}

              <p className="site-fine">
                General information, not advice for your business. Last checked {guideUpdated(guide.updated)}.
              </p>
            </div>

            <aside className="session-aside">
              {next && (
                <div className="session-book">
                  <span className="site-kicker">
                    {onTopic ? (isLab ? 'Next Build Lab' : 'Next Session on this topic') : 'Next free Session'}
                  </span>
                  <div style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
                    <SessionDate date={next.date} kind={next.kind} muted={!next.href} />
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 4, minWidth: 0 }}>
                      <span className="cal-title" style={{ fontSize: 19 }}>{next.title}</span>
                      <span className="cal-meta">
                        {dateParts(next.date).weekday}
                        {dateParts(next.date).year !== thisYear ? ` ${dateParts(next.date).year}` : ''} · {next.time} · {next.price}
                      </span>
                    </div>
                  </div>
                  <Link className="btn btn-primary" href={cta.href}>{cta.label}</Link>
                  {sooner && (
                    <p className="site-fine">
                      Sooner: the next free Session is{' '}
                      <Link href={rowCta(sooner).href} style={{ textDecoration: 'underline', textUnderlineOffset: 3 }}>
                        {dateParts(sooner.date).long}, {sooner.title}
                      </Link>
                      .
                    </p>
                  )}
                </div>
              )}
              <div className="session-note">
                <b>Take it with you</b>
                Print this guide as a checklist, or bring it to a Session and work through it at the table.
                <div style={{ marginTop: 12 }}>
                  <PrintButton />
                </div>
              </div>
            </aside>
          </div>
        </div>
      </section>

      {others.length > 0 && (
        <section className="site-sec site-sec--white">
          <div className="wrap">
            <div className="site-head site-head--row">
              <h2 className="section-h2">More free guides</h2>
              <Link className="site-link" href="/guides">All guides</Link>
            </div>
            <div className="site-grid">
              {others.map((g) => (
                <div className="site-card" key={g.slug}>
                  <span className="site-kicker">{g.area}</span>
                  <h3>{g.title}</h3>
                  <p>{g.summary}</p>
                  <Link className="site-link" href={`/guides/${g.slug}`}>Read the guide</Link>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      <NewsletterStrip
        source={`guide-${guide.slug}`}
        heading="Get the next guide and Session in your inbox."
        sub="One email a month with what's on next."
      />
    </main>
  );
}
