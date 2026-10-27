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
 * Defensive pattern: every helper degrades to null (single doc / global /
 * paginated result) or [] (raw array) when Payload throws. The reason is
 * structural: Payload's SELECT includes EVERY column declared in the
 * collection schema, so a single column added in code but not yet migrated
 * to the DB blows up the entire query and breaks the prerender of every
 * page that calls the helper. All call sites use optional chaining
 * (`result?.docs ?? []`) or null guards, so a fallback falls through to
 * the page's hardcoded content instead of crashing the build.
 *
 * WHERE the try/catch lives matters. The catch is applied by `cachedSafe`
 * OUTSIDE the unstable_cache boundary, never inside the cached callback.
 * unstable_cache only stores a value after the callback's promise
 * resolves (`const result = await run(cb, ...args)` then `cacheNewResult`
 * in next/dist/server/web/spec-extension/unstable-cache.js) — a rejected
 * promise is never written to the data cache, and a failed background
 * revalidation keeps serving the previous good entry. So a transient Neon
 * blip surfaces as one warned request with the fallback, and the next
 * request retries Payload. Catching INSIDE the callback (the previous
 * pattern) turned the blip into a memoised `null`/`[]` for the full
 * `revalidate` window, i.e. an hour of empty pages with HTTP 200.
 */
import { getPayload, type Where } from 'payload';
import config from '@payload-config';
import { unstable_cache } from 'next/cache';
import { canberraDateKey, canberraStartOfDay } from '@/lib/events-time';

// Internal — returns the Payload instance (memoised within the Lambda lifecycle).
async function getPayloadClient() {
  return getPayload({ config });
}

// Single shared logger so consumers can grep cleanly for cms-helper failures.
function warn(label: string, err: unknown) {
  console.warn(`[cms] ${label} failed.`, err);
}

type CacheOptions = NonNullable<Parameters<typeof unstable_cache>[2]>;

/**
 * unstable_cache + an error boundary on the OUTSIDE of the cache.
 *
 * `fn` runs inside unstable_cache with the given keys/options exactly as
 * before; if it throws, the rejection propagates out of the cache (nothing
 * is stored — see the header comment) and is caught here, logged under
 * `label`, and replaced with `fallback`. `fallback` may be a value or a
 * function of the call args for callers that need a per-call default.
 *
 * T is inferred from both `fn` and `fallback`, so a helper that returns
 * `payload.find(...)` with a `null` fallback types as `Result | null`,
 * matching the previous inner-try/catch signatures one-for-one.
 */
function cachedSafe<TArgs extends unknown[], T>(
  fn: (...args: TArgs) => Promise<T>,
  keys: string[],
  opts: CacheOptions,
  fallback: T | ((...args: TArgs) => T),
  label: string,
): (...args: TArgs) => Promise<T> {
  const cached = unstable_cache(fn, keys, opts);
  return async (...args: TArgs): Promise<T> => {
    try {
      return await cached(...args);
    } catch (err) {
      warn(label, err);
      return typeof fallback === 'function'
        ? (fallback as (...args: TArgs) => T)(...args)
        : fallback;
    }
  };
}

// ── Pages ────────────────────────────────────────────────────────────────────

export const getPageBySlug = cachedSafe(
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
  { tags: ['pages'], revalidate: 3600 },
  null,
  'getPageBySlug',
);

export const getAllPageSlugs = cachedSafe(
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
  { tags: ['pages'], revalidate: 3600 },
  [],
  'getAllPageSlugs',
);

// ── Posts ─────────────────────────────────────────────────────────────────────

export const getPosts = cachedSafe(
  async (limit: number = 12, page: number = 1) => {
    const payload = await getPayloadClient();
    return await payload.find({
      collection: 'posts',
      where: { status: { equals: 'published' } },
      sort: '-publishedAt',
      limit,
      page,
      depth: 1,
    });
  },
  ['posts-list'],
  { tags: ['posts'], revalidate: 3600 },
  null,
  'getPosts',
);

export const getPostBySlug = cachedSafe(
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
  { tags: ['posts'], revalidate: 3600 },
  null,
  'getPostBySlug',
);

// ── Case Studies ──────────────────────────────────────────────────────────────

export const getCaseStudies = cachedSafe(
  async () => {
    const payload = await getPayloadClient();
    return await payload.find({
      collection: 'case-studies',
      where: { status: { equals: 'published' } },
      depth: 1,
      limit: 0,
    });
  },
  ['case-studies'],
  { tags: ['case-studies'], revalidate: 3600 },
  null,
  'getCaseStudies',
);

/** Case studies linked to a partner. Prefers the `partner` FK (added in
 *  20260527 polish migration) and falls back to a `client` name string
 *  match for case studies authored before the FK existed. Caller passes
 *  both so the helper can do a single OR query — used by the partner
 *  micro-site at /with/[partner-slug]. */
export const getCaseStudiesForPartner = cachedSafe(
  async (partnerId: string | number, partnerName: string) => {
    if (!partnerId && !partnerName) return [];
    const payload = await getPayloadClient();
    const conditions: Where[] = [];
    if (partnerId) conditions.push({ partner: { equals: partnerId } });
    if (partnerName) conditions.push({ client: { equals: partnerName } });
    const { docs } = await payload.find({
      collection: 'case-studies',
      where: {
        and: [
          { or: conditions },
          { status: { equals: 'published' } },
        ],
      },
      limit: 12,
      depth: 1,
    });
    return docs;
  },
  ['case-studies-for-partner'],
  { tags: ['case-studies'], revalidate: 3600 },
  [],
  'getCaseStudiesForPartner',
);

/** Legacy: case studies where `client` (text) matches a partner name.
 *  Retained for any caller still on the pre-FK API; new callers should
 *  use getCaseStudiesForPartner. */
export const getCaseStudiesByClient = cachedSafe(
  async (clientName: string) => {
    if (!clientName) return [];
    const payload = await getPayloadClient();
    const { docs } = await payload.find({
      collection: 'case-studies',
      where: {
        and: [
          { client: { equals: clientName } },
          { status: { equals: 'published' } },
        ],
      },
      limit: 12,
      depth: 1,
    });
    return docs;
  },
  ['case-studies-by-client'],
  { tags: ['case-studies'], revalidate: 3600 },
  [],
  'getCaseStudiesByClient',
);

/** Single case study by slug — for /case-studies/[slug]. */
export const getCaseStudyBySlug = cachedSafe(
  async (slug: string) => {
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
  },
  ['case-study-by-slug'],
  { tags: ['case-studies'], revalidate: 3600 },
  null,
  'getCaseStudyBySlug',
);

/** Every published case-study slug — for generateStaticParams. */
export const getCaseStudySlugs = cachedSafe(
  async (): Promise<string[]> => {
    const payload = await getPayloadClient();
    const { docs } = await payload.find({
      collection: 'case-studies',
      where: { status: { equals: 'published' } },
      limit: 0,
      depth: 0,
    });
    return docs.map((d) => String(d.slug)).filter(Boolean);
  },
  ['case-study-slugs'],
  { tags: ['case-studies'], revalidate: 3600 },
  [],
  'getCaseStudySlugs',
);

// ── Testimonials ──────────────────────────────────────────────────────────────

export const getTestimonials = cachedSafe(
  async (featuredOnly: boolean = false) => {
    const payload = await getPayloadClient();
    return await payload.find({
      collection: 'testimonials',
      where: featuredOnly ? { featured: { equals: true } } : {},
      depth: 1,
      limit: 0,
    });
  },
  ['testimonials'],
  { tags: ['testimonials'], revalidate: 3600 },
  null,
  'getTestimonials',
);

// ── FAQs ──────────────────────────────────────────────────────────────────────

export const getFAQs = cachedSafe(
  async (category?: string) => {
    const payload = await getPayloadClient();
    return await payload.find({
      collection: 'faqs',
      where: category ? { category: { equals: category } } : {},
      sort: 'order',
      depth: 0,
      limit: 0,
    });
  },
  ['faqs'],
  { tags: ['faqs'], revalidate: 3600 },
  null,
  'getFAQs',
);

// ── Team Members ──────────────────────────────────────────────────────────────

export const getTeamMembers = cachedSafe(
  async () => {
    const payload = await getPayloadClient();
    return await payload.find({
      collection: 'team-members',
      sort: 'order',
      depth: 1,
      limit: 0,
    });
  },
  ['team-members'],
  { tags: ['team-members'], revalidate: 3600 },
  null,
  'getTeamMembers',
);

// ── Logos ─────────────────────────────────────────────────────────────────────

export const getLogos = cachedSafe(
  async () => {
    const payload = await getPayloadClient();
    return await payload.find({
      collection: 'logos',
      sort: 'order',
      depth: 1,
      limit: 0,
    });
  },
  ['logos'],
  { tags: ['logos'], revalidate: 3600 },
  null,
  'getLogos',
);

// ── Globals ───────────────────────────────────────────────────────────────────

export const getSiteSettings = cachedSafe(
  async () => {
    const payload = await getPayloadClient();
    return await payload.findGlobal({ slug: 'site-settings', depth: 0 });
  },
  ['site-settings'],
  { tags: ['site-settings'], revalidate: 3600 },
  null,
  'getSiteSettings',
);

export const getNavigation = cachedSafe(
  async () => {
    const payload = await getPayloadClient();
    return await payload.findGlobal({ slug: 'navigation', depth: 0 });
  },
  ['navigation'],
  { tags: ['navigation'], revalidate: 3600 },
  null,
  'getNavigation',
);

export const getAnnouncementBar = cachedSafe(
  async () => {
    const payload = await getPayloadClient();
    return await payload.findGlobal({ slug: 'announcement-bar', depth: 0 });
  },
  ['announcement-bar'],
  { tags: ['announcement-bar'], revalidate: 3600 },
  null,
  'getAnnouncementBar',
);

// ── Partners ──────────────────────────────────────────────────────────────────

export const getPartners = cachedSafe(
  async () => {
    const payload = await getPayloadClient();
    return await payload.find({
      collection: 'partners',
      where: { status: { equals: 'published' } },
      sort: 'order',
      depth: 1,
      limit: 0,
    });
  },
  ['partners'],
  { tags: ['partners'], revalidate: 3600 },
  null,
  'getPartners',
);

/** Single partner by slug — for /partners/[slug] deep pages. */
export const getPartnerBySlug = cachedSafe(
  async (slug: string) => {
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
  },
  ['partner-by-slug'],
  { tags: ['partners'], revalidate: 3600 },
  null,
  'getPartnerBySlug',
);

/** Every published partner slug — used by generateStaticParams. */
export const getPartnerSlugs = cachedSafe(
  async (): Promise<string[]> => {
    const payload = await getPayloadClient();
    const { docs } = await payload.find({
      collection: 'partners',
      where: { status: { equals: 'published' } },
      limit: 0,
      depth: 0,
    });
    return docs.map((d) => String((d as { slug?: string }).slug ?? '')).filter(Boolean);
  },
  ['partner-slugs'],
  { tags: ['partners'], revalidate: 3600 },
  [],
  'getPartnerSlugs',
);

export const getPartnersPage = cachedSafe(
  async () => {
    const payload = await getPayloadClient();
    return await payload.findGlobal({ slug: 'partners-page', depth: 0 });
  },
  ['partners-page'],
  { tags: ['partners-page'], revalidate: 3600 },
  null,
  'getPartnersPage',
);

// ── Events ────────────────────────────────────────────────────────────────────

/** All events on or after today's Canberra date, sorted by date ascending.
 *  Canberra midnight, not the server's (UTC on Vercel), so an event keeps its
 *  booking link for the whole of its day in Canberra. */
export const getUpcomingEvents = cachedSafe(
  async (limit: number = 50) => {
    const payload = await getPayloadClient();
    const today = canberraStartOfDay(canberraDateKey(new Date()));
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
  [],
  'getUpcomingEvents',
);

/** All past events (date < today), most recent first. Used by the
 *  public /events "From the archive" section so adding a past event
 *  is an editor task in Payload rather than a code change. */
export const getPastEvents = cachedSafe(
  async (limit: number = 6) => {
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
  },
  ['events-past-public'],
  { tags: ['events'], revalidate: 3600 },
  [],
  'getPastEvents',
);

/** Every event, including past — for the public /events hub. */
export const getPublicEvents = cachedSafe(
  async (limit: number = 100) => {
    const payload = await getPayloadClient();
    const { docs } = await payload.find({
      collection: 'events',
      sort: ['-featured', 'date'],
      limit,
      depth: 0,
    });
    return docs;
  },
  ['events-public-all'],
  { tags: ['events'], revalidate: 3600 },
  [],
  'getPublicEvents',
);

/** Single event by slug — for the public /events/[slug] detail page.
 *  Uses depth=1 so the `host` and `partners` relationships return as full
 *  objects (name, slug, shape, category) for the partner lock-up render. */
export const getEventBySlug = cachedSafe(
  async (slug: string) => {
    const payload = await getPayloadClient();
    const { docs } = await payload.find({
      collection: 'events',
      where: { slug: { equals: slug } },
      limit: 1,
      depth: 1,
    });
    return docs[0] ?? null;
  },
  ['event-by-slug'],
  { tags: ['events'], revalidate: 3600 },
  null,
  'getEventBySlug',
);

/** Upcoming events where the given partner is the `host` or appears in
 *  `partners[]`. Powers the "Upcoming with us" section on /partners/[slug]. */
export const getEventsForPartner = cachedSafe(
  async (partnerId: string | number, limit: number = 6) => {
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
  },
  ['events-for-partner'],
  { tags: ['events', 'partners'], revalidate: 3600 },
  [],
  'getEventsForPartner',
);

/** Every published event slug — for generateStaticParams. Excludes bespoke. */
export const getGenericEventSlugs = cachedSafe(
  async (): Promise<string[]> => {
    const payload = await getPayloadClient();
    const { docs } = await payload.find({
      collection: 'events',
      where: { bespoke: { not_equals: true } },
      limit: 0,
      depth: 0,
    });
    return docs.map((d) => String(d.slug)).filter(Boolean);
  },
  ['events-generic-slugs'],
  { tags: ['events'], revalidate: 3600 },
  [],
  'getGenericEventSlugs',
);
