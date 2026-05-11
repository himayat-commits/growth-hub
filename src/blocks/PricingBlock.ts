import type { Block } from 'payload';

export const PricingBlock: Block = {
  slug: 'pricing',
  labels: { singular: 'Pricing', plural: 'Pricing Sections' },
  fields: [
    { name: 'heading', type: 'text' },
    { name: 'subheading', type: 'text' },
    {
      name: 'showToggle',
      type: 'checkbox',
      defaultValue: true,
      admin: { description: 'Show monthly/annual billing toggle.' },
    },
  ],
};
