import type { CollectionConfig } from 'payload';
import { revalidate } from '../lib/cms/revalidate.ts';

/**
 * Resource library — guides, templates, courses, videos. Free for all
 * members; `free: false` items are gated behind a paid plan (display
 * "Member" badge instead of "Free", upgrade CTA on click).
 *
 * The /dashboard "Suggested first reads" surface reads featured=true.
 */
export const Resources: CollectionConfig = {
  slug: 'resources',
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'tag', 'free', 'featured', 'publishedAt'],
  },
  fields: [
    {
      name: 'title',
      type: 'text',
      required: true,
    },
    {
      name: 'tag',
      type: 'select',
      required: true,
      defaultValue: 'Guide',
      options: [
        { label: 'Guide', value: 'Guide' },
        { label: 'Template', value: 'Template' },
        { label: 'Course', value: 'Course' },
        { label: 'Video', value: 'Video' },
        { label: 'Webinar', value: 'Webinar' },
      ],
    },
    {
      name: 'tone',
      type: 'select',
      defaultValue: 'cream',
      options: [
        { label: 'Cream', value: 'cream' },
        { label: 'Lime', value: 'lime' },
        { label: 'Teal', value: 'teal' },
        { label: 'Plum', value: 'plum' },
        { label: 'Lavender', value: 'lav' },
      ],
      admin: {
        description: 'Card thumbnail colour. Try to spread tones across the grid for visual rhythm.',
      },
    },
    {
      name: 'meta',
      type: 'text',
      admin: {
        description: 'Short meta line, e.g. "5-min read" or "PDF · Editable" or "Self-paced · 2 hrs".',
      },
    },
    {
      name: 'thumbnail',
      type: 'upload',
      relationTo: 'media',
      admin: {
        description: 'Optional cover image. Falls back to a solid-colour thumbnail using `tone`.',
      },
    },
    {
      name: 'url',
      type: 'text',
      admin: {
        description: 'Where the card links to — a hosted PDF, external course, YouTube, etc.',
      },
    },
    {
      name: 'free',
      type: 'checkbox',
      defaultValue: true,
      admin: { description: 'Uncheck to gate behind a paid plan.' },
    },
    {
      name: 'publishedAt',
      type: 'date',
      admin: { date: { pickerAppearance: 'dayOnly' } },
    },
    {
      name: 'featured',
      type: 'checkbox',
      defaultValue: false,
      admin: {
        description:
          'Show in the dashboard "Suggested first reads" card. Aim for 3 featured at any time.',
      },
    },
  ],
  hooks: {
    afterChange: [async () => { await revalidate('resources'); }],
    afterDelete: [async () => { await revalidate('resources'); }],
  },
};
