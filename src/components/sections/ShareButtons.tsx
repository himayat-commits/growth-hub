'use client';

// Share-this-page row for event and case-study pages. Each link carries a
// `?ref={anonId}` so when the recipient eventually signs up we can attribute
// the share — picked up by the existing tryIssueReferralCredit() pipeline.
//
// The anonId is a stable per-browser identifier stored in a long-lived
// cookie. Generated lazily on first share click so we don't write cookies
// on a passive read; matches PostHog's distinct_id pattern at a high level
// without needing to import the SDK here.
//
// Networks supported: LinkedIn, X (Twitter), WhatsApp, Email. No Facebook —
// Meta's share endpoint drops query strings unless an ad-account is wired
// in, defeating the attribution. Add later if needed.

import { useCallback } from 'react';
import { track } from '@/lib/analytics';

const REF_COOKIE = 'gh_ref';
const REF_MAX_AGE = 60 * 60 * 24 * 365; // 1 year

/** Read or lazily create a stable per-browser ref id. Client-only. */
function getRefId(): string {
  if (typeof document === 'undefined') return '';
  const existing = document.cookie
    .split(';')
    .map((c) => c.trim())
    .find((c) => c.startsWith(`${REF_COOKIE}=`));
  if (existing) return existing.split('=')[1] ?? '';
  // Compact 12-char id from crypto.getRandomValues — readable in URLs.
  const buf = new Uint8Array(9);
  crypto.getRandomValues(buf);
  const id = btoa(String.fromCharCode(...buf)).replace(/[+/=]/g, '').slice(0, 12);
  document.cookie = `${REF_COOKIE}=${id}; Path=/; Max-Age=${REF_MAX_AGE}; SameSite=Lax`;
  return id;
}

type Network = 'linkedin' | 'x' | 'whatsapp' | 'email';

interface ShareSpec {
  network: Network;
  label: string;
  build: (params: { url: string; title: string }) => string;
}

const NETWORKS: ShareSpec[] = [
  {
    network: 'linkedin',
    label: 'LinkedIn',
    build: ({ url }) =>
      `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`,
  },
  {
    network: 'x',
    label: 'X',
    build: ({ url, title }) =>
      `https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(title)}`,
  },
  {
    network: 'whatsapp',
    label: 'WhatsApp',
    build: ({ url, title }) =>
      `https://wa.me/?text=${encodeURIComponent(`${title} ${url}`)}`,
  },
  {
    network: 'email',
    label: 'Email',
    build: ({ url, title }) =>
      `mailto:?subject=${encodeURIComponent(title)}&body=${encodeURIComponent(`Thought you'd want to see this — ${url}`)}`,
  },
];

export default function ShareButtons({
  title,
  path,
  surface,
}: {
  title: string;
  /** Path of the page being shared, e.g. /events/foo. Absolute URL is
   *  composed at click time so we read the production origin from the
   *  browser, not a stale build-time env var. */
  path: string;
  /** Which page surface is being shared — `event` | `case-study` etc.
   *  Forwarded as a PostHog property for funnel reporting. */
  surface: string;
}) {
  const onShare = useCallback(
    (network: Network) => {
      const ref = getRefId();
      const origin =
        typeof window !== 'undefined' ? window.location.origin : 'https://thegrowthhub.com.au';
      const url = `${origin}${path}?ref=${ref}&utm_source=share-${network}&utm_medium=referral`;
      track('referral_share_click', { network, surface, path, ref });
      return NETWORKS.find((n) => n.network === network)!.build({ url, title });
    },
    [path, surface, title],
  );

  return (
    <div
      className="share-row"
      style={{
        display: 'flex',
        gap: 10,
        alignItems: 'center',
        flexWrap: 'wrap',
      }}
    >
      <span
        style={{
          fontSize: 12,
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
          color: 'rgba(243,240,231,0.55)',
          marginRight: 4,
        }}
      >
        Share
      </span>
      {NETWORKS.map((n) => (
        <a
          key={n.network}
          // href is computed onMouseDown/onClick to keep the ref/UTM fresh
          // without pushing a server-render dependency. Falls back to a
          // placeholder href so the link is keyboard-focusable before JS hydrates.
          href={`#share-${n.network}`}
          onClick={(e) => {
            e.preventDefault();
            const href = onShare(n.network);
            // Email handler stays in the same tab; social opens new tab.
            if (n.network === 'email') {
              window.location.href = href;
            } else {
              window.open(href, '_blank', 'noopener,noreferrer');
            }
          }}
          style={{
            padding: '6px 14px',
            borderRadius: 999,
            border: '1px solid rgba(243,240,231,0.18)',
            background: 'rgba(243,240,231,0.04)',
            color: 'inherit',
            fontSize: 13,
            textDecoration: 'none',
            cursor: 'pointer',
          }}
        >
          {n.label}
        </a>
      ))}
    </div>
  );
}
