import type { CollectionConfig } from 'payload';
import { revalidate } from '../lib/cms/revalidate.ts';
import { ensureInventoryRows } from '../lib/db/inventory.ts';

/**
 * Merch catalogue for /shop. Payload owns the *catalogue* (name, images,
 * price, variants). Stock and orders live in the Drizzle `public` schema:
 *
 *   - public.inventory  (keyed by SKU)   — stock counts, decremented by the
 *                                          Stripe webhook; edited in /ops/inventory
 *   - public.orders / order_items        — what was bought, at what price
 *
 * Why stock is NOT a Payload field: the postgres adapter rewrites every
 * array-field child row on save (delete + re-insert with fresh ids), so a
 * stock count stored on a variant row would be clobbered whenever an editor
 * saved the product while the webhook was decrementing. SKU is the only
 * stable key between the two schemas — never rename a SKU once it has sold.
 *
 * Prices are AUD, GST-inclusive, stored in integer cents.
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

function normaliseSku(value: unknown): string {
  return String(value ?? '').trim().toUpperCase();
}

export const Products: CollectionConfig = {
  slug: 'products',
  access: {
    // Public storefront reads the catalogue through the Local API (which
    // runs with overrideAccess: true, so this rule does not apply there —
    // src/lib/cms/index.ts filters on status itself). This rule governs the
    // Payload REST/GraphQL routes: anonymous callers only see Published
    // products; admin-panel users see drafts and archived too. Writes stay
    // behind the admin login (Payload default).
    read: ({ req }) => (req.user ? true : { status: { equals: 'published' } }),
  },
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'slug', 'status', 'priceCents', 'category', 'sortOrder'],
    description:
      'Merch sold on /shop. Stock is managed in the Ops console (/ops/inventory), not here. Prices are in cents, GST-inclusive.',
    group: 'Shop',
  },
  fields: [
    { name: 'name', type: 'text', required: true },
    {
      name: 'slug',
      type: 'text',
      unique: true,
      index: true,
      admin: { description: 'URL: /shop/[slug]. Auto-generated from the name if left blank.' },
      hooks: {
        beforeValidate: [
          ({ value, data }) => {
            if (value && String(value).trim()) return slugify(String(value));
            if (data?.name) return slugify(String(data.name));
            return value;
          },
        ],
      },
    },
    {
      name: 'status',
      type: 'select',
      required: true,
      defaultValue: 'draft',
      options: [
        { label: 'Draft', value: 'draft' },
        { label: 'Published', value: 'published' },
        { label: 'Archived', value: 'archived' },
      ],
      admin: { description: 'Only Published products appear on /shop and can be bought.' },
    },
    {
      name: 'category',
      type: 'select',
      defaultValue: 'apparel',
      options: [
        { label: 'Apparel', value: 'apparel' },
        { label: 'Accessories', value: 'accessories' },
        { label: 'Stationery', value: 'stationery' },
        { label: 'Other', value: 'other' },
      ],
    },
    {
      name: 'shortDescription',
      type: 'textarea',
      admin: { description: 'One or two lines. Renders on the product card and as the meta description.' },
    },
    { name: 'description', type: 'richText' },
    {
      name: 'images',
      type: 'upload',
      relationTo: 'media',
      hasMany: true,
      required: true,
      admin: { description: 'First image is the card / hero image.' },
    },
    {
      name: 'priceCents',
      type: 'number',
      required: true,
      min: 0,
      admin: { description: 'AUD, GST-inclusive, in cents. 3500 = A$35.00. Variants may override.' },
    },
    {
      name: 'memberDiscountPct',
      type: 'number',
      defaultValue: 10,
      min: 0,
      max: 90,
      admin: { description: 'Discount for members with an active paid plan. 0 = no member price.' },
    },
    {
      name: 'variants',
      type: 'array',
      required: true,
      minRows: 1,
      labels: { singular: 'Variant', plural: 'Variants' },
      admin: {
        description:
          'One row per sellable SKU. A product with no size/colour still needs exactly one variant. Do NOT rename a SKU after it has sold.',
      },
      fields: [
        {
          type: 'row',
          fields: [
            {
              name: 'sku',
              type: 'text',
              required: true,
              index: true,
              admin: { width: '40%', description: 'Stable key for stock + orders, e.g. GH-TEE-M-TEAL.' },
              hooks: {
                beforeValidate: [({ value }) => normaliseSku(value)],
              },
            },
            { name: 'size', type: 'text', admin: { width: '30%' } },
            { name: 'colour', type: 'text', admin: { width: '30%' } },
          ],
        },
        {
          type: 'row',
          fields: [
            {
              name: 'priceCentsOverride',
              type: 'number',
              min: 0,
              admin: { width: '50%', description: 'Leave blank to use the product price.' },
            },
            {
              name: 'weightGrams',
              type: 'number',
              min: 0,
              admin: { width: '50%', description: 'Optional — for future carrier integration.' },
            },
          ],
        },
      ],
    },
    { name: 'featured', type: 'checkbox', defaultValue: false },
    {
      name: 'sortOrder',
      type: 'number',
      defaultValue: 0,
      admin: { description: 'Lower numbers appear first on /shop.' },
    },
  ],
  hooks: {
    beforeValidate: [
      ({ data }) => {
        const skus = ((data?.variants ?? []) as Array<{ sku?: string }>)
          .map((v) => normaliseSku(v.sku))
          .filter(Boolean);
        const dupes = skus.filter((s, i) => skus.indexOf(s) !== i);
        if (dupes.length) {
          throw new Error(`Duplicate SKU in variants: ${[...new Set(dupes)].join(', ')}`);
        }
        return data;
      },
    ],
    afterChange: [
      async ({ doc }) => {
        // Guarantee an inventory row (stock 0) for every SKU so ops can set
        // stock straight away. Idempotent — existing rows are untouched.
        try {
          const skus = ((doc?.variants ?? []) as Array<{ sku?: string }>)
            .map((v) => normaliseSku(v.sku))
            .filter(Boolean);
          await ensureInventoryRows(String(doc.slug), skus);
        } catch (err) {
          console.error('[products] ensureInventoryRows failed', err);
        }
        await revalidate('products');
      },
    ],
    afterDelete: [async () => { await revalidate('products'); }],
  },
};
