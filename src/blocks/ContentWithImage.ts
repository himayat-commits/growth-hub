import type { Block } from 'payload';

export const ContentWithImage: Block = {
  slug: 'content-with-image',
  labels: { singular: 'Content with Image', plural: 'Content with Image Sections' },
  fields: [
    { name: 'heading', type: 'text' },
    { name: 'body', type: 'richText' },
    { name: 'image', type: 'upload', relationTo: 'media' },
    {
      name: 'imagePosition',
      type: 'select',
      options: ['left', 'right'],
      defaultValue: 'right',
    },
    { name: 'ctaLabel', type: 'text' },
    { name: 'ctaHref', type: 'text' },
  ],
};
