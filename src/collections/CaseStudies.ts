import type { CollectionConfig } from 'payload';
import { revalidate } from '../lib/cms/revalidate.ts';

export const CaseStudies: CollectionConfig = {
  slug: 'case-studies',
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'client', 'status'],
    preview: (doc) =>
      `${process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'}/case-studies/${doc.slug}`,
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
      name: 'client',
      type: 'text',
      required: true,
    },
    {
      name: 'partner',
      type: 'relationship',
      relationTo: 'partners',
      hasMany: false,
      admin: {
        description:
          'Optional. Link to the partner this case study is built with. Surfaces the case study on /with/{partner-slug} and /partners/{partner-slug}. When set, /with/{slug} prefers this over the legacy client-name string match.',
      },
    },
    {
      name: 'outcome',
      type: 'text',
      admin: {
        description: 'One-line result summary, e.g. "3× organic traffic in 6 months".',
      },
    },
    {
      name: 'body',
      type: 'richText',
      required: true,
    },
    {
      name: 'image',
      type: 'upload',
      relationTo: 'media',
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
    afterChange: [async () => { await revalidate('case-studies'); }],
    afterDelete: [async () => { await revalidate('case-studies'); }],
  },
};
