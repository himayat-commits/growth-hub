import type { MetadataRoute } from 'next';
import {
  getPublicEvents,
  getPartners,
  getCaseStudies,
  getPosts,
} from '@/lib/cms';

// Canonical production host. The Vercel deployment URL and any preview
// hosts fall back to this so search engines don't index split content.
const BASE = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://thegrowthhub.com.au';

type Doc = { slug?: string | null; updatedAt?: string | null; date?: string | null };

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

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [events, partners, caseStudies, posts] = await Promise.all([
    getPublicEvents(100).catch(() => [] as Doc[]),
    getPartners().catch(() => null),
    getCaseStudies().catch(() => null),
    getPosts(100, 1).catch(() => null),
  ]);

  const staticPages: MetadataRoute.Sitemap = [
    entry('/', null, 'weekly', 1),
    entry('/events', null, 'daily', 0.9),
    entry('/partners', null, 'weekly', 0.8),
    entry('/case-studies', null, 'weekly', 0.7),
    entry('/insights', null, 'weekly', 0.7),
    entry('/pricing', null, 'monthly', 0.8),
    entry('/signup/foundations', null, 'monthly', 0.8),
    entry('/signup/growth', null, 'monthly', 0.8),
    entry('/signup/accelerate', null, 'monthly', 0.8),
  ];

  const eventEntries: MetadataRoute.Sitemap = (events as Doc[])
    .filter((e): e is Doc & { slug: string } => Boolean(e.slug))
    .map((e) => entry(`/events/${e.slug}`, e.updatedAt ?? e.date, 'weekly', 0.7));

  const partnerDocs = (partners?.docs ?? []) as Doc[];
  const partnerSlugDocs = partnerDocs.filter(
    (p): p is Doc & { slug: string } => Boolean(p.slug),
  );
  // Each partner gets two indexed URLs: the directory profile
  // (/partners/{slug}) and the co-branded campaign micro-site
  // (/with/{slug}). Both pre-render at build time and are linked from
  // each other, so it's worth exposing both to crawlers — the micro-
  // site is what partners hand to their audience and ranks for the
  // "Growth Hub × {Partner}" query.
  const partnerEntries: MetadataRoute.Sitemap = partnerSlugDocs.flatMap((p) => [
    entry(`/partners/${p.slug}`, p.updatedAt, 'monthly', 0.6),
    entry(`/with/${p.slug}`, p.updatedAt, 'monthly', 0.6),
  ]);

  const caseStudyDocs = (caseStudies?.docs ?? []) as Doc[];
  const caseStudyEntries: MetadataRoute.Sitemap = caseStudyDocs
    .filter((c): c is Doc & { slug: string } => Boolean(c.slug))
    .map((c) => entry(`/case-studies/${c.slug}`, c.updatedAt, 'monthly', 0.6));

  const postDocs = (posts?.docs ?? []) as Doc[];
  const postEntries: MetadataRoute.Sitemap = postDocs
    .filter((p): p is Doc & { slug: string } => Boolean(p.slug))
    .map((p) => entry(`/insights/${p.slug}`, p.updatedAt, 'monthly', 0.5));

  return [
    ...staticPages,
    ...eventEntries,
    ...partnerEntries,
    ...caseStudyEntries,
    ...postEntries,
  ];
}
