// UI-facing shop types. Serialisable (no Dates) so server components can pass
// them straight into client components.

export type OrderStatus = 'pending' | 'paid' | 'shipped' | 'cancelled' | 'refunded';

export interface VariantView {
  sku: string;
  size: string | null;
  colour: string | null;
  label: string | null;
  /** List price in cents (variant override or product base). */
  priceCents: number;
  /** Member price in cents (equals priceCents when no discount). */
  memberPriceCents: number;
  stock: number;
}

export interface ProductImageView {
  url: string;
  alt: string;
  width?: number | null;
  height?: number | null;
}

export interface ProductView {
  slug: string;
  name: string;
  shortDescription: string | null;
  category: string;
  priceCents: number;
  memberDiscountPct: number;
  /** Cheapest variant member price — for "from" display on cards. */
  memberPriceCents: number;
  images: ProductImageView[];
  variants: VariantView[];
  featured: boolean;
  /** True when every variant is out of stock. */
  soldOut: boolean;
}

/** What the client keeps in localStorage. Nothing else — never prices. */
export interface CartLine {
  sku: string;
  qty: number;
}

/** Server-authoritative hydration of a cart line (GET /api/shop/products). */
export interface HydratedLine {
  sku: string;
  productSlug: string;
  name: string;
  variantLabel: string | null;
  imageUrl: string | null;
  priceCents: number;
  /** null when the viewer is not an active member (or no discount). */
  memberPriceCents: number | null;
  stock: number;
  available: boolean;
}

export interface HydrateResponse {
  items: HydratedLine[];
  isMember: boolean;
  missing: string[];
}

export const MAX_QTY_PER_LINE = 10;
export const MAX_CART_LINES = 30;
