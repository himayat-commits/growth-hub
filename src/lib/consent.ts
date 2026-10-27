// Client-side cookie-consent helpers.
//
// The `gh_consent` cookie gates every analytics/marketing script on the site:
// the ad pixels (GA4 / Meta / LinkedIn via ConsentGate) AND PostHog product
// analytics (PostHogProvider). Opt-in by default: nothing fires until the
// visitor explicitly accepts, which is what the ConsentBanner promises.

export const CONSENT_COOKIE = 'gh_consent';
export const CONSENT_EVENT = 'gh-consent-change';

export type ConsentValue = 'granted' | 'denied';

/** Current consent choice, or null if the visitor hasn't chosen yet. */
export function readConsent(): ConsentValue | null {
  if (typeof document === 'undefined') return null;
  const m = document.cookie.match(/(?:^|;\s*)gh_consent=(granted|denied)/);
  return m ? (m[1] as ConsentValue) : null;
}

/** Persist the choice for a year and notify listeners (the pixel gate) in the
 *  same tab so tracking can start/stop without a reload. */
export function writeConsent(value: ConsentValue): void {
  if (typeof document === 'undefined') return;
  const oneYear = 60 * 60 * 24 * 365;
  document.cookie = `${CONSENT_COOKIE}=${value}; path=/; max-age=${oneYear}; samesite=lax`;
  window.dispatchEvent(new Event(CONSENT_EVENT));
}
