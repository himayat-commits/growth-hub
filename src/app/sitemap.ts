import type { MetadataRoute } from 'next';
import { getPublicEvents } from '@/lib/cms';
import { canberraDateKey } from '@/lib/events-time';
import { GUIDES } from '@/lib/guides';

// Canonical production host. The Vercel deployment URL and any preview
// hosts fall back to this so search engines don't index split content.
const BASE = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://thegrowthhub.com.au';

type Doc = { slug?: string | null; updatedAt?: string | null; date?: string | null };

// CMS event slugs that resolve to the summit landing page. The two working
// titles 301 there (next.config.ts redirects) and the canonical slug is
// already in staticPages — listing them from the CMS would put redirecting
// and duplicate URLs in the sitemap. Mirrors SUMMIT_SLUGS in
// src/lib/sessions.ts.
const SUMMIT_SLUGS = new Set([
  'small-business-journey',
  'ai-for-small-business-9-july',
  'entrepreneurship-for-everyone',
]);

function entry(
  path: string,
  lastMod?: string | Date | null,
  changeFrequency: MetadataRoute.Sitemap[number]['changeFrequency'] = 'weekly',
  priority = 0.6,
): MetadataRoute.Sitemap[number] {
  return {
    url: `${BASE}${path}`,
    lastModified: lastMod ? new Date(lastMod) : new Date(),
    changeFrequency,
    priority,
  };
}

// Only the public marketing pages and upcoming events. Partner profiles and
// /with/{slug} micro-sites are retired (they 308 to /partners), and the shop
// was removed in Oct 2026 (/shop redirects home).
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const events = await getPublicEvents(100).catch(() => [] as Doc[]);

  const staticPages: MetadataRoute.Sitemap = [
    entry('/', null, 'weekly', 1),
    entry('/events', null, 'daily', 0.9),
    entry('/events/entrepreneurship-for-everyone', null, 'monthly', 0.6),
    entry('/sites', null, 'monthly', 0.9),
    entry('/guides', null, 'monthly', 0.8),
    ...GUIDES.map((g) => entry(`/guides/${g.slug}`, g.updated, 'monthly', 0.7)),
    entry('/partners', null, 'monthly', 0.7),
    entry('/about', null, 'monthly', 0.7),
    entry('/privacy', null, 'yearly', 0.3),
    entry('/community-guidelines', null, 'yearly', 0.4),
  ];

  // Upcoming = on or after today's date in Canberra (not server/UTC
  // midnight), so an event stays listed for the whole of its day.
  const today = canberraDateKey(new Date());
  const eventEntries: MetadataRoute.Sitemap = (events as Doc[])
    .filter(
      (e): e is Doc & { slug: string; date: string } =>
        Boolean(e.slug) &&
        !SUMMIT_SLUGS.has(e.slug as string) &&
        Boolean(e.date) &&
        canberraDateKey(new Date(e.date as string)) >= today,
    )
    .map((e) => entry(`/events/${e.slug}`, e.updatedAt ?? e.date, 'weekly', 0.7));

  return [...staticPages, ...eventEntries];
}
