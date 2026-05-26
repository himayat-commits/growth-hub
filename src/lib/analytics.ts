// Thin wrapper around posthog-js's capture() so the rest of the app
// doesn't import the SDK directly. No-ops when PostHog isn't loaded
// (dev / preview without the env var).
//
// Use these named events — the dashboard is set up to recognise them.
// Add new ones here so they stay typed and discoverable.
//
// Ad-platform fan-out: track() also forwards select events to GA4 / Meta
// Pixel / LinkedIn Insight Tag when those pixels are loaded (via
// src/components/analytics/Pixels.tsx). Mapping lives in trackPixelEvent()
// at the bottom of this file. Each platform no-ops silently when its
// corresponding NEXT_PUBLIC_* env var isn't set, so it's safe to call
// track() unconditionally everywhere.

'use client';

import posthog from 'posthog-js';

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
    fbq?: (...args: unknown[]) => void;
    lintrk?: (...args: unknown[]) => void;
  }
}

export type AnalyticsEvent =
  // Signup funnel
  | 'cta_click_signup'           // any "Sign Up Now" / "Join free" CTA
  | 'cta_click_upgrade'          // pricing tier "Start with X" buttons
  | 'free_tier_join'             // the dedicated Free banner CTA
  | 'pricing_interval_toggle'    // monthly/annual toggle on /pricing
  | 'pricing_compare_open'       // expand the comparison table
  // Plan management (dashboard)
  | 'plan_change_open'           // ChangePlanDialog opened
  | 'plan_change_committed'      // user confirmed a plan change
  | 'plan_cancel_open'           // CancelDialog opened
  | 'plan_cancel_committed'      // user submitted a cancellation
  // Marketing
  | 'newsletter_signup'          // /api/newsletter success
  | 'contact_form_submit'        // homepage Contact form submitted
  | 'event_rsvp_intent'          // clicked RSVP CTA on /events/[slug]
  | 'event_add_to_calendar'      // clicked Add to Calendar (.ics download)
  | 'partner_card_click'         // clicked a partner-directory card
  | 'case_study_open'            // viewed a /case-studies/[slug] page
  // Add-ons / referrals
  | 'referral_link_copy';        // copied referral link from /benefits

export function track(
  event: AnalyticsEvent,
  properties?: Record<string, string | number | boolean | null | undefined>,
) {
  if (typeof window === 'undefined') return;
  // Strip undefined keys so they don't pollute downstream schemas.
  const cleanProps = properties
    ? Object.fromEntries(Object.entries(properties).filter(([, v]) => v !== undefined))
    : undefined;

  if (posthog.__loaded) {
    posthog.capture(event, cleanProps);
  }
  // Fan out to ad pixels — each provider is independent and no-ops when
  // its NEXT_PUBLIC_*_ID env var isn't set.
  trackPixelEvent(event, cleanProps);
}

// ── Ad-platform fan-out ──────────────────────────────────────────────────
//
// Maps PostHog event names → platform-specific events. Designed to be
// expanded incrementally:
//   - GA4: every event fires as a custom event (or a standard event when
//     there's a clean match like sign_up / generate_lead). Custom events
//     show up in GA4 reports without setup.
//   - Meta Pixel: only the funnel events Meta has standard names for fire.
//     Standard events feed Meta's optimisation algorithms; custom events
//     don't, so we don't bother with them for non-conversion clicks.
//   - LinkedIn: each conversion needs an explicit conversion_id from
//     Campaign Manager, surfaced via NEXT_PUBLIC_LINKEDIN_CONV_<KEY> env
//     vars. Until those are set, LinkedIn tracking is dormant for that
//     event. Generic page traffic is already captured by the Insight Tag.

type CleanProps = Record<string, string | number | boolean | null | undefined> | undefined;

interface GaMap {
  /** GA4 event name (snake_case). Standard names listed at
   *  https://developers.google.com/analytics/devguides/collection/ga4/reference/events. */
  ga4: string;
}
interface MetaMap {
  /** Standard Meta event name. Custom events skipped — they don't feed
   *  Meta's optimisation models. */
  meta: 'Lead' | 'Subscribe' | 'Contact' | 'CompleteRegistration' | 'Schedule' | 'ViewContent';
}
interface LinkedInMap {
  /** Env var name suffix — full var is `NEXT_PUBLIC_LINKEDIN_CONV_${key}`.
   *  Only events the team set up as a LinkedIn conversion will fire. */
  linkedinEnvKey: string;
}

type PlatformMap = GaMap & Partial<MetaMap> & Partial<LinkedInMap>;

const EVENT_MAP: Partial<Record<AnalyticsEvent, PlatformMap>> = {
  // Signup funnel
  cta_click_signup:        { ga4: 'cta_click_signup', meta: 'Lead' },
  cta_click_upgrade:       { ga4: 'cta_click_upgrade' },
  free_tier_join:          { ga4: 'sign_up', meta: 'CompleteRegistration', linkedinEnvKey: 'FREE_JOIN' },
  pricing_interval_toggle: { ga4: 'pricing_interval_toggle' },
  pricing_compare_open:    { ga4: 'pricing_compare_open' },

  // Marketing
  newsletter_signup:    { ga4: 'sign_up', meta: 'Subscribe', linkedinEnvKey: 'NEWSLETTER' },
  contact_form_submit:  { ga4: 'generate_lead', meta: 'Contact', linkedinEnvKey: 'CONTACT' },
  event_rsvp_intent:    { ga4: 'generate_lead', meta: 'Lead', linkedinEnvKey: 'RSVP' },
  event_add_to_calendar:{ ga4: 'event_add_to_calendar', meta: 'Schedule' },
  partner_card_click:   { ga4: 'partner_card_click' },
  case_study_open:      { ga4: 'case_study_open', meta: 'ViewContent' },

  // Referrals
  referral_link_copy: { ga4: 'share' },
  // Plan-management events (plan_change_*, plan_cancel_*) intentionally
  // omitted — they're dashboard-only and don't belong in acquisition pixels.
};

function trackPixelEvent(event: AnalyticsEvent, props: CleanProps): void {
  const map = EVENT_MAP[event];
  if (!map) return;

  if (window.gtag && process.env.NEXT_PUBLIC_GA4_ID) {
    window.gtag('event', map.ga4, props ?? {});
  }
  if (window.fbq && map.meta && process.env.NEXT_PUBLIC_META_PIXEL_ID) {
    window.fbq('track', map.meta, props ?? {});
  }
  if (window.lintrk && map.linkedinEnvKey) {
    const conversionId =
      process.env[
        `NEXT_PUBLIC_LINKEDIN_CONV_${map.linkedinEnvKey}` as keyof NodeJS.ProcessEnv
      ];
    if (conversionId) {
      window.lintrk('track', { conversion_id: Number(conversionId) });
    }
  }
}

/** Tie a PostHog person to a WorkOS user id post-signin so events on
 *  authenticated pages associate with the right profile. Call from a
 *  client component that knows the user's id + email (e.g. after sign-in). */
export function identify(userId: string, traits?: { email?: string; planTier?: string | null }) {
  if (typeof window === 'undefined') return;
  if (!posthog.__loaded) return;
  posthog.identify(userId, {
    email: traits?.email,
    planTier: traits?.planTier ?? 'free',
  });
}

export function reset() {
  if (typeof window === 'undefined') return;
  if (!posthog.__loaded) return;
  posthog.reset();
}
