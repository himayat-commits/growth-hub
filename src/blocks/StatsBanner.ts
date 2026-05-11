import type { Block } from 'payload';

export const StatsBanner: Block = {
  slug: 'stats-banner',
  labels: { singular: 'Stats Banner', plural: 'Stats Banners' },
  fields: [
    { name: 'heading', type: 'text' },
    {
      name: 'stats',
      type: 'array',
      fields: [
        {
          name: 'value',
          type: 'text',
          required: true,
          admin: { description: 'e.g. "500+" or "3×".' },
        },
        { name: 'label', type: 'text', required: true },
        { name: 'description', type: 'text' },
      ],
    },
  ],
};
