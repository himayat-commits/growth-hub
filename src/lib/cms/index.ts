/**
 * Payload CMS Local API helpers.
 *
 * All functions are wrapped in unstable_cache so RSCs get ISR behaviour:
 * - Data is cached in the Next.js data cache with a 1-hour baseline TTL.
 * - Payload hooks call /api/revalidate to purge tags whenever content changes.
 *
 * Import directly in Server Components — no API round-trip needed.
 * The Local API executes in-process via getPayload({ config }).
 *
 * Defensive pattern: every helper that touches Payload is wrapped in
 * try/catch and returns null (single doc / global / paginated result) or
 * [] (raw array). The reason is structural: Payload's SELECT includes
 * EVERY column declared in the collection schema, so a single column
 * added in code but not yet migrated to the DB blows up the entire
 * query and breaks the prerender of every page that calls the helper.
 *
 * All call sites use optional chaining (`result?.docs ?? []`) or null
 * guards, so a null return falls through to the page's hardcoded
 * fallback instead of crashing the build. Once migrations apply on the
 * target DB, the catch never fires.
 */
import { getPayload } from 'payload';
import config from '@payload-config';
import { unstable_cache } from 'next/cache';

// Internal — returns the Payload instance (memoised within the Lambda lifecycle).
async function getPayloadClient() {
  return getPayload({ config });
}

// Single shared logger so consumers can grep cleanly for cms-helper failures.
function warn(label: string, err: unknown) {
  console.warn(`[cms] ${label} failed.`, err);
}

// ── Pages ────────────────────────────────────────────────────────────────────

export const getPageBySlug = unstable_cache(
  async (slug: string) => {
    try {
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
    } catch (err) {
      warn('getPageBySlug', err);
      return null;
    }
  },
  ['page-by-slug'],
  { tags: ['pages'], revalidate: 3600 }
);

export const getAllPageSlugs = unstable_cache(
  async (): Promise<string[]> => {
    try {
      const payload = await getPayloadClient();
      const { docs } = await payload.find({
        collection: 'pages',
        where: { status: { equals: 'published' } },
        limit: 0,
        depth: 0,
      });
      return docs.map((p) => String(p.slug));
    } catch (err) {
      warn('getAllPageSlugs', err);
      return [];
    }
  },
  ['all-page-slugs'],
  { tags: ['pages'], revalidate: 3600 }
);

// ── Posts ─────────────────────────────────────────────────────────────────────

export const getPosts = unstable_cache(
  async (limit = 12, page = 1) => {
    try {
      const payload = await getPayloadClient();
      return await payload.find({
        collection: 'posts',
        where: { status: { equals: 'published' } },
        sort: '-publishedAt',
        limit,
        page,
        depth: 1,
      });
    } catch (err) {
      warn('getPosts', err);
      return null;
    }
  },
  ['posts-list'],
  { tags: ['posts'], revalidate: 3600 }
);

export const getPostBySlug = unstable_cache(
  async (slug: string) => {
    try {
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
    } catch (err) {
      warn('getPostBySlug', err);
      return null;
    }
  },
  ['post-by-slug'],
  { tags: ['posts'], revalidate: 3600 }
);

// ── Case Studies ──────────────────────────────────────────────────────────────

export const getCaseStudies = unstable_cache(
  async () => {
    try {
      const payload = await getPayloadClient();
      return await payload.find({
        collection: 'case-studies',
        where: { status: { equals: 'published' } },
        depth: 1,
        limit: 0,
      });
    } catch (err) {
      warn('getCaseStudies', err);
      return null;
    }
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
      warn('getCaseStudyBySlug', err);
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
      warn('getCaseStudySlugs', err);
      return [];
    }
  },
  ['case-study-slugs'],
  { tags: ['case-studies'], revalidate: 3600 },
);

// ── Testimonials ──────────────────────────────────────────────────────────────

export const getTestimonials = unstable_cache(
  async (featuredOnly = false) => {
    try {
      const payload = await getPayloadClient();
      return await payload.find({
        collection: 'testimonials',
        where: featuredOnly ? { featured: { equals: true } } : {},
        depth: 1,
        limit: 0,
      });
    } catch (err) {
      warn('getTestimonials', err);
      return null;
    }
  },
  ['testimonials'],
  { tags: ['testimonials'], revalidate: 3600 }
);

// ── FAQs ──────────────────────────────────────────────────────────────────────

export const getFAQs = unstable_cache(
  async (category?: string) => {
    try {
      const payload = await getPayloadClient();
      return await payload.find({
        collection: 'faqs',
        where: category ? { category: { equals: category } } : {},
        sort: 'order',
        depth: 0,
        limit: 0,
      });
    } catch (err) {
      warn('getFAQs', err);
      return null;
    }
  },
  ['faqs'],
  { tags: ['faqs'], revalidate: 3600 }
);

// ── Team Members ──────────────────────────────────────────────────────────────

export const getTeamMembers = unstable_cache(
  async () => {
    try {
      const payload = await getPayloadClient();
      return await payload.find({
        collection: 'team-members',
        sort: 'order',
        depth: 1,
        limit: 0,
      });
    } catch (err) {
      warn('getTeamMembers', err);
      return null;
    }
  },
  ['team-members'],
  { tags: ['team-members'], revalidate: 3600 }
);

// ── Logos ─────────────────────────────────────────────────────────────────────

export const getLogos = unstable_cache(
  async () => {
    try {
      const payload = await getPayloadClient();
      return await payload.find({
        collection: 'logos',
        sort: 'order',
        depth: 1,
        limit: 0,
      });
    } catch (err) {
      warn('getLogos', err);
      return null;
    }
  },
  ['logos'],
  { tags: ['logos'], revalidate: 3600 }
);

// ── Globals ───────────────────────────────────────────────────────────────────

export const getSiteSettings = unstable_cache(
  async () => {
    try {
      const payload = await getPayloadClient();
      return await payload.findGlobal({ slug: 'site-settings', depth: 0 });
    } catch (err) {
      warn('getSiteSettings', err);
      return null;
    }
  },
  ['site-settings'],
  { tags: ['site-settings'], revalidate: 3600 }
);

export const getNavigation = unstable_cache(
  async () => {
    try {
      const payload = await getPayloadClient();
      return await payload.findGlobal({ slug: 'navigation', depth: 0 });
    } catch (err) {
      warn('getNavigation', err);
      return null;
    }
  },
  ['navigation'],
  { tags: ['navigation'], revalidate: 3600 }
);

export const getAnnouncementBar = unstable_cache(
  async () => {
    try {
      const payload = await getPayloadClient();
      return await payload.findGlobal({ slug: 'announcement-bar', depth: 0 });
    } catch (err) {
      warn('getAnnouncementBar', err);
      return null;
    }
  },
  ['announcement-bar'],
  { tags: ['announcement-bar'], revalidate: 3600 }
);

export const getSignupContent = unstable_cache(
  async () => {
    try {
      const payload = await getPayloadClient();
      return await payload.findGlobal({ slug: 'signup-page-content', depth: 0 });
    } catch (err) {
      warn('getSignupContent', err);
      return null;
    }
  },
  ['signup-page-content'],
  { tags: ['signup-page-content'], revalidate: 3600 }
);

// ── Partners ──────────────────────────────────────────────────────────────────

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
      warn('getPartners', err);
      return null;
    }
  },
  ['partners'],
  { tags: ['partners'], revalidate: 3600 }
);

/** Single partner by slug — for /partners/[slug] deep pages. */
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
      warn('getPartnerBySlug', err);
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
      warn('getPartnerSlugs', err);
      return [];
    }
  },
  ['partner-slugs'],
  { tags: ['partners'], revalidate: 3600 },
);

export const getPartnersPage = unstable_cache(
  async () => {
    try {
      const payload = await getPayloadClient();
      return await payload.findGlobal({ slug: 'partners-page', depth: 0 });
    } catch (err) {
      warn('getPartnersPage', err);
      return null;
    }
  },
  ['partners-page'],
  { tags: ['partners-page'], revalidate: 3600 }
);

// ── Events ────────────────────────────────────────────────────────────────────

/** All events with date >= today (or no date), sorted by date ascending. */
export const getUpcomingEvents = unstable_cache(
  async (limit = 50) => {
    try {
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
    } catch (err) {
      warn('getUpcomingEvents', err);
      return [];
    }
  },
  ['events-upcoming'],
  { tags: ['events'], revalidate: 3600 },
);

/** All past events (date < today), most recent first. Used by the
 *  public /events "From the archive" section so adding a past event
 *  is an editor task in Payload rather than a code change. */
export const getPastEvents = unstable_cache(
  async (limit = 6) => {
    try {
      const payload = await getPayloadClient();
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const { docs } = await payload.find({
        collection: 'events',
        where: { date: { less_than: today.toISOString() } },
        sort: '-date',
        limit,
        depth: 0,
      });
      return docs;
    } catch (err) {
      warn('getPastEvents', err);
      return [];
    }
  },
  ['events-past-public'],
  { tags: ['events'], revalidate: 3600 },
);

/** Past events with a recording uploaded. */
export const getPastRecordings = unstable_cache(
  async (limit = 12) => {
    try {
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
    } catch (err) {
      warn('getPastRecordings', err);
      return [];
    }
  },
  ['events-past-recordings'],
  { tags: ['events'], revalidate: 3600 },
);

/** A single event by ID — used by the RSVP API to confirm the event exists. */
export async function getEventById(id: string | number) {
  try {
    const payload = await getPayloadClient();
    return await payload.findByID({ collection: 'events', id, depth: 0 });
  } catch {
    return null;
  }
}

/** Every event, including past — for the public /events hub. */
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
      warn('getPublicEvents', err);
      return [];
    }
  },
  ['events-public-all'],
  { tags: ['events'], revalidate: 3600 },
);

/** Single event by slug — for the public /events/[slug] detail page.
 *  Uses depth=1 so the `host` and `partners` relationships return as full
 *  objects (name, slug, shape, category) for the partner lock-up render. */
export const getEventBySlug = unstable_cache(
  async (slug: string) => {
    try {
      const payload = await getPayloadClient();
      const { docs } = await payload.find({
        collection: 'events',
        where: { slug: { equals: slug } },
        limit: 1,
        depth: 1,
      });
      return docs[0] ?? null;
    } catch (err) {
      warn('getEventBySlug', err);
      return null;
    }
  },
  ['event-by-slug'],
  { tags: ['events'], revalidate: 3600 },
);

/** Upcoming events where the given partner is the `host` or appears in
 *  `partners[]`. Powers the "Upcoming with us" section on /partners/[slug]. */
export const getEventsForPartner = unstable_cache(
  async (partnerId: string | number, limit = 6) => {
    try {
      const payload = await getPayloadClient();
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const { docs } = await payload.find({
        collection: 'events',
        where: {
          and: [
            { date: { greater_than_equal: today.toISOString() } },
            {
              or: [
                { host: { equals: partnerId } },
                { partners: { contains: partnerId } },
              ],
            },
          ],
        },
        sort: 'date',
        limit,
        depth: 0,
      });
      return docs;
    } catch (err) {
      warn('getEventsForPartner', err);
      return [];
    }
  },
  ['events-for-partner'],
  { tags: ['events', 'partners'], revalidate: 3600 },
);

/** Every published event slug — for generateStaticParams. Excludes bespoke. */
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
      warn('getGenericEventSlugs', err);
      return [];
    }
  },
  ['events-generic-slugs'],
  { tags: ['events'], revalidate: 3600 },
);

// ── Resources ─────────────────────────────────────────────────────────────────

/** All published resources, newest first. */
export const getResources = unstable_cache(
  async (limit = 100) => {
    try {
      const payload = await getPayloadClient();
      const { docs } = await payload.find({
        collection: 'resources',
        sort: '-publishedAt',
        limit,
        depth: 1,
      });
      return docs;
    } catch (err) {
      warn('getResources', err);
      return [];
    }
  },
  ['resources-list'],
  { tags: ['resources'], revalidate: 3600 },
);

/** The 3-card "Suggested first reads" surface on /dashboard reads this. */
export const getFeaturedResources = unstable_cache(
  async (limit = 3) => {
    try {
      const payload = await getPayloadClient();
      const { docs } = await payload.find({
        collection: 'resources',
        where: { featured: { equals: true } },
        sort: '-publishedAt',
        limit,
        depth: 1,
      });
      return docs;
    } catch (err) {
      warn('getFeaturedResources', err);
      return [];
    }
  },
  ['resources-featured'],
  { tags: ['resources'], revalidate: 3600 },
);

// ── Services ──────────────────────────────────────────────────────────────────

/** All active services. */
export const getServices = unstable_cache(
  async () => {
    try {
      const payload = await getPayloadClient();
      const { docs } = await payload.find({
        collection: 'services',
        where: { active: { equals: true } },
        sort: ['sortOrder', 'title'],
        limit: 100,
        depth: 0,
      });
      return docs;
    } catch (err) {
      warn('getServices', err);
      return [];
    }
  },
  ['services-list'],
  { tags: ['services'], revalidate: 3600 },
);

/** Single service by slug — for the /services/[slug] detail page. */
export const getServiceBySlug = unstable_cache(
  async (slug: string) => {
    try {
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
    } catch (err) {
      warn('getServiceBySlug', err);
      return null;
    }
  },
  ['service-by-slug'],
  { tags: ['services'], revalidate: 3600 },
);

// ── Strategists ───────────────────────────────────────────────────────────────

export const getActiveStrategists = unstable_cache(
  async () => {
    try {
      const payload = await getPayloadClient();
      const { docs } = await payload.find({
        collection: 'strategists',
        where: { active: { equals: true } },
        sort: 'order',
        depth: 1,
        limit: 0,
      });
      return docs;
    } catch (err) {
      warn('getActiveStrategists', err);
      return [];
    }
  },
  ['active-strategists'],
  { tags: ['strategists'], revalidate: 3600 },
);

export const getStrategistBySlug = unstable_cache(
  async (slug: string) => {
    try {
      const payload = await getPayloadClient();
      const { docs } = await payload.find({
        collection: 'strategists',
        where: { slug: { equals: slug } },
        limit: 1,
        depth: 1,
      });
      return docs[0] ?? null;
    } catch (err) {
      warn('getStrategistBySlug', err);
      return null;
    }
  },
  ['strategist-by-slug'],
  { tags: ['strategists'], revalidate: 3600 },
);
