// Server-side conversion APIs for paid attribution.
//
// Why server-side: iOS / ITP / privacy browsers drop the cookies that
// fbq()/gtag() rely on for attribution. Server-side events are sent
// directly to the ad platform's API with hashed user data, sidestepping
// the cookie loss. Meta's Conversions API and Google Ads Enhanced
// Conversions are the standard pattern.
//
// What this file owns:
//   - sendMetaCapi()         — Meta Conversions API (real implementation)
//   - sendGoogleAdsEnhanced()— Google Ads Enhanced Conversions (stub —
//                              client-side gtag already covers this via
//                              the pixel layer; server-side adds value
//                              only at scale, wire it up when needed)
//
// Both are no-ops when their env vars aren't set, so checkout.session
// .completed continues to work in dev / preview without any external
// dependencies.
//
// Inputs are sanitised (lowercased, trimmed) before hashing per Meta's
// requirements; the platform de-duplicates events by event_id, so we
// pass the Stripe event id as the de-dup key for idempotent retries.

import 'server-only';
import { createHash } from 'node:crypto';

const META_PIXEL_ID = process.env.META_CAPI_PIXEL_ID;
const META_ACCESS_TOKEN = process.env.META_CAPI_ACCESS_TOKEN;
// Optional test event code from Meta's Events Manager Test Events tab —
// set during initial setup to verify events show up before flipping live.
const META_TEST_EVENT_CODE = process.env.META_CAPI_TEST_EVENT_CODE;

// SHA256 lowercase-trimmed hash, the only format Meta accepts for PII.
function sha256(input: string): string {
  return createHash('sha256')
    .update(input.trim().toLowerCase())
    .digest('hex');
}

export interface ConversionInput {
  /** Stripe event id — used as event_id for Meta's deduplication so
   *  webhook retries don't double-count. */
  eventId: string;
  /** Standard event name. `Purchase` for paid checkouts; `Lead` /
   *  `CompleteRegistration` for free tier signups when we wire those. */
  eventName: 'Purchase' | 'Lead' | 'CompleteRegistration' | 'Subscribe';
  /** Customer email — hashed before transmission. */
  email?: string | null;
  /** Customer phone in E.164 — hashed before transmission. */
  phone?: string | null;
  /** Stripe customer id, useful as `external_id` for matching. */
  externalId?: string | null;
  /** Value in dollars (not cents). */
  value?: number;
  /** ISO 4217 currency code (e.g. 'AUD'). */
  currency?: string;
  /** Source URL the conversion came from, e.g. /signup/foundations. */
  sourceUrl?: string;
  /** Meta click id (fbc cookie value). When available, dramatically
   *  improves match rate. Wire through Stripe metadata at checkout
   *  creation; absent for now. */
  fbc?: string | null;
  /** Meta browser id (fbp cookie value). Same caveat as fbc. */
  fbp?: string | null;
  /** Client IP — Meta uses it as a matching signal. */
  clientIp?: string | null;
  /** Client user-agent — same as above. */
  userAgent?: string | null;
}

/**
 * Send a conversion event to Meta Conversions API. No-ops when
 * META_CAPI_PIXEL_ID or META_CAPI_ACCESS_TOKEN are unset.
 *
 * Returns true on success, false on no-op or failure. Doesn't throw —
 * the webhook handler logs and moves on; we never block subscription
 * provisioning on a 3rd-party API call.
 */
export async function sendMetaCapi(input: ConversionInput): Promise<boolean> {
  if (!META_PIXEL_ID || !META_ACCESS_TOKEN) return false;

  const userData: Record<string, string | string[]> = {};
  if (input.email) userData.em = sha256(input.email);
  if (input.phone) userData.ph = sha256(input.phone.replace(/\D/g, ''));
  if (input.externalId) userData.external_id = sha256(input.externalId);
  if (input.fbc) userData.fbc = input.fbc;
  if (input.fbp) userData.fbp = input.fbp;
  if (input.clientIp) userData.client_ip_address = input.clientIp;
  if (input.userAgent) userData.client_user_agent = input.userAgent;

  if (Object.keys(userData).length === 0) {
    // No identifiers → Meta can't match, no point sending.
    return false;
  }

  const customData: Record<string, unknown> = {};
  if (typeof input.value === 'number') customData.value = input.value;
  if (input.currency) customData.currency = input.currency;

  const body = {
    data: [
      {
        event_name: input.eventName,
        event_time: Math.floor(Date.now() / 1000),
        event_id: input.eventId,
        action_source: 'website',
        event_source_url: input.sourceUrl,
        user_data: userData,
        custom_data: customData,
      },
    ],
    ...(META_TEST_EVENT_CODE ? { test_event_code: META_TEST_EVENT_CODE } : {}),
  };

  try {
    const res = await fetch(
      `https://graph.facebook.com/v18.0/${META_PIXEL_ID}/events?access_token=${encodeURIComponent(META_ACCESS_TOKEN)}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      },
    );
    if (!res.ok) {
      const detail = await res.text().catch(() => '');
      console.warn('[meta-capi] non-OK response', res.status, detail.slice(0, 200));
      return false;
    }
    return true;
  } catch (err) {
    console.warn('[meta-capi] send failed', err);
    return false;
  }
}

/**
 * Google Ads Enhanced Conversions — server-side stub.
 *
 * Intentionally not implemented in this PR. Client-side gtag() with
 * Enhanced Conversions enabled already covers the same use case via the
 * pixel layer (`src/components/analytics/Pixels.tsx` + the `gtag` fan-
 * out in `src/lib/analytics.ts`). Server-side would add value at the
 * iOS-loss tail, but requires OAuth-style auth (developer token +
 * customer id + refresh token + the `google-ads-api` package), which is
 * meaningful setup that should wait until the client-side ROI is
 * proven.
 *
 * Function signature is kept here so wiring in the webhook handler
 * stays symmetric with Meta and the team has an obvious place to fill
 * the implementation. Currently always returns false.
 */
export async function sendGoogleAdsEnhanced(input: ConversionInput): Promise<boolean> {
  if (!process.env.GOOGLE_ADS_CONVERSION_ACTION_ID) return false;
  // TODO: implement with google-ads-api package when conversion ROI
  // justifies the OAuth setup overhead. Client-side gtag conversion
  // is sufficient until then. `input` is referenced here so lint
  // doesn't flag it; remove this line when the real call lands.
  void input;
  return false;
}

/**
 * Fan-out helper. Fires both providers in parallel. Returns the count
 * of successful sends (0–2). Use this from the Stripe webhook handler
 * rather than calling each function individually.
 */
export async function sendServerConversion(input: ConversionInput): Promise<number> {
  const results = await Promise.allSettled([
    sendMetaCapi(input),
    sendGoogleAdsEnhanced(input),
  ]);
  return results.filter((r) => r.status === 'fulfilled' && r.value === true).length;
}
