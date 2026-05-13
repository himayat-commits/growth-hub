import type { Block } from 'payload';

export const HeroBlock: Block = {
  slug: 'hero',
  labels: { singular: 'Hero', plural: 'Heroes' },
  fields: [
    { name: 'heading', type: 'text', required: true },
    { name: 'subheading', type: 'text' },
    { name: 'ctaLabel', type: 'text' },
    { name: 'ctaHref', type: 'text' },
    { name: 'secondaryCtaLabel', type: 'text' },
    { name: 'secondaryCtaHref', type: 'text' },
    { name: 'backgroundImage', type: 'upload', relationTo: 'media' },
    {
      name: 'variant',
      type: 'select',
      options: ['centered', 'left-aligned', 'split'],
      defaultValue: 'centered',
    },
    {
      name: 'eyebrow',
      type: 'text',
      admin: { description: 'Badge text above the heading, e.g. "A Social Traders Verified Enterprise"' },
    },
    {
      name: 'handnote',
      type: 'text',
      admin: { description: 'Handscript tagline below heading, e.g. "Grow local. Grow together."' },
    },
    {
      name: 'chips',
      type: 'array',
      admin: { description: 'Info chips displayed below the CTA buttons' },
      fields: [{ name: 'text', type: 'text', required: true }],
    },
  ],
};
