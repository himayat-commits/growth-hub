'use client';

// Ops reply box. POSTs to /api/ops/inbox/[userId], then refreshes
// the page so the new message appears in the thread.

import { useState, useRef, useTransition } from 'react';
import { useRouter } from 'next/navigation';

export default function OpsReplyComposer({ userId }: { userId: string }) {
  const router = useRouter();
  const [text, setText] = useState('');
  const [pending, startTransition] = useTransition();
  const [err, setErr] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const send = async () => {
    const body = text.trim();
    if (!body || pending) return;
    setErr(null);
    try {
      const res = await fetch(`/api/ops/inbox/${encodeURIComponent(userId)}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ body }),
      });
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(data.error ?? 'Send failed');
      }
      setText('');
      startTransition(() => router.refresh());
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Send failed');
    }
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Cmd/Ctrl+Enter sends without newline.
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
      e.preventDefault();
      send();
    }
  };

  return (
    <div className="gh-msg-composer gh-ops-composer">
      <textarea
        ref={textareaRef}
        className="gh-msg-input"
        placeholder="Reply to this member… (⌘+Enter to send)"
        value={text}
        disabled={pending}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={onKeyDown}
        rows={3}
      />
      <div className="gh-msg-composer-foot">
        {err && <span className="gh-ops-err">{err}</span>}
        <button
          type="button"
          className="gh-btn"
          style={{ marginLeft: 'auto' }}
          disabled={!text.trim() || pending}
          onClick={send}
        >
          {pending ? 'Sending…' : 'Send reply'}
        </button>
      </div>
    </div>
  );
}
