/**
 * Payload CMS Local API helpers.
 *
 * All functions are wrapped in unstable_cache so RSCs get ISR behaviour:
 * - Data is cached in the Next.js data cache with a 1-hour baseline TTL.
 * - Payload hooks call /api/revalidate to purge tags whenever content changes.
 *
 * Import directly in Server Components — no API round-trip needed.
 * The Local API executes in-process via getPayload({ config }).
 */
import { getPayload } from 'payload';
import config from '@payload-config';
import { unstable_cache } from 'next/cache';

// Internal — returns the Payload instance (memoised within the Lambda lifecycle).
async function getPayloadClient() {
  return getPayload({ config });
}

// ── Pages ────────────────────────────────────────────────────────────────────

export const getPageBySlug = unstable_cache(
  async (slug: string) => {
    const payload = await getPayloadClient();
    const { docs } = await payload.find({
      collection: 'pages',
      where: {
        and: [
          { slug: { equals: slug } },
          { status: { equals: 'published' } },
        ],
      },
      limit: 1,
      depth: 2,
    });
    return docs[0] ?? null;
  },
  ['page-by-slug'],
  { tags: ['pages'], revalidate: 3600 }
);

export const getAllPageSlugs = unstable_cache(
  async (): Promise<string[]> => {
    const payload = await getPayloadClient();
    const { docs } = await payload.find({
      collection: 'pages',
      where: { status: { equals: 'published' } },
      limit: 0,
      depth: 0,
    });
    return docs.map((p) => String(p.slug));
  },
  ['all-page-slugs'],
  { tags: ['pages'], revalidate: 3600 }
);

// ── Posts ─────────────────────────────────────────────────────────────────────

export const getPosts = unstable_cache(
  async (limit = 12, page = 1) => {
    const payload = await getPayloadClient();
    return payload.find({
      collection: 'posts',
      where: { status: { equals: 'published' } },
      sort: '-publishedAt',
      limit,
      page,
      depth: 1,
    });
  },
  ['posts-list'],
  { tags: ['posts'], revalidate: 3600 }
);

export const getPostBySlug = unstable_cache(
  async (slug: string) => {
    const payload = await getPayloadClient();
    const { docs } = await payload.find({
      collection: 'posts',
      where: {
        and: [
          { slug: { equals: slug } },
          { status: { equals: 'published' } },
        ],
      },
      limit: 1,
      depth: 2,
    });
    return docs[0] ?? null;
  },
  ['post-by-slug'],
  { tags: ['posts'], revalidate: 3600 }
);

// ── Case Studies ──────────────────────────────────────────────────────────────

export const getCaseStudies = unstable_cache(
  async () => {
    const payload = await getPayloadClient();
    return payload.find({
      collection: 'case-studies',
      where: { status: { equals: 'published' } },
      depth: 1,
      limit: 0,
    });
  },
  ['case-studies'],
  { tags: ['case-studies'], revalidate: 3600 }
);

// ── Testimonials ──────────────────────────────────────────────────────────────

export const getTestimonials = unstable_cache(
  async (featuredOnly = false) => {
    const payload = await getPayloadClient();
    return payload.find({
      collection: 'testimonials',
      where: featuredOnly ? { featured: { equals: true } } : {},
      depth: 1,
      limit: 0,
    });
  },
  ['testimonials'],
  { tags: ['testimonials'], revalidate: 3600 }
);

// ── FAQs ──────────────────────────────────────────────────────────────────────

export const getFAQs = unstable_cache(
  async (category?: string) => {
    const payload = await getPayloadClient();
    return payload.find({
      collection: 'faqs',
      where: category ? { category: { equals: category } } : {},
      sort: 'order',
      depth: 0,
      limit: 0,
    });
  },
  ['faqs'],
  { tags: ['faqs'], revalidate: 3600 }
);

// ── Team Members ──────────────────────────────────────────────────────────────

export const getTeamMembers = unstable_cache(
  async () => {
    const payload = await getPayloadClient();
    return payload.find({
      collection: 'team-members',
      sort: 'order',
      depth: 1,
      limit: 0,
    });
  },
  ['team-members'],
  { tags: ['team-members'], revalidate: 3600 }
);

// ── Logos ─────────────────────────────────────────────────────────────────────

export const getLogos = unstable_cache(
  async () => {
    const payload = await getPayloadClient();
    return payload.find({
      collection: 'logos',
      sort: 'order',
      depth: 1,
      limit: 0,
    });
  },
  ['logos'],
  { tags: ['logos'], revalidate: 3600 }
);

// ── Globals ───────────────────────────────────────────────────────────────────

export const getSiteSettings = unstable_cache(
  async () => {
    const payload = await getPayloadClient();
    return payload.findGlobal({ slug: 'site-settings', depth: 0 });
  },
  ['site-settings'],
  { tags: ['site-settings'], revalidate: 3600 }
);

export const getNavigation = unstable_cache(
  async () => {
    const payload = await getPayloadClient();
    return payload.findGlobal({ slug: 'navigation', depth: 0 });
  },
  ['navigation'],
  { tags: ['navigation'], revalidate: 3600 }
);

export const getAnnouncementBar = unstable_cache(
  async () => {
    const payload = await getPayloadClient();
    return payload.findGlobal({ slug: 'announcement-bar', depth: 0 });
  },
  ['announcement-bar'],
  { tags: ['announcement-bar'], revalidate: 3600 }
);
