// The next Session as a paper admission ticket — the home page hero. The stub
// is the button: "Book a seat" once the CMS event has a booking link, "See
// details" while it has only a page, "See dates" before that. A Growth Lab
// ticket sits tucked behind it when one is on the calendar, so the ladder
// (free Session → paid Lab) is visible at a glance.

import Link from 'next/link';
import { dateParts, rowCta, SESSION_VENUE, type CalendarRow } from '@/lib/sessions';

export default function SessionTicket({
  session,
  lab,
}: {
  session: CalendarRow | null;
  lab: CalendarRow | null;
}) {
  const when = session ? dateParts(session.date) : null;
  const { label, href } = rowCta(session);

  return (
    <div className="ticket-stack">
      {lab && (
        <div className="ticket-wrap ticket-wrap--back" aria-hidden="true">
          <div className="ticket ticket--lab">
            <div className="ticket-main">
              <span className="ticket-kicker">
                Growth Lab · {lab.price} · {dateParts(lab.date).day} {dateParts(lab.date).month}
              </span>
              <span className="ticket-title">{lab.title}</span>
            </div>
            <div className="ticket-stub" />
          </div>
        </div>
      )}

      <div className="ticket-wrap">
        <div className="ticket">
          <div className="ticket-main">
            <span className="ticket-kicker">Growth Hub Session · Admit one · Free</span>
            <span className="ticket-title">{session ? session.title : 'New dates are on the way'}</span>
            <span className="ticket-meta">
              {session && when ? (
                <>
                  {when.long} · {session.time}
                  <br />
                  {SESSION_VENUE.short}
                </>
              ) : (
                'Get the monthly email to hear about the next season first.'
              )}
            </span>
            <span className="ticket-note handscript">bring one question</span>
          </div>
          <Link
            className="ticket-stub"
            href={href}
            aria-label={session && when ? `${label}: ${session.title}, ${when.long}` : label}
          >
            {when ? (
              <>
                <span className="ticket-stub-small">{when.weekday}</span>
                <span className="ticket-stub-day">{when.day}</span>
                <span className="ticket-stub-small">{when.month}</span>
              </>
            ) : (
              <span className="ticket-stub-day">·</span>
            )}
            <span className="ticket-stub-cta">{label}&nbsp;→</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
