import { dateParts, type SessionKind } from '@/lib/sessions';

/** Month/day block for calendar rows and next-Session cards. Teal for free
 *  Sessions, plum for Build Labs, muted for dates that aren't bookable yet. */
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
    <span className={`site-date${tone}`} aria-label={p.long}>
      <span className="m" aria-hidden="true">{p.weekday} {p.month}</span>
      <span className="d" aria-hidden="true">{p.day}</span>
    </span>
  );
}
