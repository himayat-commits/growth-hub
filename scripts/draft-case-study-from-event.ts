/**
 * Draft a Payload case-study record from a past event.
 *
 *   npm run event:draft-case-study -- <event-slug>
 *
 * Pre-fills title / slug / client / outcome / body so the editor opens
 * Payload admin to a near-complete draft. The case study lands in status
 * `draft` — nothing surfaces on /case-studies until an editor flips it to
 * `published`. Re-running for the same event prints the existing slug
 * instead of creating a duplicate.
 *
 * Field mapping:
 *   - title    = `${event.title} — recap`
 *   - slug     = `${event.slug}-recap`           (unique-enforced by Payload)
 *   - client   = host partner name when set, else "Growth Hub community"
 *   - outcome  = placeholder pointing the editor at the next edit
 *   - body     = Lexical skeleton with event date/audience/location +
 *                two empty paragraphs for "What we did" / "What happened"
 *   - image    = left blank — editor picks from the event's photo set
 *
 * Why a CLI script and not a Payload admin custom button: Payload v3 admin
 * customisation requires React components, importmap regeneration and a
 * build pipeline that this repo doesn't otherwise use. The CLI matches the
 * existing scripts/ pattern (event:seed-cbrin, partners:add-missing) and
 * delivers the same outcome — editor opens admin to a populated draft.
 */
import { getPayload } from 'payload';
import config from '../src/payload.config';

interface LexicalParagraph {
  type: 'paragraph';
  version: 1;
  direction: 'ltr' | null;
  format: '';
  indent: 0;
  children: Array<{
    type: 'text';
    version: 1;
    detail: 0;
    format: 0;
    mode: 'normal';
    style: '';
    text: string;
  }>;
}

function p(text: string): LexicalParagraph {
  return {
    type: 'paragraph',
    version: 1,
    direction: 'ltr',
    format: '',
    indent: 0,
    children: [
      {
        type: 'text',
        version: 1,
        detail: 0,
        format: 0,
        mode: 'normal',
        style: '',
        text,
      },
    ],
  };
}

function buildBody(opts: { dateLong: string; location: string; audience: string }) {
  return {
    root: {
      type: 'root',
      version: 1,
      direction: 'ltr' as const,
      format: '' as const,
      indent: 0,
      children: [
        p(`${opts.dateLong} · ${opts.location || 'Canberra'}`),
        p(opts.audience || ''),
        p('What we set out to do — '),
        p('What actually happened — '),
        p('What we’d do differently — '),
      ],
    },
  };
}

async function main() {
  const eventSlug = process.argv[2];
  if (!eventSlug) {
    console.error('Usage: npm run event:draft-case-study -- <event-slug>');
    process.exit(1);
  }

  const payload = await getPayload({ config });

  // 1. Look up the event (depth:1 so `host` comes back populated).
  const { docs: events } = await payload.find({
    collection: 'events',
    where: { slug: { equals: eventSlug } },
    limit: 1,
    depth: 1,
  });
  const event = events[0];
  if (!event) {
    console.error(`No event found with slug "${eventSlug}".`);
    process.exit(1);
  }

  const caseStudySlug = `${eventSlug}-recap`;

  // 2. Idempotent: if a draft already exists at this slug, surface it.
  const { docs: existing } = await payload.find({
    collection: 'case-studies',
    where: { slug: { equals: caseStudySlug } },
    limit: 1,
    depth: 0,
  });
  if (existing[0]) {
    console.log(
      `Case study already exists for "${eventSlug}" — slug ${caseStudySlug}, id=${existing[0].id}.`,
    );
    console.log(`Edit at /admin/collections/case-studies/${existing[0].id}`);
    process.exit(0);
  }

  // 3. Resolve client from host partner; fall back to community label.
  const host = (event as { host?: { name?: string } | number | null }).host;
  const client =
    host && typeof host === 'object' && host.name
      ? host.name
      : 'Growth Hub community';

  // 4. Derive a friendly date string for the body skeleton.
  const dateLong = event.date
    ? new Intl.DateTimeFormat('en-AU', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      }).format(new Date(event.date as string))
    : 'Date TBC';
  const location = String(event.location ?? '');
  const audience = String((event as { audience?: string | null }).audience ?? '');

  const data = {
    title: `${String(event.title)} — recap`,
    slug: caseStudySlug,
    client,
    outcome: '↑ Replace with the one-line result',
    body: buildBody({ dateLong, location, audience }),
    status: 'draft' as const,
  };

  // Payload's generated `DraftDataFromCollectionSlug` types Lexical nodes
  // with an open index signature; our typed paragraph helper above has a
  // closed shape. The runtime payload is identical — cast to `any` to
  // bridge the structural-vs-nominal gap. (matches the pattern used in
  // scripts/seed-cbrin-event.ts for the same reason.)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const created = await payload.create({ collection: 'case-studies', data: data as any });
  console.log(
    `Drafted case study /${caseStudySlug} id=${created.id} from event /${eventSlug}.`,
  );
  console.log(`Edit at /admin/collections/case-studies/${created.id}`);
  process.exit(0);
}

main().catch((err) => {
  console.error('[draft-case-study-from-event] failed', err);
  process.exit(1);
});
