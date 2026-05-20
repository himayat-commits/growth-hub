import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { withAuth } from '@workos-inc/authkit-nextjs';
import { PageHeader } from '@/components/dashboard/PageHeader';
import { IcoCal, IcoPlay } from '@/components/dashboard/Icons';
import { getUpcomingEvents, getPastRecordings } from '@/lib/cms';
import { getUserRsvpSet } from '@/lib/db/rsvps';
import RsvpButton from './RsvpButton';

export const metadata: Metadata = {
  title: 'Events & Webinars — Growth Hub',
};

// Formats a Payload date string (ISO) into mockup-style "Thu, 21 May".
function formatDateLong(iso: string | null | undefined): string {
  if (!iso) return '—';
  return new Intl.DateTimeFormat('en-AU', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  }).format(new Date(iso));
}

function formatDay(iso: string | null | undefined): { d: string; m: string } {
  if (!iso) return { d: '—', m: '—' };
  const dt = new Date(iso);
  return {
    d: String(dt.getDate()),
    m: dt.toLocaleString('en-AU', { month: 'short' }).toUpperCase(),
  };
}

const TYPE_LABEL: Record<string, string> = {
  webinar: 'Webinar · Online',
  workshop: 'Workshop · In person',
  community: 'Community',
};

export default async function EventsPage() {
  const { user } = await withAuth();
  if (!user) redirect('/sign-in?redirect_url=/events');

  const [upcoming, recordings, rsvpSet] = await Promise.all([
    getUpcomingEvents(),
    getPastRecordings(),
    getUserRsvpSet(user.id),
  ]);

  // Featured upcoming event slot: first event with featured=true, falling
  // back to the next event chronologically.
  const featured = upcoming.find((e) => e.featured) ?? upcoming[0] ?? null;
  const rest = upcoming.filter((e) => e.id !== featured?.id);

  const totalUpcomingCount = upcoming.length;
  const myRsvpCount = upcoming.filter((e) => rsvpSet.has(Number(e.id))).length;

  return (
    <>
      <PageHeader
        kicker="What's on"
        title="Events & Webinars"
        sub={
          totalUpcomingCount === 0
            ? "Nothing on the calendar yet — we'll let you know when the next session is locked in."
            : 'Free for all members. Online sessions get recorded — in-person ones come with chai.'
        }
        actions={
          myRsvpCount > 0 ? (
            <button className="gh-btn ghost" type="button">
              <IcoCal />
              {myRsvpCount} registered
            </button>
          ) : null
        }
      />

      {featured && (
        <div className="gh-event-hero">
          <div className="gh-event-date">
            <div className="day">{formatDay(featured.date as string).d}</div>
            <div className="mo">{formatDay(featured.date as string).m}</div>
          </div>
          <div className="gh-event-body">
            <div className="gh-event-tag">
              Next up · {TYPE_LABEL[featured.type as string] ?? 'Event'}
              {featured.location ? ` · ${featured.location}` : ''}
            </div>
            <h2 className="gh-event-h">{featured.title}</h2>
            {featured.description && (
              <p className="gh-event-p">{featured.description}</p>
            )}
            <div className="gh-event-meta">
              <span>{formatDateLong(featured.date as string)}</span>
              {featured.time && <><span>·</span><span>{featured.time}</span></>}
              {featured.seats && <><span>·</span><span>{featured.seats}</span></>}
            </div>
          </div>
          <div className="gh-event-actions">
            <RsvpButton
              eventId={Number(featured.id)}
              initialRsvped={rsvpSet.has(Number(featured.id))}
              registerUrl={featured.registerUrl as string | undefined}
            />
          </div>
        </div>
      )}

      <div className="gh-section-h">Upcoming this month</div>

      {rest.length === 0 ? (
        <div className="gh-empty">
          <div className="gh-empty-ic"><IcoCal /></div>
          <div className="gh-empty-h">No further events scheduled yet</div>
          <p className="gh-empty-p">
            Watch this space — we run something most weeks. We&apos;ll email you when the next one
            is locked in.
          </p>
        </div>
      ) : (
        <div>
          {rest.map((e) => {
            const { d, m } = formatDay(e.date as string);
            return (
              <div key={e.id} className="gh-event-row">
                <div className="gh-event-date">
                  <div className="day">{d}</div>
                  <div className="mo">{m}</div>
                </div>
                <div>
                  <div style={{
                    fontSize: 10.5,
                    letterSpacing: '0.18em',
                    textTransform: 'uppercase',
                    color: 'var(--ink-50)',
                    fontWeight: 600,
                  }}>
                    {TYPE_LABEL[e.type as string] ?? 'Event'}
                    {e.location ? ` · ${e.location}` : ''}
                  </div>
                  <div style={{
                    fontFamily: 'var(--font-serif)',
                    fontSize: 20,
                    color: 'var(--teal)',
                    letterSpacing: '-0.015em',
                    margin: '4px 0',
                  }}>
                    {e.title}
                  </div>
                  <div style={{ fontSize: 13, color: 'var(--ink-70)' }}>
                    {formatDateLong(e.date as string)}
                    {e.time ? ` · ${e.time}` : ''}
                    {e.seats ? ` · ${e.seats}` : ''}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <RsvpButton
                    eventId={Number(e.id)}
                    initialRsvped={rsvpSet.has(Number(e.id))}
                    registerUrl={e.registerUrl as string | undefined}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}

      {recordings.length > 0 && (
        <>
          <div className="gh-section-h">Past recordings</div>
          <div className="gh-grid-3">
            {recordings.map((r) => {
              // recording is a media relation — when populated by depth: 1 it's an object.
              const rec = r.recording as { url?: string } | string | null | undefined;
              const url = typeof rec === 'object' && rec ? rec.url : null;
              return (
                <a
                  key={r.id}
                  href={url ?? '#'}
                  target={url ? '_blank' : undefined}
                  rel={url ? 'noopener noreferrer' : undefined}
                  className="gh-resource"
                  style={{ width: '100%', display: 'block', textDecoration: 'none', color: 'inherit' }}
                >
                  <div className="gh-resource-thumb teal" style={{ position: 'relative' }}>
                    <span className="gh-resource-tag" style={{ background: 'var(--plum)', color: 'var(--cream)' }}>
                      Recording
                    </span>
                    <div style={{
                      position: 'absolute', left: '50%', top: '50%',
                      transform: 'translate(-50%, -50%)',
                      width: 44, height: 44, borderRadius: '50%',
                      background: 'rgba(255,255,255,0.92)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      color: 'var(--teal)',
                    }}>
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M7 4l13 8-13 8z" />
                      </svg>
                    </div>
                  </div>
                  <h4 className="gh-resource-h">{r.title}</h4>
                  <div className="gh-resource-meta">
                    <IcoPlay />
                    <span>Watch{r.time ? ` · ${r.time}` : ''}</span>
                  </div>
                </a>
              );
            })}
          </div>
        </>
      )}
    </>
  );
}
