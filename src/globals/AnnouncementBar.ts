import type { GlobalConfig } from 'payload';
import { revalidate } from '../lib/cms/revalidate.ts';

export const AnnouncementBar: GlobalConfig = {
  slug: 'announcement-bar',
  admin: { group: 'Site' },
  fields: [
    {
      name: 'enabled',
      type: 'checkbox',
      defaultValue: false,
    },
    {
      name: 'message',
      type: 'text',
    },
    {
      name: 'linkText',
      type: 'text',
    },
    {
      name: 'linkHref',
      type: 'text',
    },
    {
      name: 'bgColor',
      type: 'text',
      defaultValue: '#0D3F48',
      admin: { description: 'Hex colour code, e.g. #0D3F48.' },
    },
  ],
  hooks: {
    afterChange: [async () => { await revalidate('announcement-bar'); }],
  },
};
