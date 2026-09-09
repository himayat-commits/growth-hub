// Client-side cookie-consent helpers.
//
// The `gh_consent` cookie gates every analytics/marketing script on the site:
// the ad pixels (GA4 / Meta / LinkedIn via ConsentGate) AND PostHog product
// analytics (PostHogProvider). Opt-in by default: nothing fires until the
// visitor explicitly accepts, which is what the ConsentBanner promises.
//
// The same cookie is read server-side at checkout and stamped on the Stripe
// session metadata so the webhook can decide whether Meta CAPI may see the
// purchase — see consentStateFromCookie() and src/app/api/checkout/route.ts.

export const CONSENT_COOKIE = 'gh_consent';
export const CONSENT_EVENT = 'gh-consent-change';

export type ConsentValue = 'granted' | 'denied';
/** ConsentValue plus 'unset' for visitors who haven't chosen (or whose cookie
 *  never reached us) — the shape we persist on Stripe metadata. */
export type ConsentState = ConsentValue | 'unset';

/** Server-safe: normalise a raw `gh_consent` cookie value (e.g. from
 *  `req.cookies.get(CONSENT_COOKIE)?.value`). Anything unrecognised → 'unset',
 *  which downstream treats the same as 'denied' (no server conversions). */
export function consentStateFromCookie(raw: string | null | undefined): ConsentState {
  return raw === 'granted' || raw === 'denied' ? raw : 'unset';
}

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
