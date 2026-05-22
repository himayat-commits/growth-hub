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

/** Single case study by slug — for /case-studies/[slug]. */
export const getCaseStudyBySlug = unstable_cache(
  async (slug: string) => {
    try {
      const payload = await getPayloadClient();
      const { docs } = await payload.find({
        collection: 'case-studies',
        where: {
          and: [
            { slug: { equals: slug } },
            { status: { equals: 'published' } },
          ],
        },
        limit: 1,
        depth: 1,
      });
      return docs[0] ?? null;
    } catch (err) {
      console.warn('[cms] getCaseStudyBySlug failed', err);
      return null;
    }
  },
  ['case-study-by-slug'],
  { tags: ['case-studies'], revalidate: 3600 },
);

/** Every published case-study slug — for generateStaticParams. */
export const getCaseStudySlugs = unstable_cache(
  async (): Promise<string[]> => {
    try {
      const payload = await getPayloadClient();
      const { docs } = await payload.find({
        collection: 'case-studies',
        where: { status: { equals: 'published' } },
        limit: 0,
        depth: 0,
      });
      return docs.map((d) => String(d.slug)).filter(Boolean);
    } catch (err) {
      console.warn('[cms] getCaseStudySlugs failed — returning [].', err);
      return [];
    }
  },
  ['case-study-slugs'],
  { tags: ['case-studies'], revalidate: 3600 },
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

export const getSignupContent = unstable_cache(
  async () => {
    const payload = await getPayloadClient();
    return payload.findGlobal({ slug: 'signup-page-content', depth: 0 });
  },
  ['signup-page-content'],
  { tags: ['signup-page-content'], revalidate: 3600 }
);

// ── Partners ──────────────────────────────────────────────────────────────────

// Defensive: returns null when the query fails (e.g. preview DBs without
// the latest migrations applied — Payload's SELECT includes every column
// declared in the collection schema, so a single missing column blows up
// the whole query). Callers already use `result?.docs ?? []` so null
// falls through cleanly.
export const getPartners = unstable_cache(
  async () => {
    try {
      const payload = await getPayloadClient();
      return await payload.find({
        collection: 'partners',
        where: { status: { equals: 'published' } },
        sort: 'order',
        depth: 1,
        limit: 0,
      });
    } catch (err) {
      console.warn('[cms] getPartners failed — returning null.', err);
      return null;
    }
  },
  ['partners'],
  { tags: ['partners'], revalidate: 3600 }
);

/** Single partner by slug — for /partners/[slug] deep pages. Wrapped in
 *  try/catch so builds succeed even before the slug migration applies. */
export const getPartnerBySlug = unstable_cache(
  async (slug: string) => {
    try {
      const payload = await getPayloadClient();
      const { docs } = await payload.find({
        collection: 'partners',
        where: {
          and: [
            { slug: { equals: slug } },
            { status: { equals: 'published' } },
          ],
        },
        limit: 1,
        depth: 1,
      });
      return docs[0] ?? null;
    } catch (err) {
      console.warn('[cms] getPartnerBySlug failed', err);
      return null;
    }
  },
  ['partner-by-slug'],
  { tags: ['partners'], revalidate: 3600 },
);

/** Every published partner slug — used by generateStaticParams. */
export const getPartnerSlugs = unstable_cache(
  async (): Promise<string[]> => {
    try {
      const payload = await getPayloadClient();
      const { docs } = await payload.find({
        collection: 'partners',
        where: { status: { equals: 'published' } },
        limit: 0,
        depth: 0,
      });
      return docs.map((d) => String((d as { slug?: string }).slug ?? '')).filter(Boolean);
    } catch (err) {
      console.warn('[cms] getPartnerSlugs failed — returning [].', err);
      return [];
    }
  },
  ['partner-slugs'],
  { tags: ['partners'], revalidate: 3600 },
);

export const getPartnersPage = unstable_cache(
  async () => {
    const payload = await getPayloadClient();
    return payload.findGlobal({ slug: 'partners-page', depth: 0 });
  },
  ['partners-page'],
  { tags: ['partners-page'], revalidate: 3600 }
);

// ── Events ────────────────────────────────────────────────────────────────────

/** All events with date >= today (or no date), sorted by date ascending.
 *  Useful for the /events page's "Upcoming" section. */
export const getUpcomingEvents = unstable_cache(
  async (limit = 50) => {
    const payload = await getPayloadClient();
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const { docs } = await payload.find({
      collection: 'events',
      where: {
        date: { greater_than_equal: today.toISOString() },
      },
      sort: 'date',
      limit,
      depth: 1,
    });
    return docs;
  },
  ['events-upcoming'],
  { tags: ['events'], revalidate: 3600 },
);

/** Past events that have a recording uploaded. Used by /events "Past
 *  recordings" grid. */
export const getPastRecordings = unstable_cache(
  async (limit = 12) => {
    const payload = await getPayloadClient();
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const { docs } = await payload.find({
      collection: 'events',
      where: {
        and: [
          { date: { less_than: today.toISOString() } },
          { recording: { exists: true } },
        ],
      },
      sort: '-date',
      limit,
      depth: 1,
    });
    return docs;
  },
  ['events-past-recordings'],
  { tags: ['events'], revalidate: 3600 },
);

/** A single event by ID — used by the RSVP API to confirm the event exists. */
export async function getEventById(id: string | number) {
  const payload = await getPayloadClient();
  try {
    return await payload.findByID({ collection: 'events', id, depth: 0 });
  } catch {
    return null;
  }
}

/** Every event, including past — for the public /events hub which shows
 *  upcoming + recurring + bespoke summits regardless of date. Sorted
 *  with featured first, then date ascending. Defensive try/catch matches
 *  getGenericEventSlugs — see comment there. */
export const getPublicEvents = unstable_cache(
  async (limit = 100) => {
    try {
      const payload = await getPayloadClient();
      const { docs } = await payload.find({
        collection: 'events',
        sort: ['-featured', 'date'],
        limit,
        depth: 0,
      });
      return docs;
    } catch (err) {
      console.warn('[cms] getPublicEvents failed — returning [].', err);
      return [];
    }
  },
  ['events-public-all'],
  { tags: ['events'], revalidate: 3600 },
);

/** Single event by slug — for the public /events/[slug] detail page. */
export const getEventBySlug = unstable_cache(
  async (slug: string) => {
    const payload = await getPayloadClient();
    const { docs } = await payload.find({
      collection: 'events',
      where: { slug: { equals: slug } },
      limit: 1,
      depth: 0,
    });
    return docs[0] ?? null;
  },
  ['event-by-slug'],
  { tags: ['events'], revalidate: 3600 },
);

/** Every published event slug — used by generateStaticParams. Excludes
 *  bespoke events, which have their own static routes.
 *
 *  Wrapped in try/catch so production builds succeed even before the
 *  20260521_events_public_fields migration has run (e.g. preview deploys
 *  on a branch that hasn't applied migrations yet). Returns empty on
 *  failure — the dynamic route still renders at request time. */
export const getGenericEventSlugs = unstable_cache(
  async (): Promise<string[]> => {
    try {
      const payload = await getPayloadClient();
      const { docs } = await payload.find({
        collection: 'events',
        where: { bespoke: { not_equals: true } },
        limit: 0,
        depth: 0,
      });
      return docs.map((d) => String(d.slug)).filter(Boolean);
    } catch (err) {
      console.warn('[cms] getGenericEventSlugs failed — returning [].', err);
      return [];
    }
  },
  ['events-generic-slugs'],
  { tags: ['events'], revalidate: 3600 },
);

// ── Resources ─────────────────────────────────────────────────────────────────

/** All published resources, newest first. Wrapped in cache so /resources
 *  can call this on every page load without round-tripping Payload. */
export const getResources = unstable_cache(
  async (limit = 100) => {
    const payload = await getPayloadClient();
    const { docs } = await payload.find({
      collection: 'resources',
      sort: '-publishedAt',
      limit,
      depth: 1,
    });
    return docs;
  },
  ['resources-list'],
  { tags: ['resources'], revalidate: 3600 },
);

/** The 3-card "Suggested first reads" surface on /dashboard reads this. */
export const getFeaturedResources = unstable_cache(
  async (limit = 3) => {
    const payload = await getPayloadClient();
    const { docs } = await payload.find({
      collection: 'resources',
      where: { featured: { equals: true } },
      sort: '-publishedAt',
      limit,
      depth: 1,
    });
    return docs;
  },
  ['resources-featured'],
  { tags: ['resources'], revalidate: 3600 },
);

// ── Services ──────────────────────────────────────────────────────────────────

/** All active services, sorted by sortOrder then alphabetically. Used by
 *  the Services tab on /(app)/services. */
export const getServices = unstable_cache(
  async () => {
    const payload = await getPayloadClient();
    const { docs } = await payload.find({
      collection: 'services',
      where: { active: { equals: true } },
      sort: ['sortOrder', 'title'],
      limit: 100,
      depth: 0,
    });
    return docs;
  },
  ['services-list'],
  { tags: ['services'], revalidate: 3600 },
);

/** Single service by slug — for the /services/[slug] detail page (Phase 7). */
export const getServiceBySlug = unstable_cache(
  async (slug: string) => {
    const payload = await getPayloadClient();
    const { docs } = await payload.find({
      collection: 'services',
      where: {
        and: [
          { slug: { equals: slug } },
          { active: { equals: true } },
        ],
      },
      limit: 1,
      depth: 0,
    });
    return docs[0] ?? null;
  },
  ['service-by-slug'],
  { tags: ['services'], revalidate: 3600 },
);
