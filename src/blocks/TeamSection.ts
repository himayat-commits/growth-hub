import type { Block } from 'payload';

export const TeamSection: Block = {
  slug: 'team-section',
  labels: { singular: 'Team Section', plural: 'Team Sections' },
  fields: [
    { name: 'heading', type: 'text' },
    { name: 'subheading', type: 'text' },
    {
      name: 'members',
      type: 'relationship',
      relationTo: 'team-members',
      hasMany: true,
    },
  ],
};
