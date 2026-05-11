import type { GlobalConfig } from 'payload';
import { revalidate } from '../lib/cms/revalidate.ts';

export const Navigation: GlobalConfig = {
  slug: 'navigation',
  admin: { group: 'Site' },
  fields: [
    {
      name: 'navItems',
      type: 'array',
      fields: [
        { name: 'label', type: 'text', required: true },
        { name: 'href', type: 'text', required: true },
        { name: 'isExternal', type: 'checkbox', defaultValue: false },
      ],
    },
    {
      name: 'ctaLabel',
      type: 'text',
      defaultValue: 'Sign Up Now',
    },
    {
      name: 'ctaHref',
      type: 'text',
      defaultValue: '/sign-up',
    },
  ],
  hooks: {
    afterChange: [async () => { await revalidate('navigation'); }],
  },
};
