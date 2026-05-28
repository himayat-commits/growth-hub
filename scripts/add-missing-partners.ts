/**
 * One-off add-only partner script.
 *
 *   npm run partners:add-missing
 *
 * Idempotent and additive: for each partner listed below, checks whether
 * a row with that exact `name` already exists in the Partners collection.
 * If yes → skip. If no → create. Never edits, never deletes — safe to
 * run against a production DB that already has hand-curated entries.
 *
 * Use case: prod was seeded with 8 partners earlier; the May-2026 mockup
 * refresh in PR #26/#21 expanded the canonical list to 15. Re-running
 * scripts/seed.ts won't add the 7 missing ones because the partners seed
 * is gated on `existingPartners === 0`. This script closes that gap
 * without touching the 8 already there.
 *
 * After running, /partners directory shows 15 cards across 6 categories.
 */
import { getPayload } from 'payload';
import config from '../src/payload.config';

interface PartnerSeed {
  name: string;
  category: 'technology' | 'creative-media' | 'community-delivery' | 'industry-government' | 'accelerator-capital' | 'research-education';
  shape: 'circle' | 'diamond' | 'triangle' | 'leaf' | 'hex' | 'arc' | 'bars' | 'cross';
  region: string;
  since: string;
  description: string;
  contribution: string;
  howWeWork: string;
  website?: string;
  featured?: boolean;
  order: number;
}

// Mirrors the May-2026 mockup (also the canonical list in scripts/seed.ts).
// If you add/remove from this list, update seed.ts to keep them in lock-step.
const PARTNERS: PartnerSeed[] = [
  // Technology
  {
    name: 'Small Business Digital',
    category: 'technology',
    shape: 'circle',
    region: 'Australia',
    since: '2025',
    description: 'Digital-readiness programs and tooling for small business — built for the people we serve.',
    contribution: 'Digital programs · capability uplift · operator coaching',
    howWeWork: 'Co-delivered cohorts and joint clinics for our members.',
    featured: true,
    order: 1,
  },
  {
    name: 'What Works',
    category: 'technology',
    shape: 'cross',
    region: 'Sydney',
    since: '2025',
    description: 'AI workflow studio. We co-design lightweight automations for small-business operations.',
    contribution: 'AI workflows · ops automation · staff training',
    howWeWork: 'Joint discovery sessions; build-and-handover engagements.',
    featured: true,
    order: 2,
  },
  {
    name: 'Stitch Analytics',
    category: 'technology',
    shape: 'bars',
    region: 'Melbourne',
    since: '2025',
    description: 'Privacy-first analytics so members can read their own data without a degree in dashboards.',
    contribution: 'GA4 alternative · plain-English reporting',
    howWeWork: 'White-labelled inside our member portal.',
    order: 3,
  },

  // Creative & Media
  {
    name: 'Hue & Cue Studio',
    category: 'creative-media',
    shape: 'diamond',
    region: 'Canberra',
    since: '2024',
    description: 'Boutique brand & photography studio. They lead our visual refresh sprints for members.',
    contribution: 'Brand · photography · campaign art direction',
    howWeWork: 'Project rates discounted for Growth Hub members.',
    order: 4,
  },
  {
    name: 'Riverline Films',
    category: 'creative-media',
    shape: 'triangle',
    region: 'ACT',
    since: '2025',
    description: 'Documentary-style video for small businesses. Quietly excellent. Allergic to cliché.',
    contribution: 'Founder films · social cutdowns · community storytelling',
    howWeWork: 'Co-funded shoots for community campaigns.',
    order: 5,
  },
  {
    name: 'Foundry Sound',
    category: 'creative-media',
    shape: 'hex',
    region: 'Canberra',
    since: '2025',
    description: 'Podcast production house. Co-host of our "Local & Loud" series.',
    contribution: 'Podcast production · audio editing · distribution',
    howWeWork: 'Member rate; joint episodes funded by Growth Hub.',
    order: 6,
  },

  // Community & Delivery
  {
    name: 'Muslim Community Co-op',
    category: 'community-delivery',
    shape: 'leaf',
    region: 'Canberra',
    since: '2023',
    description: 'Long-standing community partner. Trusted referral channel into the businesses we serve.',
    contribution: 'Outreach · translation · cultural advisory',
    howWeWork: 'Shared events, joint outreach, paid community workshops.',
    featured: true,
    order: 7,
  },
  {
    name: 'New Roots Network',
    category: 'community-delivery',
    shape: 'arc',
    region: 'ACT',
    since: '2024',
    description: 'Refugee and newcomer business support. We host their digital clinics.',
    contribution: 'Referrals · mentorship · cultural brokering',
    howWeWork: 'Monthly clinics at our Moore St space.',
    order: 8,
  },

  // Industry & Government
  {
    name: 'CBR Innovation Network',
    category: 'industry-government',
    shape: 'hex',
    region: 'ACT',
    since: '2024',
    description: 'Connector across the Canberra innovation ecosystem. Our front door to the wider sector.',
    contribution: 'Introductions · co-marketing · venue support',
    howWeWork: 'Joint programming and member pipeline.',
    website: 'https://cbrin.com.au',
    featured: true,
    order: 9,
  },
  {
    name: 'ACT Government',
    category: 'industry-government',
    shape: 'diamond',
    region: 'ACT',
    since: '2023',
    description: 'Funding partner for our community employment pathways and accessibility programs.',
    contribution: 'Grant funding · policy guidance · access to programs',
    howWeWork: 'Annual grant agreements; outcomes reporting.',
    featured: true,
    order: 10,
  },
  {
    name: 'Canberra Business Chamber',
    category: 'industry-government',
    shape: 'bars',
    region: 'ACT',
    since: '2024',
    description: 'Local advocacy and business support. We host joint events for new operators.',
    contribution: 'Member benefits · advocacy · referral',
    howWeWork: 'Cross-membership pricing for small businesses.',
    website: 'https://canberrabusiness.com',
    featured: true,
    order: 11,
  },

  // Accelerator & Capital
  {
    name: 'GRIFFIN Accelerator',
    category: 'accelerator-capital',
    shape: 'triangle',
    region: 'Canberra',
    since: '2024',
    description: 'Startup accelerator. They take our high-growth members further when the timing is right.',
    contribution: 'Coaching · investor access · alumni network',
    howWeWork: 'Warm introductions, joint mentor pool.',
    featured: true,
    order: 12,
  },
  {
    name: 'Lighthouse Business',
    category: 'accelerator-capital',
    shape: 'arc',
    region: 'ACT',
    since: '2024',
    description: 'Advisory practice for owner-operated firms. Strategy that fits a 7-person team.',
    contribution: 'Strategy · finance · governance',
    howWeWork: 'Subsidised advisory hours for members.',
    website: 'https://lighthousebusiness.com.au',
    order: 13,
  },

  // Research & Education
  {
    name: 'ANU Centre for Social Impact',
    category: 'research-education',
    shape: 'circle',
    region: 'Canberra',
    since: '2024',
    description: 'Independent measurement of our social return. They keep us honest.',
    contribution: 'SROI · evaluation · published research',
    howWeWork: 'Annual evaluation engagement, open reporting.',
    order: 14,
  },
  {
    name: 'CIT Solutions',
    category: 'research-education',
    shape: 'leaf',
    region: 'ACT',
    since: '2025',
    description: 'Vocational training partner. Pathway from our community programs into accredited courses.',
    contribution: 'Accredited training · recognition of prior learning',
    howWeWork: 'Stipended placements for community members.',
    order: 15,
  },
];

async function run() {
  console.log('🌱  add-missing-partners: starting…');
  const payload = await getPayload({ config });

  let created = 0;
  let skipped = 0;

  for (const p of PARTNERS) {
    // Idempotency check: do we already have a partner with this exact name?
    const existing = await payload.find({
      collection: 'partners',
      where: { name: { equals: p.name } },
      limit: 1,
      depth: 0,
    });

    if (existing.totalDocs > 0) {
      console.log(`⏭   ${p.name} — already exists, skipping.`);
      skipped++;
      continue;
    }

    await payload.create({
      collection: 'partners',
      data: {
        ...p,
        status: 'published',
      },
    });
    console.log(`✅  ${p.name} — created.`);
    created++;
  }

  console.log(`\nDone. Created: ${created}. Skipped (already existed): ${skipped}.`);
  if (created > 0) {
    console.log('\nRun /api/revalidate?tag=partners to surface the new entries immediately,');
    console.log('or wait for the 1h cache TTL.');
  }
}

run()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('add-missing-partners failed:', err);
    process.exit(1);
  });
