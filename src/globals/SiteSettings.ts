import type { GlobalConfig } from 'payload';
import { revalidate } from '../lib/cms/revalidate.ts';

export const SiteSettings: GlobalConfig = {
  slug: 'site-settings',
  admin: { group: 'Site' },
  fields: [
    {
      name: 'siteName',
      type: 'text',
      required: true,
      defaultValue: 'Growth Hub by Himayat',
    },
    {
      name: 'tagline',
      type: 'text',
    },
    {
      name: 'supportEmail',
      type: 'email',
      defaultValue: 'hello@himayat.com.au',
    },
    {
      name: 'phone',
      type: 'text',
      admin: { description: 'Display phone number, e.g. "02 5119 0005"' },
    },
    {
      name: 'address',
      type: 'text',
      admin: { description: 'Display address, e.g. "Level 4, 1 Moore St, Canberra ACT 2601"' },
    },
    {
      name: 'socialLinks',
      type: 'group',
      fields: [
        { name: 'facebook', type: 'text' },
        { name: 'instagram', type: 'text' },
        { name: 'linkedin', type: 'text' },
        { name: 'twitter', type: 'text' },
      ],
    },
  ],
  hooks: {
    afterChange: [async () => { await revalidate('site-settings'); }],
  },
};
