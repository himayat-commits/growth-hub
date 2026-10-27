import { withPayload } from '@payloadcms/next/withPayload';
import { withSentryConfig } from '@sentry/nextjs';
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    formats: ["image/avif", "image/webp"],
    localPatterns: [
      { pathname: "/images/**" },
      // Payload media served through the app (Vercel Blob behind access control).
      { pathname: "/api/media/**" },
    ],
    remotePatterns: [
      {
        // Vercel Blob storage — required for <Image> to optimize blob-served media.
        protocol: "https",
        hostname: "*.public.blob.vercel-storage.com",
      },
      // Payload media URLs are made absolute (Stripe needs absolute image URLs)
      // and then fed to <Image>; the optimizer must trust our own hosts.
      { protocol: "https", hostname: "thegrowthhub.com.au", pathname: "/api/media/**" },
      { protocol: "https", hostname: "app.thegrowthhub.com.au", pathname: "/api/media/**" },
      { protocol: "https", hostname: "*.vercel.app", pathname: "/api/media/**" },
    ],
  },

  // Baseline security headers on every response. Deliberately no CSP yet:
  // Stripe Checkout, HubSpot forms/embeds, PostHog, GA4 / Meta / LinkedIn
  // pixels, Sentry's /monitoring tunnel and Payload admin each need their
  // script/connect/frame origins allow-listed — do that as its own change
  // with report-only first. X-Frame-Options is SAMEORIGIN (not DENY) because
  // Payload admin renders live preview in a same-origin iframe.
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
        ],
      },
    ];
  },

  // Legacy → new URL redirects as we migrate the post-signup surface onto the
  // mockup-derived dashboard shell. 301s so bookmarks + crawlers update.
  async redirects() {
    return [
      { source: '/portal', destination: '/dashboard', permanent: true },
      { source: '/portal/:path*', destination: '/dashboard', permanent: true },
      { source: '/account', destination: '/profile', permanent: true },
      // Summit consolidation → the canonical "Entrepreneurship for Everyone"
      // landing page. The old working titles ("Small Business Journey",
      // "AI for Small Business") and the bare /expo path all funnel here.
      // NB: '/expo' matches exactly (no nested paths), so /expo/apply — the
      // contributor application form — is intentionally left untouched.
      { source: '/events/small-business-journey', destination: '/events/entrepreneurship-for-everyone', permanent: true },
      { source: '/events/ai-for-small-business-9-july', destination: '/events/entrepreneurship-for-everyone', permanent: true },
      { source: '/expo', destination: '/events/entrepreneurship-for-everyone', permanent: true },
      // Site refresh (Oct 2026): the portal-era pricing and sign-up pages are
      // retired in favour of Growth Hub Sites, and the closed summit form goes
      // to the summit page.
      { source: '/pricing', destination: '/sites', permanent: true },
      { source: '/signup/:path*', destination: '/sites', permanent: true },
      { source: '/expo/apply', destination: '/events/entrepreneurship-for-everyone', permanent: true },
      { source: '/contact', destination: '/about#contact', permanent: true },
      { source: '/sessions', destination: '/events', permanent: true },
      // Partner pages (Oct 2026): the co-branded /with/{slug} micro-sites and
      // the legacy /partners/{slug} profiles are retired in favour of the one
      // /partners page. The lookahead stops /partners' own generated share
      // image (/partners/opengraph-image-…) being redirected with them.
      { source: '/with/:slug', destination: '/partners', permanent: true },
      { source: '/partners/:slug((?!opengraph-image|twitter-image).+)', destination: '/partners', permanent: true },
      // Hidden until there are real stories and articles to show — temporary
      // (307) so the URLs can come back without fighting browser caches.
      { source: '/case-studies', destination: '/', permanent: false },
      { source: '/case-studies/:path*', destination: '/', permanent: false },
      { source: '/insights', destination: '/events', permanent: false },
      { source: '/insights/:path*', destination: '/events', permanent: false },
    ];
  },
};

// Sentry plugin wraps the Payload-wrapped config. Source map upload only
// happens when SENTRY_AUTH_TOKEN is set, so local + preview builds are silent.
export default withSentryConfig(withPayload(nextConfig), {
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
  authToken: process.env.SENTRY_AUTH_TOKEN,
  silent: !process.env.CI,
  widenClientFileUpload: true,
  disableLogger: true,
  // Tunnel to the same origin so ad blockers don't drop browser events.
  tunnelRoute: '/monitoring',
});
