import type { MetadataRoute } from "next";

const BASE = process.env.NEXT_PUBLIC_SITE_URL ?? "https://thegrowthhub.com.au";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      // CMS admin and API routes aren't pages. The retired member portal and
      // shop paths now redirect (next.config.ts), so they need no entry here.
      disallow: ["/api/", "/admin"],
    },
    sitemap: `${BASE}/sitemap.xml`,
  };
}
