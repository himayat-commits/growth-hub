import type { CollectionConfig } from 'payload';
import { revalidate } from '../lib/cms/revalidate.ts';

function slugify(input: string): string {
  return input
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
}

// Strategists are the named humans assigned to each member. One Strategist
// owns a member's messages thread, /profile "Your strategist" card, and
// dashboard greeting. Auto-assigned round-robin from active=true rows on
// first sign-in (see lib/auth/ensure-user-record.ts).
//
// Slug is used as the assignment key in user_profiles.assigned_strategist_id
// — keep it stable. The seeded "growth-hub-team" Strategist is the legacy
// catch-all bucket for pre-feature users; do not delete.
export const Strategists: CollectionConfig = {
  slug: 'strategists',
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'role', 'email', 'active', 'order'],
    group: 'Team',
  },
  fields: [
    {
      name: 'name',
      type: 'text',
      required: true,
    },
    {
      name: 'slug',
      type: 'text',
      unique: true,
      index: true,
      admin: {
        description:
          'Stable assignment key stored on user_profiles.assigned_strategist_id. Auto-generated from name on save if left blank.',
      },
      hooks: {
        beforeChange: [
          ({ value, data }) => {
            if (value && String(value).trim()) return slugify(String(value));
            if (data?.name) return slugify(String(data.name));
            return value;
          },
        ],
      },
    },
    {
      name: 'role',
      type: 'text',
      required: true,
      admin: { description: 'e.g. "Growth Strategist", "Senior Strategist"' },
    },
    {
      name: 'photo',
      type: 'upload',
      relationTo: 'media',
    },
    {
      name: 'email',
      type: 'email',
      required: true,
    },
    {
      name: 'bio',
      type: 'richText',
    },
    {
      name: 'calendlyUrl',
      type: 'text',
      admin: {
        description:
          'Full URL including https://. Doubles as the booking link shown on /services ("Your strategist") and next to the request form.',
      },
    },
    {
      // Mirrors src/lib/advisory/needs.ts NEEDS. Drives routing: a new
      // member (or a booking with a need) is matched to an active strategist
      // whose specialties include that need, least-loaded first. Stored by
      // Payload in payload.strategists_specialties (hasMany select) — see
      // src/migrations/20260909_strategists_specialties.ts.
      name: 'specialties',
      type: 'select',
      hasMany: true,
      options: [
        { label: 'Starting a business', value: 'starting_business' },
        { label: 'Behind on digital', value: 'behind_on_digital' },
        { label: 'Marketing & growth', value: 'marketing_growth' },
        { label: 'Website', value: 'website' },
        { label: 'Funding & grants', value: 'funding_grants' },
        { label: 'Other', value: 'other' },
      ],
      admin: {
        description:
          'Which member needs this strategist should be routed. Leave empty to only receive overflow / unmatched members.',
      },
    },
    {
      name: 'active',
      type: 'checkbox',
      defaultValue: true,
      admin: {
        description:
          'Only active strategists receive auto-assignment of new signups. Inactive strategists keep existing assignments.',
      },
    },
    {
      name: 'order',
      type: 'number',
      defaultValue: 0,
      admin: { description: 'Lower numbers appear first in admin lists' },
    },
  ],
  hooks: {
    afterChange: [async () => { await revalidate('strategists'); }],
    afterDelete: [async () => { await revalidate('strategists'); }],
  },
};
