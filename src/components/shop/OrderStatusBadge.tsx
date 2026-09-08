// Shared status badge for orders. `variant="ops"` uses the ops console
// classes; default uses the member-app pill.

import { orderStatusLabel } from '@/lib/db/orders';

export function OrderStatusBadge({ status, variant = 'member' }: { status: string; variant?: 'member' | 'ops' }) {
  if (variant === 'ops') {
    return <span className={`gh-ops-status status-${status}`}>{orderStatusLabel(status)}</span>;
  }
  const tone = status === 'shipped' ? 'lime' : status === 'paid' ? 'lav' : 'plum';
  return <span className={`gh-pill ${tone}`}>{orderStatusLabel(status)}</span>;
}
