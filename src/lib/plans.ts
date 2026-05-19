/**
 * Plan + add-on configuration. Single source of truth for what the app
 * shows on the pricing page and how price IDs map back to plans.
 */

export type PlanTier = 'free' | 'foundations' | 'growth' | 'accelerate';
/** Tiers that have a real Stripe subscription. `free` is excluded. */
export type PaidPlanTier = Exclude<PlanTier, 'free'>;
export type BillingInterval = 'month' | 'year';
export type AddOnId = 'search_ai' | 'referrals';

export interface PlanConfig {
  id: PlanTier;
  name: string;
  tagline: string;
  description: string;
  monthlyPrice: number; // dollars (AUD)
  features: string[];
  addOnNote: string | null;
  highlight?: boolean;
}

export const PLANS: Record<PlanTier, PlanConfig> = {
  free: {
    id: 'free',
    name: 'Free Member',
    tagline: 'Get started — no card needed.',
    description:
      'Community access, the public resource library, and one complimentary 30-minute Growth Call.',
    monthlyPrice: 0,
    features: [
      'Public resource library',
      'Community forum access',
      '1 free Growth Call (30 min)',
      'Weekly group webinars',
      'Member-only discounts',
    ],
    addOnNote: null,
  },
  foundations: {
    id: 'foundations',
    name: 'Foundations',
    tagline: 'Get online. Get noticed.',
    description: 'The essential digital presence for businesses building their online footprint.',
    monthlyPrice: 299,
    features: [
      'Invoicing',
      'Social AI: content creation & scheduling',
      'Listing AI: 50+ directory management',
      'Messaging: unified inbox for all channels',
      'Community + weekly webinars included',
    ],
    addOnNote: null,
  },
  growth: {
    id: 'growth',
    name: 'Growth',
    tagline: 'Build trust. Build reputation.',
    description: 'The reputation engine for businesses ready to grow through trust.',
    monthlyPrice: 499,
    features: [
      'Everything in Foundations',
      'Timesheets & Docketing',
      'Reviews AI: automated generation & responses',
      'Review Collateral Kit: QR cards, badges, templates',
    ],
    addOnNote: '+ Add Search AI from $99/mo',
    highlight: true,
  },
  accelerate: {
    id: 'accelerate',
    name: 'Accelerate',
    tagline: 'Convert visitors into customers.',
    description: 'The full conversion engine for turning visibility into revenue.',
    monthlyPrice: 799,
    features: [
      'Everything in Growth',
      'Scheduling + Rostering',
      'Webchat AI (Robin): 24/7 lead capture',
      'Campaign Templates: SMS & email automation',
    ],
    addOnNote: '+ Add Referrals from $175/mo',
  },
};

export interface AddOnConfig {
  id: AddOnId;
  name: string;
  monthlyPrice: number;
  /** Plans this add-on can be combined with. */
  availableFor: PlanTier[];
}

export const ADDONS: Record<AddOnId, AddOnConfig> = {
  search_ai: {
    id: 'search_ai',
    name: 'Search AI',
    monthlyPrice: 99,
    availableFor: ['growth', 'accelerate'],
  },
  referrals: {
    id: 'referrals',
    name: 'Referrals',
    monthlyPrice: 175,
    availableFor: ['accelerate'],
  },
};

/**
 * Resolve the Stripe Price ID for a plan + interval combination.
 * Reads from env vars at call time so dev / preview / prod each see
 * their own values.
 */
export function getPlanPriceId(tier: PaidPlanTier, interval: BillingInterval): string {
  const map: Record<PaidPlanTier, Record<BillingInterval, string | undefined>> = {
    foundations: {
      month: process.env.STRIPE_PRICE_FOUNDATIONS_MONTHLY,
      year: process.env.STRIPE_PRICE_FOUNDATIONS_YEARLY,
    },
    growth: {
      month: process.env.STRIPE_PRICE_GROWTH_MONTHLY,
      year: process.env.STRIPE_PRICE_GROWTH_YEARLY,
    },
    accelerate: {
      month: process.env.STRIPE_PRICE_ACCELERATE_MONTHLY,
      year: process.env.STRIPE_PRICE_ACCELERATE_YEARLY,
    },
  };
  const id = map[tier]?.[interval];
  if (!id) {
    throw new Error(`No Stripe Price ID configured for ${tier} ${interval}`);
  }
  return id;
}

export function getAddOnPriceId(addOn: AddOnId): string {
  const map: Record<AddOnId, string | undefined> = {
    search_ai: process.env.STRIPE_PRICE_SEARCH_AI_MONTHLY,
    referrals: process.env.STRIPE_PRICE_REFERRALS_MONTHLY,
  };
  const id = map[addOn];
  if (!id) {
    throw new Error(`No Stripe Price ID configured for add-on ${addOn}`);
  }
  return id;
}

/**
 * Reverse lookup — given a Stripe Price ID, figure out which plan/interval it
 * is. Used by the webhook handler to denormalize the subscription state into
 * our DB.
 */
export function priceIdToPlan(
  priceId: string
): { tier: PaidPlanTier; interval: BillingInterval } | null {
  const entries: Array<[string | undefined, PaidPlanTier, BillingInterval]> = [
    [process.env.STRIPE_PRICE_FOUNDATIONS_MONTHLY, 'foundations', 'month'],
    [process.env.STRIPE_PRICE_FOUNDATIONS_YEARLY, 'foundations', 'year'],
    [process.env.STRIPE_PRICE_GROWTH_MONTHLY, 'growth', 'month'],
    [process.env.STRIPE_PRICE_GROWTH_YEARLY, 'growth', 'year'],
    [process.env.STRIPE_PRICE_ACCELERATE_MONTHLY, 'accelerate', 'month'],
    [process.env.STRIPE_PRICE_ACCELERATE_YEARLY, 'accelerate', 'year'],
  ];
  for (const [envPriceId, tier, interval] of entries) {
    if (envPriceId && envPriceId === priceId) return { tier, interval };
  }
  return null;
}

/**
 * Annual is exactly 10x monthly (i.e. 2 months free). Keep the displayed
 * amount in sync with the actual Stripe annual Price.
 */
export function calculateDisplayPrice(
  monthlyPrice: number,
  interval: BillingInterval
): { amount: number; period: string } {
  if (interval === 'year') {
    return { amount: monthlyPrice * 10, period: '/year' };
  }
  return { amount: monthlyPrice, period: '/month' };
}
