import type { Block } from 'payload';

export const FAQBlock: Block = {
  slug: 'faq',
  labels: { singular: 'FAQ', plural: 'FAQ Sections' },
  fields: [
    { name: 'heading', type: 'text' },
    {
      name: 'faqs',
      type: 'relationship',
      relationTo: 'faqs',
      hasMany: true,
    },
    {
      name: 'category',
      type: 'select',
      options: ['all', 'general', 'billing', 'features', 'technical'],
      defaultValue: 'all',
      admin: { description: 'Filter FAQs by category, or show all.' },
    },
  ],
};
