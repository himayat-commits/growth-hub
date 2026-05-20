import type { CollectionConfig } from 'payload';
import { revalidate } from '../lib/cms/revalidate.ts';

/**
 * Consultancy services we sell — Growth Calls, website builds, marketing
 * coaching, etc. These are distinct from the Birdeye platform modules
 * (which are tier-gated software features). Surfaced on the "Services" tab
 * of /(app)/services.
 *
 * Each service has a slug used as the URL for the per-service detail page
 * (Phase 7 wires the booking form; Phase 4 ships a mailto stub).
 */
export const Services: CollectionConfig = {
  slug: 'services',
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'category', 'price', 'active', 'sortOrder'],
    description:
      'Consultancy + done-with-you services. Use sortOrder to control card order; lower numbers first.',
  },
  fields: [
    {
      name: 'title',
      type: 'text',
      required: true,
    },
    {
      name: 'slug',
      type: 'text',
      required: true,
      unique: true,
      admin: {
        description:
          'Used for the /services/[slug] URL. Keep it kebab-case (e.g. "growth-call", "website-setup").',
      },
    },
    {
      name: 'description',
      type: 'textarea',
      required: true,
      admin: {
        description: 'Two or three sentences. Renders below the title on the card.',
      },
    },
    {
      name: 'category',
      type: 'select',
      defaultValue: 'strategy',
      options: [
        { label: 'Strategy', value: 'strategy' },
        { label: 'Build & launch', value: 'build' },
        { label: 'Marketing', value: 'marketing' },
        { label: 'Ops & systems', value: 'ops' },
      ],
    },
    {
      name: 'tone',
      type: 'select',
      defaultValue: 'teal',
      options: [
        { label: 'Lime', value: 'lime' },
        { label: 'Teal', value: 'teal' },
        { label: 'Plum', value: 'plum' },
        { label: 'Lavender', value: 'lav' },
      ],
      admin: { description: 'Icon background colour on the card.' },
    },
    {
      name: 'icon',
      type: 'select',
      defaultValue: 'briefcase',
      options: [
        { label: 'Calendar (Growth Call)', value: 'cal' },
        { label: 'Globe (Website)', value: 'globe' },
        { label: 'Megaphone (Marketing)', value: 'megaphone' },
        { label: 'Type (Branding)', value: 'type' },
        { label: 'Trend (SEO)', value: 'trend' },
        { label: 'Share (Social)', value: 'share' },
        { label: 'Briefcase (Other)', value: 'briefcase' },
      ],
    },
    {
      name: 'price',
      type: 'text',
      admin: {
        description:
          'Display price, e.g. "A$390 / mo" or "From A$1,950" or "Complimentary". Leave blank if pricing is bespoke.',
      },
    },
    {
      name: 'priceLabel',
      type: 'text',
      admin: {
        description:
          'Tiny label under the price, e.g. "first call free", "fixed project fee", "month-to-month".',
      },
    },
    {
      name: 'ctaLabel',
      type: 'text',
      defaultValue: 'Request',
      admin: { description: 'Card button text. "Book a time" for the Growth Call, "Request" otherwise.' },
    },
    {
      name: 'active',
      type: 'checkbox',
      defaultValue: true,
      admin: { description: 'Uncheck to hide from /services without deleting the row.' },
    },
    {
      name: 'sortOrder',
      type: 'number',
      defaultValue: 0,
      admin: { description: 'Lower numbers appear first. Growth Call is usually 0.' },
    },
  ],
  hooks: {
    afterChange: [async () => { await revalidate('services'); }],
    afterDelete: [async () => { await revalidate('services'); }],
  },
};
