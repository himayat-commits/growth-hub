import type { MetadataRoute } from "next";

const BASE = process.env.NEXT_PUBLIC_SITE_URL ?? "https://thegrowthhub.com.au";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      // Member app, staff console, CMS admin, API and transactional shop pages
      // are auth-gated or per-session; keep their sign-in redirects out of
      // the index.
      disallow: [
        "/api/",
        "/admin",
        "/dashboard",
        "/ops",
        "/orders",
        "/onboarding",
        "/profile",
        "/messages",
        "/my-events",
        "/resources",
        "/benefits",
        "/plan",
        "/search",
        "/shop/cart",
        "/shop/success",
      ],
    },
    sitemap: `${BASE}/sitemap.xml`,
  };
}
