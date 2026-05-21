import { withPayload } from '@payloadcms/next/withPayload';
import { withSentryConfig } from '@sentry/nextjs';
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    formats: ["image/avif", "image/webp"],
    localPatterns: [{ pathname: "/images/**" }],
    remotePatterns: [
      {
        // Vercel Blob storage — required for <Image> to optimize blob-served media.
        // Replace with your actual Vercel Blob hostname once the store is created.
        protocol: "https",
        hostname: "*.public.blob.vercel-storage.com",
      },
    ],
  },

  // Legacy → new URL redirects as we migrate the post-signup surface onto the
  // mockup-derived dashboard shell. 301s so bookmarks + crawlers update.
  async redirects() {
    return [
      { source: '/portal', destination: '/dashboard', permanent: true },
      { source: '/portal/:path*', destination: '/dashboard', permanent: true },
      { source: '/account', destination: '/profile', permanent: true },
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
