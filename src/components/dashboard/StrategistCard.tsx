// "Your strategist" card — photo, name, role, specialties, bio and the
// Calendly link. Server component; used on /services and /services/[slug]
// so booking intent and the human behind it sit on the same screen (F4.9).

import LexicalRichText from '@/components/LexicalRichText';
import type { Media, Strategist } from '@/payload-types';
import { NEED_LABELS, type Need } from '@/lib/advisory/needs';

export function strategistPhotoUrl(strategist: Strategist | null | undefined): string | null {
  return strategist?.photo && typeof strategist.photo === 'object'
    ? ((strategist.photo as Media).url ?? null)
    : null;
}

export function strategistInitials(name: string | null | undefined): string {
  return (name ?? '')
    .split(/\s+/)
    .filter(Boolean)
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
}

export default function StrategistCard({
  strategist,
  compact = false,
  heading = 'Your strategist',
}: {
  strategist: Strategist | null;
  /** Hide the bio and shrink the avatar — for the sidebar next to a form. */
  compact?: boolean;
  heading?: string | null;
}) {
  if (!strategist) {
    return (
      <div className="gh-card">
        {heading && <div className="gh-card-h">{heading}</div>}
        <p style={{ color: 'var(--ink-70)', margin: '8px 0 0', lineHeight: 1.6 }}>
          You&apos;ll be matched with a Growth Strategist as soon as one is available. In the
          meantime the Growth Hub team reads every request.
        </p>
      </div>
    );
  }

  const photo = strategistPhotoUrl(strategist);
  const specialties = (strategist.specialties ?? []) as Need[];

  return (
    <div className="gh-card">
      {heading && <div className="gh-card-h">{heading}</div>}
      <div className="gh-strategist-card" style={{ paddingBottom: compact ? 0 : undefined }}>
        <div
          className="gh-strategist-avatar"
          style={compact ? { width: 48, height: 48, fontSize: 16 } : undefined}
        >
          {photo ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={photo} alt={strategist.name} />
          ) : (
            <span>{strategistInitials(strategist.name)}</span>
          )}
        </div>
        <div className="gh-strategist-info">
          <div className="gh-strategist-name">{strategist.name}</div>
          <div className="gh-strategist-role">{strategist.role}</div>
          {specialties.length > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 4 }}>
              {specialties.map((s) => (
                <span key={s} className="gh-pill lime" style={{ fontSize: 11 }}>
                  {NEED_LABELS[s] ?? s}
                </span>
              ))}
            </div>
          )}
          <div className="gh-strategist-links">
            <a href={`mailto:${strategist.email}`} className="gh-strategist-link">
              {strategist.email}
            </a>
            {strategist.calendlyUrl && (
              <a
                href={strategist.calendlyUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="gh-btn ghost"
                style={{ fontSize: 13, padding: '6px 14px' }}
              >
                Book a time directly →
              </a>
            )}
          </div>
        </div>
      </div>
      {!compact && strategist.bio && (
        <LexicalRichText
          content={strategist.bio}
          className="gh-strategist-bio"
        />
      )}
    </div>
  );
}
