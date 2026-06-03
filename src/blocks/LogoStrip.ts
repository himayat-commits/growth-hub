import type { Block } from 'payload';

export const LogoStrip: Block = {
  slug: 'logo-strip',
  labels: { singular: 'Logo Strip', plural: 'Logo Strips' },
  fields: [
    { name: 'heading', type: 'text' },
    {
      name: 'partners',
      type: 'relationship',
      relationTo: 'partners',
      hasMany: true,
      admin: {
        description:
          'Partners to feature in the home marquee. Each shows its uploaded logo (from the Partner record) and links to its /partners/{slug} page. Partners without a logo fall back to a name + glyph. Leave empty to use the text-only items below.',
      },
    },
    {
      name: 'logos',
      type: 'relationship',
      relationTo: 'logos',
      hasMany: true,
      admin: {
        description:
          'Legacy generic-logo relationship. Prefer the Partners field above, which links each logo to its partner page.',
      },
    },
    {
      name: 'autoScroll',
      type: 'checkbox',
      defaultValue: false,
    },
    {
      name: 'textItems',
      type: 'array',
      admin: { description: 'Text-only fallback items (no image) — used only when no Partners are selected above.' },
      fields: [{ name: 'name', type: 'text', required: true }],
    },
  ],
};
