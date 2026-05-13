import type { CollectionConfig } from 'payload';
import { revalidate } from '../lib/cms/revalidate.ts';

export const Partners: CollectionConfig = {
  slug: 'partners',
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'type', 'featured', 'status', 'order'],
    group: 'Content',
  },
  fields: [
    {
      name: 'name',
      type: 'text',
      required: true,
    },
    {
      name: 'type',
      type: 'select',
      required: true,
      options: [
        { label: 'Technology', value: 'technology' },
        { label: 'Community', value: 'community' },
        { label: 'Enterprise', value: 'enterprise' },
        { label: 'Funding', value: 'funding' },
        { label: 'Media', value: 'media' },
      ],
      admin: { description: 'Used for directory filter chips' },
    },
    {
      name: 'description',
      type: 'textarea',
      admin: { description: 'Short description shown in the directory card' },
    },
    {
      name: 'website',
      type: 'text',
      admin: { description: 'Full URL including https://' },
    },
    {
      name: 'contactName',
      type: 'text',
      admin: { description: 'Primary contact person (optional)' },
    },
    {
      name: 'contactEmail',
      type: 'email',
    },
    {
      name: 'contactPhone',
      type: 'text',
    },
    {
      name: 'logo',
      type: 'upload',
      relationTo: 'media',
      admin: { description: 'Optional logo image (square or landscape, min 200px wide)' },
    },
    {
      name: 'featured',
      type: 'checkbox',
      defaultValue: false,
      admin: { description: 'Show in the Featured Partners wall at the top of the /partners page' },
    },
    {
      name: 'order',
      type: 'number',
      defaultValue: 0,
      admin: { description: 'Lower numbers appear first' },
    },
    {
      name: 'status',
      type: 'select',
      options: ['draft', 'published'],
      defaultValue: 'draft',
      required: true,
    },
  ],
  hooks: {
    afterChange: [async () => { await revalidate('partners'); }],
    afterDelete: [async () => { await revalidate('partners'); }],
  },
};
