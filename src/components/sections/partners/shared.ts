// Shared types + helpers for the /partners page sections.

/** Categories used in the directory filter chips. Six values matching the
 *  Partners Standalone mockup (May 2026). Legacy values from the previous
 *  iteration (`enterprise`, `media`, `funding` etc.) are mapped onto these
 *  via legacyCategoryFallback() so existing Payload records don't break. */
export const PARTNER_CATEGORIES = [
  'technology',
  'creative-media',
  'community-delivery',
  'industry-government',
  'accelerator-capital',
  'research-education',
] as const;

export type PartnerCategory = (typeof PARTNER_CATEGORIES)[number];

export const CATEGORY_LABELS: Record<PartnerCategory, string> = {
  technology: 'Technology',
  'creative-media': 'Creative & Media',
  'community-delivery': 'Community & Delivery',
  'industry-government': 'Industry & Government',
  'accelerator-capital': 'Accelerator & Capital',
  'research-education': 'Research & Education',
};

/** Order the filter chips render in (matches the standalone mockup). */
export const CATEGORY_ORDER: PartnerCategory[] = [...PARTNER_CATEGORIES];

/** Bridge for older Payload `type` field values to the new category set.
 *  We keep both readable so backfill is a manual one-time edit per row. */
export function legacyCategoryFallback(legacy: string | null | undefined): PartnerCategory | null {
  if (!legacy) return null;
  switch (legacy) {
    case 'technology':
      return 'technology';
    case 'media':
      return 'creative-media';
    case 'community':
      return 'community-delivery';
    case 'enterprise':
      return 'accelerator-capital';
    case 'funding':
      return 'industry-government';
  }
  if ((PARTNER_CATEGORIES as readonly string[]).includes(legacy)) {
    return legacy as PartnerCategory;
  }
  return null;
}

/** Abstract mono glyph shapes for the partner mark. Each renders as a
 *  small SVG inside .fw-mark / .p-card-mark to give visual variety
 *  without depending on real partner logos. */
export const PARTNER_SHAPES = [
  'leaf',
  'arc',
  'diamond',
  'circle',
  'triangle',
  'bars',
  'cross',
  'hex',
] as const;

export type PartnerShape = (typeof PARTNER_SHAPES)[number];

/** Pick a default shape based on category — gives a sensible look when a
 *  partner record has no explicit shape set. */
export function defaultShapeForCategory(cat: PartnerCategory | null): PartnerShape {
  switch (cat) {
    case 'technology':
      return 'circle';
    case 'creative-media':
      return 'triangle';
    case 'community-delivery':
      return 'leaf';
    case 'industry-government':
      return 'diamond';
    case 'accelerator-capital':
      return 'hex';
    case 'research-education':
      return 'cross';
    default:
      return 'circle';
  }
}

/** Legacy alias kept so existing imports of `PartnerType` from this module
 *  continue to compile. New code should use `PartnerCategory`. */
export type PartnerType =
  | 'technology'
  | 'community'
  | 'enterprise'
  | 'funding'
  | 'media';
