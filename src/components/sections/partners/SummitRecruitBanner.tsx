'use client';

// Summit recruitment banner for /partners. Activates the (otherwise orphaned)
// contributor funnel: "Apply to take part" → the HubSpot form at /expo/apply,
// "See the program" → the summit landing page. Both CTAs fire
// partner_summit_cta_click so partner-sourced summit interest is measurable.
// Hardcoded for the launch window; self-retires after the event date.

import Link from 'next/link';
import { track } from '@/lib/analytics';
import { SUMMIT } from '@/lib/summit';

const Arrow = () => (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" aria-hidden="true">
    <path d="M3 7h8M7 3l4 4-4 4" />
  </svg>
);

export default function SummitRecruitBanner() {
  return (
    <section aria-label="Summit partner recruitment" style={{ paddingTop: 'clamp(48px, 6vw, 80px)' }}>
      <div className="wrap">
        <div
          style={{
            background: 'var(--teal)',
            color: 'var(--eggshell)',
            borderRadius: 24,
            padding: 'clamp(28px, 4vw, 48px)',
            display: 'flex',
            flexWrap: 'wrap',
            gap: 24,
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ maxWidth: 620 }}>
            <span
              className="section-label"
              style={{ color: 'var(--lime)', display: 'inline-block', marginBottom: 12 }}
            >
              {SUMMIT.dateLong.replace('Thursday ', '')} · {SUMMIT.venue} · free
            </span>
            <h2 className="section-h2" style={{ color: 'var(--eggshell)', marginBottom: 12 }}>
              We&apos;re co-hosting {SUMMIT.name}.
            </h2>
            <p style={{ color: 'var(--eggshell)', opacity: 0.9, margin: 0 }}>
              A free, full-day small-business summit at CBR Innovation Network — and we
              build it with partners. Run a workshop, host a stall, speak, or sponsor a
              part of the day.
            </p>
          </div>
          <div className="hero-ctas" style={{ flexShrink: 0 }}>
            <Link
              className="btn btn-lime"
              href={SUMMIT.applyPath}
              onClick={() => track('partner_summit_cta_click', { cta: 'apply', surface: 'partners-banner' })}
            >
              Apply to take part <Arrow />
            </Link>
            <Link
              className="btn btn-secondary"
              href={SUMMIT.path}
              style={{ color: 'var(--eggshell)', borderColor: 'rgba(243,240,231,0.4)' }}
              onClick={() => track('partner_summit_cta_click', { cta: 'program', surface: 'partners-banner' })}
            >
              See the program
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
