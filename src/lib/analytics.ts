// Thin wrapper around posthog-js's capture() so the rest of the app
// doesn't import the SDK directly. No-ops when PostHog isn't loaded
// (dev / preview without the env var).
//
// Use these named events — the dashboard is set up to recognise them.
// Add new ones here so they stay typed and discoverable.

'use client';

import posthog from 'posthog-js';

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
  | 'partner_card_click'         // clicked a partner-directory card
  | 'case_study_open'            // viewed a /case-studies/[slug] page
  // Add-ons / referrals
  | 'referral_link_copy';        // copied referral link from /benefits

export function track(
  event: AnalyticsEvent,
  properties?: Record<string, string | number | boolean | null | undefined>,
) {
  if (typeof window === 'undefined') return;
  if (!posthog.__loaded) return;
  // Strip undefined keys so they don't pollute the PostHog event schema
  const cleanProps = properties
    ? Object.fromEntries(Object.entries(properties).filter(([, v]) => v !== undefined))
    : undefined;
  posthog.capture(event, cleanProps);
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
