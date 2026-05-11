import type { Block } from 'payload';

export const LogoStrip: Block = {
  slug: 'logo-strip',
  labels: { singular: 'Logo Strip', plural: 'Logo Strips' },
  fields: [
    { name: 'heading', type: 'text' },
    {
      name: 'logos',
      type: 'relationship',
      relationTo: 'logos',
      hasMany: true,
    },
    {
      name: 'autoScroll',
      type: 'checkbox',
      defaultValue: false,
    },
  ],
};
