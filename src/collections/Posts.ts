import type { CollectionConfig } from 'payload';
import { revalidate } from '../lib/cms/revalidate.ts';

export const Posts: CollectionConfig = {
  slug: 'posts',
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'publishedAt', 'status'],
    preview: (doc) =>
      `${process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'}/blog/${doc.slug}`,
  },
  versions: {
    drafts: { autosave: true },
  },
  fields: [
    {
      name: 'title',
      type: 'text',
      required: true,
    },
    {
      name: 'slug',
      type: 'text',
      required: true,
      unique: true,
    },
    {
      name: 'publishedAt',
      type: 'date',
      admin: {
        date: { pickerAppearance: 'dayAndTime' },
      },
    },
    {
      name: 'content',
      type: 'richText',
      required: true,
    },
    {
      name: 'excerpt',
      type: 'textarea',
    },
    {
      name: 'coverImage',
      type: 'upload',
      relationTo: 'media',
    },
    {
      name: 'tags',
      type: 'array',
      fields: [{ name: 'tag', type: 'text' }],
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
    afterChange: [
      async ({ doc }) => {
        await revalidate('posts');
        if (doc.slug) await revalidate(`post-${doc.slug as string}`);
      },
    ],
    afterDelete: [
      async ({ doc }) => {
        await revalidate('posts');
        if (doc.slug) await revalidate(`post-${doc.slug as string}`);
      },
    ],
  },
};
