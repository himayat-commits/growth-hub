/**
 * One-off: add Record TIME as a partner. Ran against prod on 3 Jul 2026
 * (originally as "Record Time"; the row was renamed to the brand styling
 * "Record TIME" afterwards) — committed for the record.
 *
 *   node --env-file=<prod env> --import tsx/esm scripts/add-recordtime-partner.ts
 *
 * Idempotent. Does three things:
 *   1. Uploads the Record TIME logo SVG to the media collection (Vercel Blob
 *      when BLOB_READ_WRITE_TOKEN is set).
 *   2. Creates the "Record TIME" partner (featured, published) — or backfills
 *      the logo if the partner already exists.
 *   3. Appends the partner to the home page's logo-strip block so it shows in
 *      the front-page marquee.
 */
import { getPayload } from 'payload';
import config from '../src/payload.config';

const LOGO_PATH = 'C:/Users/WaheedJayhoon/Downloads/RecordTime_stacked_positive.svg';
const PARTNER_NAME = 'Record TIME';

async function run() {
  const payload = await getPayload({ config });

  // ── 1. Logo upload ─────────────────────────────────────────────────────────
  let mediaId: string | number;
  const existingMedia = await payload.find({
    collection: 'media',
    where: { filename: { contains: 'RecordTime' } },
    limit: 1,
    depth: 0,
  });

  if (existingMedia.totalDocs > 0) {
    mediaId = existingMedia.docs[0].id;
    console.log(`⏭   media — RecordTime logo already exists (id ${mediaId}), reusing.`);
  } else {
    const media = await payload.create({
      collection: 'media',
      data: { alt: 'Record TIME logo' },
      filePath: LOGO_PATH,
    });
    mediaId = media.id;
    console.log(`✅  media — uploaded logo (id ${mediaId}, url ${media.url}).`);
  }

  // ── 2. Partner record ──────────────────────────────────────────────────────
  let partnerId: string | number;
  const existingPartner = await payload.find({
    collection: 'partners',
    where: { name: { equals: PARTNER_NAME } },
    limit: 1,
    depth: 0,
  });

  if (existingPartner.totalDocs > 0) {
    partnerId = existingPartner.docs[0].id;
    console.log(`⏭   partner — "${PARTNER_NAME}" already exists (id ${partnerId}).`);
    if (!existingPartner.docs[0].logo || !existingPartner.docs[0].featured) {
      await payload.update({
        collection: 'partners',
        id: partnerId,
        data: { logo: mediaId, featured: true },
      });
      console.log('✅  partner — backfilled logo/featured flag.');
    }
  } else {
    const partner = await payload.create({
      collection: 'partners',
      data: {
        name: PARTNER_NAME,
        slug: 'record-time',
        category: 'technology',
        shape: 'hex',
        region: 'Sydney · National',
        since: '2026',
        description:
          'Digital docketing and timesheet platform helping trades and field teams swap paper dockets for clean, verifiable records of work.',
        contribution: 'Digital dockets · timesheets · field job tracking',
        howWeWork: 'Preferred access for Growth Hub members; we help with setup and rollout.',
        website: 'https://recordtime.com.au',
        logo: mediaId,
        featured: true,
        order: 42,
        status: 'published',
      },
    });
    partnerId = partner.id;
    console.log(`✅  partner — created "${PARTNER_NAME}" (id ${partnerId}, featured, published).`);
  }

  // ── 3. Home page logo-strip block ──────────────────────────────────────────
  const homeResult = await payload.find({
    collection: 'pages',
    where: { slug: { equals: 'home' } },
    limit: 1,
    depth: 0,
  });

  if (homeResult.totalDocs === 0) {
    console.error('❌  pages — no page with slug "home" found; carousel not updated.');
    process.exit(1);
  }

  const home = homeResult.docs[0];
  const layout = (home.layout ?? []) as Array<Record<string, unknown>>;
  const strip = layout.find((b) => b.blockType === 'logo-strip');

  if (!strip) {
    console.error('❌  pages — home page has no logo-strip block; carousel not updated.');
    process.exit(1);
  }

  const current = ((strip.partners ?? []) as Array<string | number>).map((p) =>
    typeof p === 'object' && p !== null ? (p as { id: string | number }).id : p,
  );
  console.log(`ℹ️   logo-strip currently references ${current.length} partners: [${current.join(', ')}]`);

  if (current.some((id) => String(id) === String(partnerId))) {
    console.log('⏭   logo-strip — Record Time already in the carousel, skipping.');
  } else {
    strip.partners = [...current, partnerId];
    await payload.update({
      collection: 'pages',
      id: home.id,
      data: { layout } as never,
      draft: false,
    });
    console.log(`✅  logo-strip — appended Record Time (now ${current.length + 1} partners).`);
  }

  console.log('\nDone.');
}

run()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('add-recordtime-partner failed:', err);
    process.exit(1);
  });
