import type { CollectionConfig } from 'payload';
import { revalidate } from '../lib/cms/revalidate.ts';

export const FAQs: CollectionConfig = {
  slug: 'faqs',
  admin: {
    useAsTitle: 'question',
    defaultColumns: ['question', 'category', 'order'],
  },
  fields: [
    {
      name: 'question',
      type: 'text',
      required: true,
    },
    {
      name: 'answer',
      type: 'richText',
      required: true,
    },
    {
      name: 'category',
      type: 'select',
      options: ['general', 'billing', 'features', 'technical'],
      defaultValue: 'general',
    },
    {
      name: 'order',
      type: 'number',
      defaultValue: 0,
    },
  ],
  hooks: {
    afterChange: [async () => { await revalidate('faqs'); }],
    afterDelete: [async () => { await revalidate('faqs'); }],
  },
};
