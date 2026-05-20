'use client';

// Client-side reply composer. Optimistic — the new message lands in the
// thread immediately while the POST goes out. On failure we roll back.

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { IcoSend } from '@/components/dashboard/Icons';

export default function MessageComposer() {
  const router = useRouter();
  const [text, setText] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const send = async () => {
    const body = text.trim();
    if (!body) return;
    setError(null);
    setText('');
    startTransition(async () => {
      try {
        const res = await fetch('/api/messages', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ body }),
        });
        if (!res.ok) throw new Error((await res.json())?.error ?? 'Send failed');
        // Server re-renders the thread on refresh — cheap because the
        // page is dynamic anyway.
        router.refresh();
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Send failed');
        setText(body); // restore so they can retry
      }
    });
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      void send();
    }
  };

  return (
    <div className="gh-msg-composer">
      <input
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={onKeyDown}
        placeholder="Write a reply…"
        maxLength={4000}
        disabled={pending}
      />
      <button
        className="gh-btn"
        type="button"
        onClick={send}
        disabled={pending || !text.trim()}
      >
        <IcoSend />
        {pending ? 'Sending…' : 'Send'}
      </button>
      {error && (
        <div style={{ position: 'absolute', bottom: -22, left: 14, fontSize: 12, color: 'var(--plum)' }}>
          {error}
        </div>
      )}
    </div>
  );
}
