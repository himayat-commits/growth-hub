// Site-wide top bar announcing the next free Growth Hub Session. Server
// component: it reads the season plan plus the CMS bookings, so it moves on to
// the next date by itself and links straight to the booking once the CMS
// event exists. Renders nothing when no Session is scheduled.

import Link from 'next/link';
import { getUpcomingEvents } from '@/lib/cms';
import { buildCalendar, dateParts, nextSession } from '@/lib/sessions';
import type { Event as PayloadEvent } from '@/payload-types';

export default async function NextSessionBar() {
  const docs = await getUpcomingEvents().catch(() => []);
  const next = nextSession(buildCalendar(docs as PayloadEvent[]));
  if (!next) return null;
  const when = dateParts(next.date);

  return (
    <div role="region" aria-label="Next Session" className="top-bar">
      <div className="top-bar-inner">
        <span>
          <strong>
            Next free Session · {when.weekday} {when.day} {when.month}, {next.time}
          </strong>
          <span className="top-bar-topic"> · {next.title}</span>
        </span>
        <Link href={next.href ?? '/events#whats-on'} className="top-bar-link">
          {next.href ? 'Book a seat →' : 'See dates →'}
        </Link>
      </div>
    </div>
  );
}
