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
  ],
};
