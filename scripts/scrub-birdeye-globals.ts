/**
 * One-shot prod cleanup — scrubs the Birdeye brand from CMS-stored content
 * that the code-side edits can't reach (seed files only affect fresh DBs;
 * these records already live in the database).
 *
 *   npm run partners:scrub-birdeye
 *
 * Touches two places:
 *   1. The home page (`pages` collection, slug "home") — any `logo-strip`
 *      block's `textItems` entry named "Birdeye" → "Small Business Digital".
 *   2. The `partners-page` global — any `proofStats` card whose heading or
 *      body mentions Birdeye is rewritten to the Small Business Digital copy.
 *
 * Idempotent: re-running after a clean pass reports zero changes. Safe to
 * run against prod, but run against staging first. After running, trigger
 * cache revalidation (partners + home tags) or wait for the 1h ISR TTL.
 */
import { getPayload } from 'payload';
import config from '../src/payload.config';

const NEW_PARTNER_NAME = 'Small Business Digital';
const NEW_PROOF_HEADING = 'Small Business Digital × Growth Hub';
const NEW_PROOF_BODY =
  'Twelve members onboarded onto our digital programs in the first quarter. Capability uplift measured across the cohort with sustained engagement post-program.';

function mentionsBirdeye(value: unknown): boolean {
  return typeof value === 'string' && /birdeye/i.test(value);
}

async function run() {
  console.log('🧽  scrub-birdeye-globals: starting…');
  const payload = await getPayload({ config });

  let changes = 0;

  // ── 1. Home page logo-strip textItems ──────────────────────────────────
  const homeRes = await payload.find({
    collection: 'pages',
    where: { slug: { equals: 'home' } },
    limit: 1,
    depth: 0,
  });

  const home = homeRes.docs[0] as { id: string | number; layout?: unknown[] } | undefined;
  if (!home) {
    console.log('⚠   No "home" page found — skipping logo-strip scrub.');
  } else {
    const layout = Array.isArray(home.layout) ? home.layout : [];
    let homeTouched = false;

    const newLayout = layout.map((block) => {
      const b = block as { blockType?: string; textItems?: Array<{ name?: string }> };
      if (b.blockType !== 'logo-strip' || !Array.isArray(b.textItems)) return block;
      const textItems = b.textItems.map((item) => {
        if (mentionsBirdeye(item?.name)) {
          homeTouched = true;
          return { ...item, name: NEW_PARTNER_NAME };
        }
        return item;
      });
      return { ...b, textItems };
    });

    if (homeTouched) {
      await payload.update({
        collection: 'pages',
        id: home.id,
        data: { layout: newLayout as never },
      });
      console.log(`✅  Home logo-strip: replaced "Birdeye" → "${NEW_PARTNER_NAME}".`);
      changes++;
    } else {
      console.log('⏭   Home logo-strip: no Birdeye text item found.');
    }
  }

  // ── 2. Partners-page proofStats ─────────────────────────────────────────
  const partnersPage = (await payload.findGlobal({
    slug: 'partners-page',
    depth: 0,
  })) as { proofStats?: Array<{ heading?: string; body?: string }> } | null;

  const proofStats = Array.isArray(partnersPage?.proofStats) ? partnersPage!.proofStats : [];
  let proofTouched = false;

  const newProofStats = proofStats.map((stat) => {
    if (mentionsBirdeye(stat?.heading) || mentionsBirdeye(stat?.body)) {
      proofTouched = true;
      return { ...stat, heading: NEW_PROOF_HEADING, body: NEW_PROOF_BODY };
    }
    return stat;
  });

  if (proofTouched) {
    await payload.updateGlobal({
      slug: 'partners-page',
      data: { proofStats: newProofStats as never },
    });
    console.log('✅  Partners-page proofStats: rewrote Birdeye stat card.');
    changes++;
  } else {
    console.log('⏭   Partners-page proofStats: no Birdeye reference found.');
  }

  console.log(`\nDone. ${changes} record(s) updated.`);
  if (changes > 0) {
    console.log('Trigger cache revalidation (partners + home tags) or wait for the 1h TTL.');
  }
}

run()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('scrub-birdeye-globals failed:', err);
    process.exit(1);
  });
