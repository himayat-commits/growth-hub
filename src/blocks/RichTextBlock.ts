import type { Block } from 'payload';

export const RichTextBlock: Block = {
  slug: 'rich-text',
  labels: { singular: 'Rich Text', plural: 'Rich Text Sections' },
  fields: [
    { name: 'content', type: 'richText', required: true },
    {
      name: 'maxWidth',
      type: 'select',
      options: ['narrow', 'normal', 'wide'],
      defaultValue: 'normal',
    },
  ],
};
