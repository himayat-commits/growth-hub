import type { Block } from 'payload';

export const HowItWorksBlock: Block = {
  slug: 'how-it-works',
  labels: { singular: 'How It Works', plural: 'How It Works Sections' },
  fields: [
    { name: 'heading', type: 'text' },
    {
      name: 'steps',
      type: 'array',
      required: true,
      fields: [
        { name: 'title', type: 'text', required: true },
        { name: 'description', type: 'text', required: true },
      ],
    },
    {
      name: 'sectionImage',
      type: 'upload',
      relationTo: 'media',
      admin: { description: 'Photo shown on the right side of the section' },
    },
    {
      name: 'imageBadge',
      type: 'text',
      admin: { description: 'Badge text overlaid on the image, e.g. "Live events + webinars"' },
    },
  ],
};
