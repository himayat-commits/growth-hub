import type { CollectionConfig } from 'payload';
import { revalidate } from '../lib/cms/revalidate.ts';

export const Logos: CollectionConfig = {
  slug: 'logos',
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'url', 'order'],
  },
  fields: [
    {
      name: 'name',
      type: 'text',
      required: true,
    },
    {
      name: 'image',
      type: 'relationship',
      relationTo: 'media',
      required: true,
    },
    {
      name: 'url',
      type: 'text',
      admin: {
        description: 'Optional link when the logo is clicked.',
      },
    },
    {
      name: 'order',
      type: 'number',
      defaultValue: 0,
    },
  ],
  hooks: {
    afterChange: [async () => { await revalidate('logos'); }],
    afterDelete: [async () => { await revalidate('logos'); }],
  },
};
