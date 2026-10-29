import Link from 'next/link';
import { FREE_SEATS } from '@/lib/site';

/** The free Build Lab seat line, repeated on home, /events, /sites and Build
 *  Lab pages so it is never more than a scroll away. Pass children to fold it
 *  into small print that already sits next to a price. */
export const FREE_SEAT_LINE =
  'Doing it tough, or referred by a partner? Free Build Lab seats are available. Just send a message, no proof needed.';

export default function FreeSeatNote({
  children = FREE_SEAT_LINE,
  className = 'site-fine',
  style,
}: {
  children?: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}) {
  return (
    <p className={`${className} free-seat-note`} style={style}>
      {children}{' '}
      <Link href={FREE_SEATS.path}>How to ask&nbsp;→</Link>
    </p>
  );
}
