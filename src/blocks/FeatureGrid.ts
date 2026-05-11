import type { Block } from 'payload';

export const FeatureGrid: Block = {
  slug: 'feature-grid',
  labels: { singular: 'Feature Grid', plural: 'Feature Grids' },
  fields: [
    { name: 'heading', type: 'text' },
    { name: 'subheading', type: 'text' },
    {
      name: 'features',
      type: 'array',
      fields: [
        { name: 'icon', type: 'text', admin: { description: 'Icon name or SVG path.' } },
        { name: 'title', type: 'text', required: true },
        { name: 'description', type: 'textarea' },
      ],
    },
    {
      name: 'columns',
      type: 'select',
      options: ['2', '3', '4'],
      defaultValue: '3',
    },
  ],
};
