// Stock per SKU for the merch shop. Lives in the Drizzle `public` schema
// (not Payload) so decrements are atomic and survive editors re-saving the
// product in the CMS.
//
// NOT 'server-only': this module is imported by the Products collection
// afterChange hook, and the Payload CLI (migrate / generate:types) loads
// collections outside a Next.js server context.
//
// Atomicity: the neon-http driver has no interactive transactions
// (db.transaction() throws). db.batch() runs every statement inside ONE
// Neon transaction, and the CHECK (stock >= 0) constraint makes any
// insufficient line throw — rolling back the whole batch.

import { eq, inArray, sql } from 'drizzle-orm';
import { getDb } from './index';
import { inventory } from './schema';

export class OversoldError extends Error {
  constructor(message = 'Insufficient stock for one or more items') {
    super(message);
    this.name = 'OversoldError';
  }
}

/** Postgres check_violation. */
const CHECK_VIOLATION = '23514';

function isCheckViolation(err: unknown): boolean {
  const e = err as { code?: string; cause?: { code?: string } } | undefined;
  return e?.code === CHECK_VIOLATION || e?.cause?.code === CHECK_VIOLATION;
}

/** Upsert a stock-0 row for every SKU. Existing rows are left untouched
 *  (ON CONFLICT DO NOTHING) so re-saving a product never resets stock. */
export async function ensureInventoryRows(productSlug: string, skus: string[]): Promise<void> {
  const unique = [...new Set(skus.map((s) => s.trim().toUpperCase()).filter(Boolean))];
  if (!unique.length) return;
  await getDb()
    .insert(inventory)
    .values(unique.map((sku) => ({ sku, productSlug })))
    .onConflictDoNothing({ target: inventory.sku });
}

/** Map of sku → stock for the given SKUs. Missing rows are simply absent
 *  (treat as 0). */
export async function getStockBySku(skus: string[]): Promise<Map<string, number>> {
  const unique = [...new Set(skus)].filter(Boolean);
  if (!unique.length) return new Map();
  const rows = await getDb()
    .select({ sku: inventory.sku, stock: inventory.stock })
    .from(inventory)
    .where(inArray(inventory.sku, unique));
  return new Map(rows.map((r) => [r.sku, r.stock]));
}

/** All inventory rows (ops page). */
export async function listInventory() {
  return getDb().select().from(inventory).orderBy(inventory.productSlug, inventory.sku);
}

/**
 * All-or-nothing decrement for a paid order. Throws OversoldError if ANY
 * line would take stock below zero; in that case nothing is decremented.
 */
export async function decrementStockAtomic(lines: Array<{ sku: string; qty: number }>): Promise<void> {
  const merged = new Map<string, number>();
  for (const l of lines) merged.set(l.sku, (merged.get(l.sku) ?? 0) + l.qty);
  const entries = [...merged.entries()].filter(([, q]) => q > 0);
  if (!entries.length) return;

  const db = getDb();
  const now = new Date();
  const stmts = entries.map(([sku, qty]) =>
    db
      .update(inventory)
      .set({ stock: sql`${inventory.stock} - ${qty}`, updatedAt: now })
      .where(eq(inventory.sku, sku))
      .returning({ sku: inventory.sku }),
  );

  let results: Array<Array<{ sku: string }>>;
  try {
    results = (await db.batch(stmts as [typeof stmts[number], ...typeof stmts])) as Array<Array<{ sku: string }>>;
  } catch (err) {
    if (isCheckViolation(err)) throw new OversoldError();
    throw err;
  }
  // A SKU with no inventory row matched zero rows — treat as oversold too.
  // (ensureInventoryRows makes this practically impossible for a published
  // product, but never silently ship something we can't account for.)
  const missed = results.findIndex((r) => r.length === 0);
  if (missed !== -1) throw new OversoldError(`No inventory row for ${entries[missed]![0]}`);
}

/** Ops adjustment. `delta` may be negative; the CHECK constraint rejects a
 *  result below zero → OversoldError. Returns the new stock. */
export async function adjustStock(sku: string, delta: number): Promise<number> {
  try {
    const rows = await getDb()
      .update(inventory)
      .set({ stock: sql`${inventory.stock} + ${delta}`, updatedAt: new Date() })
      .where(eq(inventory.sku, sku))
      .returning({ stock: inventory.stock });
    if (!rows[0]) throw new Error(`No inventory row for ${sku}`);
    return rows[0].stock;
  } catch (err) {
    if (isCheckViolation(err)) throw new OversoldError(`Stock for ${sku} cannot go below zero`);
    throw err;
  }
}

/** Ops "set to exactly N". */
export async function setStock(sku: string, stock: number): Promise<number> {
  const rows = await getDb()
    .update(inventory)
    .set({ stock: Math.max(0, Math.floor(stock)), updatedAt: new Date() })
    .where(eq(inventory.sku, sku))
    .returning({ stock: inventory.stock });
  if (!rows[0]) throw new Error(`No inventory row for ${sku}`);
  return rows[0].stock;
}
