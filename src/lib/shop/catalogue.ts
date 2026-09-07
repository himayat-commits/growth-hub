// Server-side glue between the Payload catalogue (products) and the Drizzle
// inventory table. Produces the serialisable ProductView shapes the UI and
// the checkout route both consume, so pricing logic lives in exactly one
// place (pricing.ts) and is applied identically everywhere.

import 'server-only';
import type { Media, Product } from '@/payload-types';
import { getProducts, getProductBySlug } from '@/lib/cms';
import { getStockBySku } from '@/lib/db/inventory';
import { memberPriceCents, variantLabel } from '@/lib/shop/pricing';
import type { ProductImageView, ProductView, VariantView } from '@/lib/shop/types';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://thegrowthhub.com.au';

/** Media URLs are absolute on Vercel Blob but relative (/media/...) on local
 *  disk. Stripe fetches product images itself, so they must be absolute. */
export function absoluteMediaUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  if (/^https?:\/\//i.test(url)) return url;
  return `${SITE_URL}${url.startsWith('/') ? '' : '/'}${url}`;
}

export function productImages(product: Product): ProductImageView[] {
  const out: ProductImageView[] = [];
  for (const img of product.images ?? []) {
    if (!img || typeof img !== 'object') continue; // depth 0 → bare id
    const m = img as Media;
    const card = m.sizes?.card?.url ?? null;
    const url = absoluteMediaUrl(card ?? m.url ?? null);
    if (!url) continue;
    out.push({
      url,
      alt: m.alt || product.name,
      width: m.sizes?.card?.width ?? m.width ?? null,
      height: m.sizes?.card?.height ?? m.height ?? null,
    });
  }
  return out;
}

/** Highest-resolution image for the product page hero / OG card. */
export function productHeroImage(product: Product): ProductImageView | null {
  const first = (product.images ?? [])[0];
  if (!first || typeof first !== 'object') return null;
  const m = first as Media;
  const url = absoluteMediaUrl(m.sizes?.hero?.url ?? m.url ?? null);
  if (!url) return null;
  return { url, alt: m.alt || product.name, width: m.sizes?.hero?.width ?? m.width ?? null, height: m.sizes?.hero?.height ?? m.height ?? null };
}

export type RawVariant = Product['variants'][number];

export function variantListPrice(product: Product, v: RawVariant): number {
  return typeof v.priceCentsOverride === 'number' && v.priceCentsOverride >= 0
    ? v.priceCentsOverride
    : product.priceCents;
}

export function toVariantView(product: Product, v: RawVariant, stock: number): VariantView {
  const list = variantListPrice(product, v);
  return {
    sku: v.sku,
    size: v.size ?? null,
    colour: v.colour ?? null,
    label: variantLabel(v),
    priceCents: list,
    memberPriceCents: memberPriceCents(list, product.memberDiscountPct ?? 0),
    stock,
  };
}

export function toProductView(product: Product, stock: Map<string, number>): ProductView {
  const variants = (product.variants ?? []).map((v) => toVariantView(product, v, stock.get(v.sku) ?? 0));
  const cheapest = variants.reduce((min, v) => Math.min(min, v.memberPriceCents), Number.POSITIVE_INFINITY);
  return {
    slug: product.slug ?? '',
    name: product.name,
    shortDescription: product.shortDescription ?? null,
    category: product.category ?? 'other',
    priceCents: product.priceCents,
    memberDiscountPct: product.memberDiscountPct ?? 0,
    memberPriceCents: Number.isFinite(cheapest) ? cheapest : memberPriceCents(product.priceCents, product.memberDiscountPct ?? 0),
    images: productImages(product),
    variants,
    featured: !!product.featured,
    soldOut: variants.length > 0 && variants.every((v) => v.stock <= 0),
  };
}

/** Published catalogue with live stock, ready for the grid. */
export async function loadCatalogue(): Promise<ProductView[]> {
  const products = (await getProducts()) as Product[];
  const skus = products.flatMap((p) => (p.variants ?? []).map((v) => v.sku));
  const stock = await getStockBySku(skus).catch(() => new Map<string, number>());
  return products.filter((p) => p.slug).map((p) => toProductView(p, stock));
}

/** One product with live stock, or null when unpublished / missing. */
export async function loadProduct(slug: string): Promise<{ raw: Product; view: ProductView } | null> {
  const raw = (await getProductBySlug(slug)) as Product | null;
  if (!raw || !raw.slug) return null;
  const stock = await getStockBySku((raw.variants ?? []).map((v) => v.sku)).catch(() => new Map<string, number>());
  return { raw, view: toProductView(raw, stock) };
}

export interface SkuHit {
  product: Product;
  variant: RawVariant;
}

/** sku → { product, variant } across the published catalogue. */
export async function indexPublishedSkus(): Promise<Map<string, SkuHit>> {
  const products = (await getProducts()) as Product[];
  const map = new Map<string, SkuHit>();
  for (const product of products) {
    if (!product.slug) continue;
    for (const variant of product.variants ?? []) {
      if (variant.sku && !map.has(variant.sku)) map.set(variant.sku, { product, variant });
    }
  }
  return map;
}
