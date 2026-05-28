/**
 * One-shot prod cleanup — removes the Birdeye partner row from the Partners
 * collection so it stops appearing on /partners and the home logo strip.
 *
 *   npm run partners:remove-birdeye
 *
 * Idempotent: if no row named "Birdeye" exists, the script reports zero
 * deletions and exits 0. Run against staging first, then prod.
 *
 * After running, either trigger cache revalidation (POST /api/revalidate
 * with the partners tag) or wait for the 1h ISR TTL. The home `logo-strip`
 * block on the Home global may still mention Birdeye — edit that in Payload
 * admin separately (Globals → Home → Supported by block).
 */
import { getPayload } from 'payload';
import config from '../src/payload.config';

async function run() {
  console.log('🪦  remove-birdeye-partner: starting…');
  const payload = await getPayload({ config });

  const existing = await payload.find({
    collection: 'partners',
    where: { name: { equals: 'Birdeye' } },
    limit: 10,
    depth: 0,
  });

  if (existing.totalDocs === 0) {
    console.log('✅  No "Birdeye" partner row found. Nothing to do.');
    return;
  }

  for (const doc of existing.docs) {
    await payload.delete({ collection: 'partners', id: doc.id });
    console.log(`🗑   Deleted partner row id=${doc.id} (name="Birdeye").`);
  }

  console.log(`\nDone. Deleted ${existing.totalDocs} row(s).`);
  console.log('Reminder: edit the partners-page proofStats and home logo-strip in Payload admin if they still reference Birdeye.');
}

run()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('remove-birdeye-partner failed:', err);
    process.exit(1);
  });
