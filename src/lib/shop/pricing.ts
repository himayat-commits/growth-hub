// Pure pricing helpers shared by the storefront UI and the checkout route.
// Both sides import from here so the price a buyer SEES is computed by the
// exact same function as the price they are CHARGED. No server-only imports.

/** Member price in cents for a list price and a percentage discount.
 *  Rounds half-up to the nearest cent; 0 or invalid pct returns the list price. */
export function memberPriceCents(listCents: number, pct: number | null | undefined): number {
  const p = typeof pct === 'number' && Number.isFinite(pct) ? Math.min(Math.max(pct, 0), 90) : 0;
  if (p === 0) return listCents;
  return Math.round((listCents * (100 - p)) / 100);
}

const aud = new Intl.NumberFormat('en-AU', {
  style: 'currency',
  currency: 'AUD',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

/** "A$35.00" style formatting from integer cents. */
export function formatAud(cents: number): string {
  return aud.format((cents ?? 0) / 100);
}

/** GST component of a GST-inclusive AUD total (10% GST → total / 11). */
export function gstComponentCents(totalCents: number): number {
  return Math.round(totalCents / 11);
}

/** Human label for a variant, e.g. "M · Teal", "Teal", or null when the
 *  product has a single unlabelled variant. */
export function variantLabel(v: { size?: string | null; colour?: string | null }): string | null {
  const parts = [v.size, v.colour].map((s) => (s ?? '').trim()).filter(Boolean);
  return parts.length ? parts.join(' · ') : null;
}
