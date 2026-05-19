import { withPayload } from '@payloadcms/next/withPayload';
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

export default withPayload(nextConfig);
