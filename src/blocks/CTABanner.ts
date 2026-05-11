import type { Block } from 'payload';

export const CTABanner: Block = {
  slug: 'cta-banner',
  labels: { singular: 'CTA Banner', plural: 'CTA Banners' },
  fields: [
    { name: 'heading', type: 'text', required: true },
    { name: 'subheading', type: 'text' },
    { name: 'ctaLabel', type: 'text', required: true },
    { name: 'ctaHref', type: 'text', required: true },
    { name: 'secondaryCtaLabel', type: 'text' },
    { name: 'secondaryCtaHref', type: 'text' },
    {
      name: 'variant',
      type: 'select',
      options: ['teal', 'plum', 'lime'],
      defaultValue: 'teal',
    },
  ],
};
