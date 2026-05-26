// "Members get early access" banner shown on the event detail page when
// `memberPreviewUntil` is in the future. Drives paid-tier urgency on
// high-demand events: members can RSVP now (via the existing signed-in
// flow); the public mailto link is hidden until the preview window
// passes, replaced with this banner.
//
// Server component — date math runs at build/revalidate time. The banner
// disappears after revalidation past the preview cut-off (1-hour TTL on
// the event detail page).

import Link from 'next/link';

export function MemberPreviewBanner({ until }: { until: string | Date }) {
  const cutoff = new Date(until);
  if (Number.isNaN(cutoff.getTime())) return null;
  // No Date.now() comparison here — server components must be pure
  // (react-hooks/purity). The caller uses isInMemberPreviewWindow()
  // before rendering, which is fine because that helper isn't a
  // component body. The 1-hour revalidate on the event detail page
  // ensures stale banners drop within an hour of the cutoff.

  const dateLabel = new Intl.DateTimeFormat('en-AU', {
    weekday: 'short',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(cutoff);

  return (
    <div
      style={{
        marginTop: 28,
        padding: '18px 22px',
        borderRadius: 12,
        background: 'rgba(227,242,156,0.10)',
        border: '1px solid rgba(227,242,156,0.35)',
        display: 'flex',
        alignItems: 'center',
        gap: 14,
        flexWrap: 'wrap',
      }}
    >
      <span
        style={{
          fontSize: 11,
          color: '#E3F29C',
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
          padding: '4px 8px',
          borderRadius: 4,
          background: 'rgba(227,242,156,0.18)',
        }}
      >
        Members only · early access
      </span>
      <span style={{ flex: 1, minWidth: 280, color: 'rgba(243,240,231,0.85)' }}>
        Members can RSVP now. Public RSVP opens <strong>{dateLabel}</strong>.
      </span>
      <Link
        href="/pricing"
        className="btn btn-secondary"
        style={{ marginTop: 0 }}
      >
        Become a member
      </Link>
    </div>
  );
}

/** Helper: is the preview window currently active? Use this in the
 *  parent page to decide whether to render the mailto CTA. */
export function isInMemberPreviewWindow(until: string | Date | null | undefined): boolean {
  if (!until) return false;
  const cutoff = new Date(until);
  if (Number.isNaN(cutoff.getTime())) return false;
  return cutoff.getTime() > Date.now();
}
