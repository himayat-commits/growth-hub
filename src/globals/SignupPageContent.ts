/**
 * SignupPageContent global
 *
 * Stores per-tier signup page copy that editors can update without a redeploy.
 * Prices, Stripe price IDs, and HubSpot form IDs are NOT stored here — they
 * live in lib/plans.ts and environment variables.
 */
import type { GlobalConfig } from 'payload';
import { revalidate } from '../lib/cms/revalidate.ts';

function tierFields(label: string, defaults: {
  title: string;
  tagline: string;
  features: string[];
  addon?: string;
}) {
  return [
    {
      name: 'title',
      type: 'text' as const,
      defaultValue: defaults.title,
      admin: { description: `Main heading for the ${label} signup page` },
    },
    {
      name: 'tagline',
      type: 'text' as const,
      defaultValue: defaults.tagline,
      admin: { description: 'Subheading below the title' },
    },
    {
      name: 'features',
      type: 'array' as const,
      admin: { description: 'Feature list shown on the signup page' },
      fields: [
        { name: 'text', type: 'text' as const, required: true },
      ],
    },
    {
      name: 'addon',
      type: 'text' as const,
      admin: { description: 'Optional add-on upsell line (e.g. "Add Search AI from $99/mo")' },
    },
    {
      name: 'trustItems',
      type: 'array' as const,
      admin: { description: 'Trust badges / guarantees shown below the feature list' },
      fields: [
        { name: 'text', type: 'text' as const, required: true },
      ],
    },
  ];
}

export const SignupPageContent: GlobalConfig = {
  slug: 'signup-page-content',
  admin: { group: 'Site' },
  fields: [
    {
      name: 'foundations',
      type: 'group',
      label: 'Foundations Tier',
      fields: tierFields('Foundations', {
        title: 'Get online. Get noticed.',
        tagline: "You're a step away from a real team in your corner.",
        features: [
          'Invoicing',
          'Social AI: content creation & scheduling',
          'Listing AI: 50+ directory management',
          'Messaging: unified inbox for all channels',
          'Community + weekly webinars included',
        ],
      }),
    },
    {
      name: 'growth',
      type: 'group',
      label: 'Growth Tier',
      fields: tierFields('Growth', {
        title: 'Build trust. Build reputation.',
        tagline: "You're a step away from a real team in your corner.",
        features: [
          'Everything in Foundations',
          'Timesheets & Docketing',
          'Reviews AI: automated generation & responses',
          'Review Collateral Kit: QR cards, badges, templates',
        ],
        addon: 'Add Search AI from $99/mo',
      }),
    },
    {
      name: 'accelerate',
      type: 'group',
      label: 'Accelerate Tier',
      fields: tierFields('Accelerate', {
        title: 'Convert visitors into customers.',
        tagline: "You're a step away from a real team in your corner.",
        features: [
          'Everything in Growth',
          'Scheduling + Rostering',
          'Webchat AI (Robin): 24/7 lead capture',
          'Campaign Templates: SMS & email automation',
        ],
        addon: 'Add Referrals from $175/mo',
      }),
    },
  ],
  hooks: {
    afterChange: [async () => { await revalidate('signup-page-content'); }],
  },
};
