/**
 * One-off follow-up: the home logo-strip block previously rendered its
 * text-only fallback names. Adding Record Time as the first partner
 * relationship suppressed that fallback, so this script sets the partners
 * list to the same 8 names (as real partner references, which also makes
 * them link to their /partners/{slug} pages) + Record Time at the end.
 */
import { getPayload } from 'payload';
import config from '../src/payload.config';

const MARQUEE_ORDER = [
  'Small Business Digital',
  'CBR Innovation Network',
  'What Works',
  'ACT Government',
  'Canberra Business Chamber',
  'Lighthouse Business Innovation Centre',
  'GRIFFIN Accelerator',
  'Record Time',
];

async function run() {
  const payload = await getPayload({ config });

  const ids: Array<string | number> = [];
  for (const name of MARQUEE_ORDER) {
    const found = await payload.find({
      collection: 'partners',
      where: { name: { equals: name } },
      limit: 1,
      depth: 0,
    });
    if (found.totalDocs === 0) {
      console.warn(`⚠️   partner "${name}" not found — skipping.`);
      continue;
    }
    ids.push(found.docs[0].id);
    console.log(`✓   ${name} → id ${found.docs[0].id}`);
  }

  const homeResult = await payload.find({
    collection: 'pages',
    where: { slug: { equals: 'home' } },
    limit: 1,
    depth: 0,
  });
  const home = homeResult.docs[0];
  const layout = (home.layout ?? []) as Array<Record<string, unknown>>;
  const strip = layout.find((b) => b.blockType === 'logo-strip');
  if (!strip) throw new Error('home page has no logo-strip block');

  strip.partners = ids;
  await payload.update({
    collection: 'pages',
    id: home.id,
    data: { layout } as never,
    draft: false,
  });
  console.log(`\n✅  logo-strip now references ${ids.length} partners in marquee order.`);
}

run()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('fix-logo-strip-partners failed:', err);
    process.exit(1);
  });
