import { dateParts, type SessionKind } from '@/lib/sessions';

/** Month/day block for calendar rows and next-Session cards. Teal for free
 *  Sessions, plum for Growth Labs, muted for dates that aren't bookable yet.
 *  Screen readers get the full date from visually hidden text (an aria-label
 *  on a role-less span isn't reliably announced); the short visible parts
 *  are aria-hidden so the date isn't read twice. */
export default function SessionDate({
  date,
  kind,
  muted = false,
}: {
  date: string;
  kind: SessionKind;
  muted?: boolean;
}) {
  const p = dateParts(date);
  const tone = muted ? ' site-date--later' : kind === 'lab' ? ' site-date--lab' : '';
  return (
    <span className={`site-date${tone}`}>
      <span className="sr-only">{p.long}</span>
      <span className="m" aria-hidden="true">{p.weekday} {p.month}</span>
      <span className="d" aria-hidden="true">{p.day}</span>
    </span>
  );
}
