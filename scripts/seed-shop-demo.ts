/**
 * Seed one demo merch product for the /shop storefront + Playwright.
 * Run with: npm run shop:seed-demo
 *
 * Idempotent — skips if a product with slug `growth-hub-tee` exists.
 * Creates a Media doc from public/og-image.png as the product photo, then a
 * published product with three variants (one deliberately left at stock 0
 * so the sold-out UI can be exercised), and sets stock on the other two.
 *
 * Requires DATABASE_URL + PAYLOAD_SECRET in .env.local, and BOTH migrations
 * applied (payload: 20260907_add_products, drizzle: 0015_shop_orders_inventory).
 */
import path from 'node:path';
import { getPayload } from 'payload';
import config from '../src/payload.config';
import { ensureInventoryRows, setStock } from '../src/lib/db/inventory';

export const DEMO_SLUG = 'growth-hub-tee';

async function seed() {
  const payload = await getPayload({ config });

  const existing = await payload.find({
    collection: 'products',
    where: { slug: { equals: DEMO_SLUG } },
    limit: 1,
  });
  if (existing.totalDocs > 0) {
    console.log(`⏭   Product "${DEMO_SLUG}" already exists — skipping.`);
    process.exit(0);
  }

  const media = await payload.create({
    collection: 'media',
    data: { alt: 'Growth Hub tee — placeholder product photo' },
    filePath: path.resolve(process.cwd(), 'public/og-image.png'),
  });
  console.log(`✅  Media #${media.id} created`);

  const product = await payload.create({
    collection: 'products',
    data: {
      name: 'Growth Hub Tee',
      slug: DEMO_SLUG,
      status: 'published',
      category: 'apparel',
      shortDescription: 'Heavyweight organic cotton, printed in Canberra. Wear the community that has your back.',
      images: [media.id],
      priceCents: 4500,
      memberDiscountPct: 10,
      featured: true,
      sortOrder: 0,
      variants: [
        { sku: 'GH-TEE-S-TEAL', size: 'S', colour: 'Teal' },
        { sku: 'GH-TEE-M-TEAL', size: 'M', colour: 'Teal' },
        { sku: 'GH-TEE-L-TEAL', size: 'L', colour: 'Teal' },
      ],
    },
  });
  console.log(`✅  Product #${product.id} "${product.name}" created`);

  // The afterChange hook already inserts stock-0 rows; make sure, then stock two.
  await ensureInventoryRows(DEMO_SLUG, ['GH-TEE-S-TEAL', 'GH-TEE-M-TEAL', 'GH-TEE-L-TEAL']);
  await setStock('GH-TEE-M-TEAL', 12);
  await setStock('GH-TEE-L-TEAL', 3);
  console.log('✅  Stock: S=0 (sold out), M=12, L=3');
  process.exit(0);
}

seed().catch((err) => {
  console.error('❌  Seed failed:', err);
  process.exit(1);
});
