import type { Block } from 'payload';

export const TestimonialsBlock: Block = {
  slug: 'testimonials',
  labels: { singular: 'Testimonials', plural: 'Testimonials Sections' },
  fields: [
    { name: 'heading', type: 'text' },
    {
      name: 'testimonials',
      type: 'relationship',
      relationTo: 'testimonials',
      hasMany: true,
    },
    {
      name: 'layout',
      type: 'select',
      options: ['grid', 'carousel'],
      defaultValue: 'grid',
    },
  ],
};
