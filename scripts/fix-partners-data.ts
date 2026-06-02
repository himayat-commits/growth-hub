/**
 * One-off data-fix script for the partners directory GTM refresh.
 *
 *   npm run partners:fix-data
 *
 * Idempotent: every change is gated on the current value, so re-running is
 * safe. Designed to be run AFTER `npm run payload:migrate` adds the new
 * columns (is_anchor, secondaryCategories, recruit_*) introduced in
 * 20260529_partners_directory_gtm.
 *
 * What it does:
 *
 *   1. Backfills `contribution` and `howWeWork` on partner records that
 *      currently have only a description (CBR Innovation Network and Muslim
 *      Community Co-op on prod as of 2026-05-29). Only writes when the
 *      target field is empty.
 *   2. Renames the "Lighthouse Business" private-advisory record to
 *      "Lighthouse Business Advisory" so it doesn't read as a near-duplicate
 *      of "Lighthouse Business Innovation Centre" (a different organisation
 *      in Industry & Government). Only renames if no record already exists
 *      under the new name.
 *   3. Ensures the Technology-category partners (Birdeye, What Works, Stitch
 *      Analytics) exist and are published. Delegates to
 *      `add-missing-partners` logic — but flips `status: published` on any
 *      that happen to be draft.
 *   4. Marks the three foundational partners (ACT Government, ANU Centre for
 *      Social Impact, CBR Innovation Network) as anchors so the new
 *      anchor-tier card variant has something to render against.
 */
import { getPayload } from 'payload';
import config from '../src/payload.config';

const BACKFILL_CONTRIB_HOW: Array<{
  name: string;
  contribution: string;
  howWeWork: string;
}> = [
  {
    name: 'CBR Innovation Network',
    contribution: 'Introductions · co-marketing · venue support',
    howWeWork: 'Joint programming and member pipeline.',
  },
  {
    name: 'Muslim Community Co-op',
    contribution: 'Outreach · translation · cultural advisory',
    howWeWork: 'Shared events, joint outreach, paid community workshops.',
  },
];

const LIGHTHOUSE_OLD = 'Lighthouse Business';
const LIGHTHOUSE_NEW = 'Lighthouse Business Advisory';

const TECHNOLOGY_PARTNERS_TO_PUBLISH = ['Birdeye', 'What Works', 'Stitch Analytics'];

const ANCHOR_NAMES = ['ACT Government', 'ANU Centre for Social Impact', 'CBR Innovation Network'];

async function run() {
  console.log('🔧  fix-partners-data: starting…');
  const payload = await getPayload({ config });

  // 1. Backfill contribution / howWeWork on partners that are missing them.
  for (const target of BACKFILL_CONTRIB_HOW) {
    const found = await payload.find({
      collection: 'partners',
      where: { name: { equals: target.name } },
      limit: 1,
      depth: 0,
    });
    if (found.totalDocs === 0) {
      console.log(`⏭   ${target.name} — not in DB, skipping backfill.`);
      continue;
    }
    const row = found.docs[0] as { id: number | string; contribution?: string | null; howWeWork?: string | null };
    const patch: Record<string, string> = {};
    if (!row.contribution || row.contribution.trim() === '') patch.contribution = target.contribution;
    if (!row.howWeWork || row.howWeWork.trim() === '') patch.howWeWork = target.howWeWork;
    if (Object.keys(patch).length === 0) {
      console.log(`✓   ${target.name} — contribution/howWeWork already set.`);
      continue;
    }
    await payload.update({ collection: 'partners', id: row.id, data: patch });
    console.log(`✏️   ${target.name} — backfilled ${Object.keys(patch).join(' + ')}.`);
  }

  // 2. Rename Lighthouse Business → Lighthouse Business Advisory.
  const lhNew = await payload.find({
    collection: 'partners',
    where: { name: { equals: LIGHTHOUSE_NEW } },
    limit: 1,
    depth: 0,
  });
  if (lhNew.totalDocs > 0) {
    console.log(`✓   "${LIGHTHOUSE_NEW}" already exists — leaving alone.`);
  } else {
    const lhOld = await payload.find({
      collection: 'partners',
      where: { name: { equals: LIGHTHOUSE_OLD } },
      limit: 1,
      depth: 0,
    });
    if (lhOld.totalDocs === 0) {
      console.log(`⏭   Neither Lighthouse name in DB — nothing to rename.`);
    } else {
      const row = lhOld.docs[0] as { id: number | string };
      await payload.update({
        collection: 'partners',
        id: row.id,
        data: { name: LIGHTHOUSE_NEW },
      });
      console.log(`✏️   Renamed "${LIGHTHOUSE_OLD}" → "${LIGHTHOUSE_NEW}".`);
    }
  }

  // 3. Make sure the Technology partners are present + published.
  for (const name of TECHNOLOGY_PARTNERS_TO_PUBLISH) {
    const found = await payload.find({
      collection: 'partners',
      where: { name: { equals: name } },
      limit: 1,
      depth: 0,
    });
    if (found.totalDocs === 0) {
      console.log(`⚠   ${name} — not in DB. Run \`npm run partners:add-missing\` first.`);
      continue;
    }
    const row = found.docs[0] as { id: number | string; status?: string | null };
    if (row.status === 'published') {
      console.log(`✓   ${name} — already published.`);
      continue;
    }
    await payload.update({ collection: 'partners', id: row.id, data: { status: 'published' } });
    console.log(`📢  ${name} — set status=published.`);
  }

  // 4. Mark foundational partners as anchors.
  for (const name of ANCHOR_NAMES) {
    const found = await payload.find({
      collection: 'partners',
      where: { name: { equals: name } },
      limit: 1,
      depth: 0,
    });
    if (found.totalDocs === 0) {
      console.log(`⏭   ${name} — not in DB, skipping anchor flag.`);
      continue;
    }
    const row = found.docs[0] as { id: number | string; isAnchor?: boolean | null };
    if (row.isAnchor === true) {
      console.log(`✓   ${name} — already an anchor.`);
      continue;
    }
    // `isAnchor` is added by migration 20260529 but Payload's generated types
    // won't include it until `npm run payload:types` is rerun. Cast through.
    await payload.update({
      collection: 'partners',
      id: row.id,
      data: { isAnchor: true } as unknown as Record<string, never>,
    });
    console.log(`⚓  ${name} — flagged isAnchor=true.`);
  }

  console.log('\nDone. Trigger /api/revalidate?tag=partners (and partners-page) to surface immediately.');
}

run()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('fix-partners-data failed:', err);
    process.exit(1);
  });
