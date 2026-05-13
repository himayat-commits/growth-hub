import type { Block } from 'payload';

export const CommunityBlock: Block = {
  slug: 'community',
  labels: { singular: 'Community Section', plural: 'Community Sections' },
  fields: [
    { name: 'heading', type: 'text' },
    { name: 'subheading', type: 'text' },
    {
      name: 'tabs',
      type: 'array',
      required: true,
      admin: { description: 'Each tab is a community pillar (events, webinar, community, support, etc.)' },
      fields: [
        { name: 'label', type: 'text', required: true, admin: { description: 'Tab button label, e.g. "In-Person Events"' } },
        {
          name: 'slug',
          type: 'text',
          required: true,
          admin: { description: 'Anchor/key for this tab, e.g. "events"' },
        },
        { name: 'badge', type: 'text', admin: { description: 'Access badge text, e.g. "Subscribers Only"' } },
        { name: 'locked', type: 'checkbox', defaultValue: true, admin: { description: 'Show a lock icon on the badge' } },
        { name: 'tagLine', type: 'text', admin: { description: 'Small tag shown at top of panel, e.g. "Live · Every Week"' } },
        { name: 'panelHeading', type: 'text' },
        { name: 'panelDescription', type: 'textarea' },
        {
          name: 'features',
          type: 'array',
          admin: { description: 'Bullet points in the right column of the panel' },
          fields: [{ name: 'text', type: 'text', required: true }],
        },
      ],
    },
  ],
};
