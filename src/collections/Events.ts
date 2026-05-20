import type { CollectionConfig } from 'payload';
import { revalidate } from '../lib/cms/revalidate.ts';

/**
 * Events the Himayat team runs — webinars, in-person workshops, monthly
 * meet-ups. Visible to all signed-in members on /(app)/events.
 *
 * `featured: true` and `date >= today` puts the row in the hero slot on
 * the events page. Past events with a `recording` upload appear in the
 * "Past recordings" grid.
 */
export const Events: CollectionConfig = {
  slug: 'events',
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'date', 'type', 'location', 'featured'],
  },
  fields: [
    {
      name: 'title',
      type: 'text',
      required: true,
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
          'Pin to the hero slot at the top of /events. Only the next featured upcoming event is shown.',
      },
    },
  ],
  hooks: {
    afterChange: [async () => { await revalidate('events'); }],
    afterDelete: [async () => { await revalidate('events'); }],
  },
};
