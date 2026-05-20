'use client';

// One-click "Copy invite link" button. Uses navigator.clipboard with a
// 2-second "Copied ✓" confirmation. Falls back silently if clipboard
// access is denied (some embedded browsers block it).

import { useState } from 'react';

export default function ReferralCopyButton({
  link,
  className = 'gh-btn',
}: {
  link: string;
  className?: string;
}) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard unavailable */
    }
  };
  return (
    <button type="button" className={className} onClick={copy}>
      {copied ? 'Copied ✓' : 'Copy invite link'}
    </button>
  );
}
