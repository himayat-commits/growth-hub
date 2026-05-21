import type { CollectionConfig } from 'payload';
import { revalidate } from '../lib/cms/revalidate.ts';

/**
 * Events the Himayat team runs — webinars, in-person workshops, monthly
 * meet-ups, summits and clinics.
 *
 * Two surfaces consume this collection:
 *   - /(app)/my-events     authenticated dashboard. Uses `type`, `seats`,
 *                          `registerUrl`, `recording`. RSVPs flow through
 *                          /api/events/[id]/rsvp.
 *   - /(main)/events       public marketing hub + /(main)/events/[slug]
 *                          detail. Uses `slug`, `category`, `tag`,
 *                          `audience`, `cost`, `dateDisplay`, `bespoke`.
 *
 * `bespoke: true` means a hand-built static landing page exists at the
 * slug (e.g. /events/small-business-journey). The dynamic [slug] route
 * 307s to it so the bespoke layout always wins.
 *
 * Slug is auto-generated from title on create if left blank.
 */

function slugify(input: string): string {
  return input
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
}

export const Events: CollectionConfig = {
  slug: 'events',
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'slug', 'date', 'category', 'featured', 'bespoke'],
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
      unique: true,
      index: true,
      admin: {
        description: 'URL slug. Auto-generated from title on save if left blank.',
      },
      hooks: {
        beforeChange: [
          ({ value, data }) => {
            if (value && String(value).trim()) return slugify(String(value));
            if (data?.title) return slugify(String(data.title));
            return value;
          },
        ],
      },
    },
    {
      name: 'description',
      type: 'textarea',
    },
    {
      name: 'date',
      type: 'date',
      required: true,
      admin: {
        date: { pickerAppearance: 'dayOnly' },
        description: 'Date the event runs on. Past dates remain visible as recordings.',
      },
    },
    {
      name: 'time',
      type: 'text',
      admin: { description: 'Display time, e.g. "12:30 – 1:30 pm" or "10:00 – 11:30 am".' },
    },
    {
      name: 'type',
      type: 'select',
      defaultValue: 'webinar',
      options: [
        { label: 'Webinar · Online', value: 'webinar' },
        { label: 'Workshop · In person', value: 'workshop' },
        { label: 'Community', value: 'community' },
      ],
    },
    {
      name: 'location',
      type: 'text',
      admin: { description: 'For in-person events. Leave blank for online.' },
    },
    {
      name: 'seats',
      type: 'text',
      admin: {
        description:
          'Free-text seat availability shown to members, e.g. "8 of 12 spots left" or "Open registration".',
      },
    },
    {
      name: 'registerUrl',
      type: 'text',
      admin: { description: 'External registration URL (e.g. Eventbrite, Zoom).' },
    },
    {
      name: 'recording',
      type: 'upload',
      relationTo: 'media',
      admin: {
        description: 'For past events — surfaces in the recordings grid once uploaded.',
      },
    },
    {
      name: 'featured',
      type: 'checkbox',
      defaultValue: false,
      admin: {
        description:
          'Pin to the hero slot at the top of the public /events hub. Only the first featured upcoming event is shown.',
      },
    },
    // ── Public hub fields ────────────────────────────────────────────────
    {
      name: 'category',
      type: 'select',
      defaultValue: 'workshop',
      admin: {
        description:
          'Public categorisation used by the /events hub filter chips. Independent of the internal `type` field (which still drives the dashboard labels).',
      },
      options: [
        { label: 'Summit', value: 'summit' },
        { label: 'Workshop', value: 'workshop' },
        { label: 'Mixer', value: 'mixer' },
        { label: 'Clinic', value: 'clinic' },
        { label: 'Community', value: 'community' },
        { label: 'Webinar', value: 'webinar' },
      ],
    },
    {
      name: 'tag',
      type: 'text',
      admin: {
        description:
          'Display tag on the public hub (e.g. "Annual Summit", "Workshop", "Mixer"). Falls back to the category label when blank.',
      },
    },
    {
      name: 'audience',
      type: 'text',
      admin: { description: 'Who the event is for, shown on the public detail page.' },
    },
    {
      name: 'cost',
      type: 'text',
      defaultValue: 'Free',
      admin: { description: 'Free-text cost line — e.g. "Free", "Free · RSVP", "Free for members · $40 guests".' },
    },
    {
      name: 'dateDisplay',
      type: 'text',
      admin: {
        description:
          'Override for non-standard date strings — e.g. "Date to be confirmed", "Fortnightly · alternating Tuesdays". When blank, `date` is auto-formatted.',
      },
    },
    {
      name: 'bespoke',
      type: 'checkbox',
      defaultValue: false,
      admin: {
        description:
          'Set true if a hand-built landing page exists at /events/{slug}. The generic detail route will 307 to it.',
      },
    },
  ],
  hooks: {
    afterChange: [async () => { await revalidate('events'); }],
    afterDelete: [async () => { await revalidate('events'); }],
  },
};
