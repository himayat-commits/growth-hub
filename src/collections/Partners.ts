import type { CollectionConfig } from 'payload';
import { revalidate } from '../lib/cms/revalidate.ts';

export const Partners: CollectionConfig = {
  slug: 'partners',
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'category', 'featured', 'status', 'order'],
    group: 'Content',
  },
  fields: [
    {
      name: 'name',
      type: 'text',
      required: true,
    },
    {
      // Renamed from 'type' to 'category' to match the partners-page directory
      // filter chips. Legacy `type` values (technology / community / enterprise
      // / funding / media) are migrated by the SQL migration that adds this
      // column — see drizzle migration history.
      name: 'category',
      type: 'select',
      required: true,
      options: [
        { label: 'Technology', value: 'technology' },
        { label: 'Creative & Media', value: 'creative-media' },
        { label: 'Community & Delivery', value: 'community-delivery' },
        { label: 'Industry & Government', value: 'industry-government' },
        { label: 'Accelerator & Capital', value: 'accelerator-capital' },
        { label: 'Research & Education', value: 'research-education' },
      ],
      admin: { description: 'Used for directory filter chips and grouping' },
    },
    {
      name: 'shape',
      type: 'select',
      options: [
        { label: 'Circle', value: 'circle' },
        { label: 'Diamond', value: 'diamond' },
        { label: 'Triangle', value: 'triangle' },
        { label: 'Leaf', value: 'leaf' },
        { label: 'Hexagon', value: 'hex' },
        { label: 'Arc', value: 'arc' },
        { label: 'Bars', value: 'bars' },
        { label: 'Cross', value: 'cross' },
      ],
      admin: {
        description:
          'Abstract mono glyph used as a placeholder partner mark. Leave blank to use a sensible default by category.',
      },
    },
    {
      name: 'description',
      type: 'textarea',
      admin: { description: 'Short description shown in the directory card' },
    },
    {
      name: 'region',
      type: 'text',
      admin: { description: 'e.g. "Canberra", "ACT", "Sydney", "ACT · Global"' },
    },
    {
      name: 'since',
      type: 'text',
      admin: { description: 'Year the partnership began, e.g. "2023" or "2024"' },
    },
    {
      name: 'contribution',
      type: 'textarea',
      admin: {
        description:
          'What this partner brings — e.g. "Reviews automation · AI customer messaging · listing management". Rendered under "What they bring" on the directory card.',
      },
    },
    {
      name: 'howWeWork',
      type: 'textarea',
      admin: {
        description:
          'How we collaborate — e.g. "Bundled into client subscriptions; we configure and support locally." Rendered under "How we work together".',
      },
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
