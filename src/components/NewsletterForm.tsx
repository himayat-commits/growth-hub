'use client';

// Inline newsletter signup. Mount on any marketing page; pass `source`
// (e.g. "home-footer", "events-propose") so we can attribute signups
// in the Resend audience later.
//
// On submit:
//   - posts to /api/newsletter
//   - shows an inline success/error message in place of the form fields
//   - honeypot field catches dumb bots without a CAPTCHA

import { useState } from 'react';
import { track } from '@/lib/analytics';

export interface NewsletterFormProps {
  source: string;
  /** Heading shown above the form. Optional — caller may render their own. */
  heading?: string;
  /** Sub-copy shown above the form. Optional. */
  sub?: string;
  /** CTA button label. Defaults to "Get the digest". */
  cta?: string;
  /** Tighten the layout for narrow CTA strips. Defaults to "default". */
  variant?: 'default' | 'compact';
}

export default function NewsletterForm({
  source,
  heading,
  sub,
  cta = 'Get the digest',
  variant = 'default',
}: NewsletterFormProps) {
  const [email, setEmail] = useState('');
  const [hp, setHp] = useState(''); // honeypot
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');
  const [message, setMessage] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (status === 'sending') return;
    setStatus('sending');
    setMessage(null);
    try {
      const res = await fetch('/api/newsletter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, source, hp }),
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) throw new Error(data.error ?? 'Could not subscribe.');
      track('newsletter_signup', { source });
      setStatus('sent');
      setMessage("You're in. We'll write when we have something worth reading.");
    } catch (err) {
      setStatus('error');
      setMessage(err instanceof Error ? err.message : 'Could not subscribe.');
    }
  };

  return (
    <form className={`gh-newsletter gh-newsletter-${variant}`} onSubmit={submit} noValidate>
      {heading && <h3 className="gh-newsletter-h">{heading}</h3>}
      {sub && <p className="gh-newsletter-sub">{sub}</p>}

      <div className="gh-newsletter-row">
        <label htmlFor={`nl-${source}`} className="gh-newsletter-label">
          <span className="sr-only">Email address</span>
          <input
            id={`nl-${source}`}
            type="email"
            required
            autoComplete="email"
            placeholder="your@email.com.au"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={status === 'sent'}
          />
        </label>
        {/* Honeypot — hidden from humans via CSS + aria. Bots will fill it. */}
        <label className="gh-newsletter-hp" aria-hidden="true">
          Leave this field blank:
          <input
            type="text"
            tabIndex={-1}
            autoComplete="off"
            value={hp}
            onChange={(e) => setHp(e.target.value)}
          />
        </label>
        <button
          type="submit"
          className="btn btn-primary"
          disabled={status === 'sending' || status === 'sent'}
        >
          {status === 'sending' ? 'Sending…' : status === 'sent' ? 'Subscribed ✓' : cta}
        </button>
      </div>

      {message && (
        <p
          className={`gh-newsletter-msg ${status === 'sent' ? 'is-ok' : 'is-err'}`}
          role={status === 'error' ? 'alert' : 'status'}
        >
          {message}
        </p>
      )}
      <p className="gh-newsletter-fine">No drip sequence. Unsubscribe in one click.</p>
    </form>
  );
}
