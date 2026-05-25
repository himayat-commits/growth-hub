/**
 * Idempotent seeder for the 9 July 2026 event at Canberra Innovation Network.
 *
 *   npm run event:seed-cbrin
 *
 * Behaviour:
 *   1. Ensures a `partners` row exists for "CBR Innovation Network" — if the
 *      `partners:add-missing` script has already been run, this is a no-op.
 *   2. Upserts an `events` row keyed on slug `ai-for-small-business-9-july`
 *      with the date, time, location, audience and host wired to CBRIn.
 *   3. Safe to re-run — re-running updates the event's editable fields
 *      (description, audience, cost) but never overwrites the slug.
 *
 * Run once per environment after `npm run partners:add-missing` (so the
 * CBRIn partner row already exists) and after the Drizzle/Payload
 * migration that adds the `host` + `partners` relationship columns to the
 * events table. The event will then appear at:
 *   /events/ai-for-small-business-9-july
 * and surface on /partners/cbr-innovation-network under "Upcoming with us".
 */
import { getPayload } from 'payload';
import config from '../src/payload.config';

const EVENT_SLUG = 'ai-for-small-business-9-july';
const CBRIN_NAME = 'CBR Innovation Network';

const EVENT_DEFAULTS = {
  title: 'AI for Small Business — with CBR Innovation Network',
  slug: EVENT_SLUG,
  description:
    "A working session for Canberra small businesses on putting AI to work this quarter — practical tools, hands-on demos, and a Q&A. Co-hosted with CBR Innovation Network at their Civic hub. Free; coffee on us.",
  // 9 July 2026 (working title — confirm with CBRIn before publishing).
  date: new Date('2026-07-09T12:30:00.000Z').toISOString(),
  time: '12:30 – 2:00 pm',
  type: 'workshop' as const,
  location: 'CBR Innovation Network · Level 5, 1 Moore Street, Canberra ACT',
  seats: 'Open registration · cap 40',
  registerUrl: '',
  featured: true,
  category: 'workshop' as const,
  tag: 'Workshop · with CBRIN',
  audience: 'Owners & operators of Canberra small businesses',
  cost: 'Free',
  dateDisplay: '',
  bespoke: false,
};

async function main() {
  const payload = await getPayload({ config });

  // 1. Find CBRIn partner (created by partners:add-missing / seed.ts).
  const { docs: partners } = await payload.find({
    collection: 'partners',
    where: { name: { equals: CBRIN_NAME } },
    limit: 1,
    depth: 0,
  });

  let cbrinId: string | number | null = partners[0]?.id ?? null;
  if (!cbrinId) {
    // Defensive: create a minimal CBRIn row so the event still has a host
    // even if seed.ts hasn't run yet.
    const created = await payload.create({
      collection: 'partners',
      data: {
        name: CBRIN_NAME,
        category: 'community-delivery',
        shape: 'hex',
        region: 'Canberra ACT',
        since: '2024',
        description:
          'Canberra’s innovation ecosystem connector — programs, mentorship and a city-centre hub for founders and growing teams.',
        contribution: 'Venue · ecosystem connections · founder programs',
        howWeWork:
          'Co-hosted workshops, member-priority access to CBRIN events, joint promotion through their network.',
        website: 'https://cbrin.com.au',
        order: 50,
        status: 'published',
      },
    });
    cbrinId = created.id;
    console.log(`Created CBRIn partner row id=${cbrinId}.`);
  } else {
    console.log(`Found CBRIn partner row id=${cbrinId}.`);
  }

  // 2. Upsert the event by slug.
  const { docs: existing } = await payload.find({
    collection: 'events',
    where: { slug: { equals: EVENT_SLUG } },
    limit: 1,
    depth: 0,
  });

  // `host` is a new relationship field — payload-types.ts won't include it
  // until `npm run payload:types` is re-run after migration. Treat the
  // payload typing as loose here so the script compiles before that runs.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const data = { ...EVENT_DEFAULTS, host: cbrinId } as any;

  if (existing[0]) {
    const id = existing[0].id;
    await payload.update({ collection: 'events', id, data });
    console.log(`Updated event /${EVENT_SLUG} id=${id}.`);
  } else {
    const created = await payload.create({ collection: 'events', data });
    console.log(`Created event /${EVENT_SLUG} id=${created.id}.`);
  }

  process.exit(0);
}

main().catch((err) => {
  console.error('[seed-cbrin-event] failed', err);
  process.exit(1);
});
