import type { Block } from 'payload';

export const BigQuoteBlock: Block = {
  slug: 'big-quote',
  labels: { singular: 'Big Quote', plural: 'Big Quotes' },
  fields: [
    { name: 'quote', type: 'textarea', required: true },
    {
      name: 'attribution',
      type: 'text',
      admin: { description: 'Who said this, e.g. "A Local Canberra Business Owner"' },
    },
    {
      name: 'badges',
      type: 'array',
      admin: { description: 'Trust badges displayed below the quote' },
      fields: [
        { name: 'label', type: 'text', required: true },
        {
          name: 'icon',
          type: 'select',
          options: [
            { label: 'Verified / Shield', value: 'verified' },
            { label: 'NDIS / Check Circle', value: 'ndis' },
            { label: 'Location Pin', value: 'location' },
          ],
          defaultValue: 'verified',
        },
      ],
    },
  ],
};
