import type { Block } from 'payload';

export const AboutBlock: Block = {
  slug: 'about',
  labels: { singular: 'About Section', plural: 'About Sections' },
  fields: [
    { name: 'sectionLabel', type: 'text', defaultValue: 'About' },
    { name: 'heading', type: 'text', required: true },
    {
      name: 'subheading',
      type: 'text',
      admin: { description: 'Italic text appended to the heading (rendered in <em>)' },
    },
    {
      name: 'paragraphs',
      type: 'array',
      admin: { description: 'Body paragraphs shown in the left column' },
      fields: [{ name: 'text', type: 'textarea', required: true }],
    },
    {
      name: 'pullQuote',
      type: 'textarea',
      admin: { description: 'Blockquote highlighted below the body paragraphs' },
    },
    {
      name: 'stats',
      type: 'array',
      admin: { description: 'Stat cards shown in the right column' },
      fields: [
        { name: 'value', type: 'text', required: true, admin: { description: 'e.g. "400+" or "$400K"' } },
        { name: 'description', type: 'text', required: true },
        {
          name: 'tone',
          type: 'select',
          options: ['teal', 'lime', 'plain'],
          defaultValue: 'plain',
        },
      ],
    },
  ],
};
