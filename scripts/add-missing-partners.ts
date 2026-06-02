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
 * After running, /partners directory shows 41 cards across 6 categories
 * (15 original + 26 stallholders from the 9 July 2026 CBRIN expo).
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
    name: 'Birdeye',
    category: 'technology',
    shape: 'circle',
    region: 'ACT · Global',
    since: '2024',
    description: 'Reputation, reviews and AI-driven customer experience tools that power our Growth and Accelerate packages.',
    contribution: 'Reviews automation · AI customer messaging · listing management',
    howWeWork: 'Bundled into client subscriptions; we configure and support locally.',
    website: 'https://birdeye.com',
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

  // ── Stallholders confirmed for the 9 July 2026 "AI for Small Business"
  //    full-day expo at CBRIN (added Jun 2026). What Works, CBR Innovation
  //    Network and Canberra Business Chamber already appear above, so they
  //    are intentionally omitted here to keep the add-only run a no-op for them.
  {
    name: 'Himayat',
    category: 'community-delivery',
    shape: 'leaf',
    region: 'Canberra ACT',
    since: '2024',
    description: 'Community-led support service and co-host of the Growth Hub, connecting multicultural and migrant founders with the help they need to start and grow.',
    contribution: 'Co-host · community outreach · multicultural engagement',
    howWeWork: 'Joint events, shared outreach, on-the-ground community connection.',
    website: 'https://himayat.com.au',
    order: 16,
  },
  {
    name: 'Small Business Digital',
    category: 'technology',
    shape: 'circle',
    region: 'ACT',
    since: '2026',
    description: 'Digital adoption programs helping small businesses get online and make the most of everyday tools.',
    contribution: 'Digital skills · getting-online support · tooling',
    howWeWork: 'Workshops and help-desk sessions at community events.',
    order: 17,
  },
  {
    name: 'The Mill House Ventures',
    category: 'accelerator-capital',
    shape: 'arc',
    region: 'Queanbeyan NSW',
    since: '2026',
    description: 'Social enterprise and venture support backing purpose-driven founders across the Canberra region.',
    contribution: 'Venture support · social enterprise · mentoring',
    howWeWork: 'Referrals and co-delivered founder programs.',
    order: 18,
  },
  {
    name: 'Asuria',
    category: 'community-delivery',
    shape: 'circle',
    region: 'ACT · National',
    since: '2026',
    description: 'Employment and business-planning provider supporting people into work and self-employment.',
    contribution: 'Business planning · employment pathways · advisory',
    howWeWork: 'Business-planning workshops and one-to-one help desks.',
    order: 19,
  },
  {
    name: 'Navitas Skilled Futures',
    category: 'research-education',
    shape: 'leaf',
    region: 'ACT',
    since: '2026',
    description: 'Skills, training and settlement support helping new arrivals build careers and businesses.',
    contribution: 'Skills training · settlement support · English language',
    howWeWork: 'Co-delivered training and referral pathways.',
    order: 20,
  },
  {
    name: 'Canberra Women in Business',
    category: 'community-delivery',
    shape: 'diamond',
    region: 'ACT',
    since: '2026',
    description: 'Membership network championing women-led businesses across the capital.',
    contribution: 'Networking · mentoring · women in business advocacy',
    howWeWork: 'Joint networking sessions and member promotion.',
    order: 21,
  },
  {
    name: 'Hands Across Canberra',
    category: 'community-delivery',
    shape: 'leaf',
    region: 'ACT',
    since: '2026',
    description: "Canberra's community foundation, funding local charities and grassroots initiatives.",
    contribution: 'Community funding · grants · philanthropy',
    howWeWork: 'Grant pathways and community partnership.',
    order: 22,
  },
  {
    name: 'RKDN',
    category: 'accelerator-capital',
    shape: 'triangle',
    region: 'ACT',
    since: '2026',
    description: 'Advisory and consulting practice supporting business strategy and capability.',
    contribution: 'Advisory · strategy · capability building',
    howWeWork: 'Advisory help desks and co-delivered sessions.',
    order: 23,
  },
  {
    name: 'Canberra Business Advice & Support Service',
    category: 'industry-government',
    shape: 'bars',
    region: 'ACT',
    since: '2026',
    description: 'Free business advisory service helping local operators navigate planning, finance and growth.',
    contribution: 'Business advice · planning support · referrals',
    howWeWork: 'On-site advisory help desk.',
    order: 24,
  },
  {
    name: 'Bendigo Bank',
    category: 'accelerator-capital',
    shape: 'arc',
    region: 'National',
    since: '2026',
    description: 'Community-focused bank supporting local small business with banking and finance.',
    contribution: 'Banking · finance · community investment',
    howWeWork: 'Financial literacy sessions and sponsorship.',
    order: 25,
  },
  {
    name: 'Canberra Multicultural Community Forum',
    category: 'community-delivery',
    shape: 'leaf',
    region: 'ACT',
    since: '2026',
    description: "Peak body connecting Canberra's multicultural communities and organisations.",
    contribution: 'Multicultural engagement · community networks',
    howWeWork: 'Outreach and community connection.',
    order: 26,
  },
  {
    name: 'Multicultural Hub Canberra',
    category: 'community-delivery',
    shape: 'arc',
    region: 'ACT',
    since: '2026',
    description: 'Community hub providing services and connection for multicultural Canberrans.',
    contribution: 'Community services · multicultural support',
    howWeWork: 'Referrals and co-hosted sessions.',
    order: 27,
  },
  {
    name: 'MARSS ACT',
    category: 'community-delivery',
    shape: 'leaf',
    region: 'ACT',
    since: '2026',
    description: 'Migrant and Refugee Settlement Services — settlement support for new arrivals across the ACT.',
    contribution: 'Settlement support · case work · community programs',
    howWeWork: 'Referrals and joint community engagement.',
    order: 28,
  },
  {
    name: 'Australian Red Cross (ACT)',
    category: 'community-delivery',
    shape: 'cross',
    region: 'ACT · National',
    since: '2026',
    description: 'Humanitarian organisation supporting people in need, including migrant and community programs.',
    contribution: 'Community services · humanitarian support',
    howWeWork: 'Community referral and support presence.',
    order: 29,
  },
  {
    name: 'MTC Australia',
    category: 'community-delivery',
    shape: 'circle',
    region: 'ACT · NSW',
    since: '2026',
    description: 'Employment, training and youth services helping people into work and enterprise.',
    contribution: 'Employment services · training · youth support',
    howWeWork: 'Help desks and referral pathways.',
    order: 30,
  },
  {
    name: 'Master Builders Association',
    category: 'industry-government',
    shape: 'bars',
    region: 'ACT',
    since: '2026',
    description: 'Peak body for the building and construction industry in the ACT.',
    contribution: 'Industry support · trades · training',
    howWeWork: 'Trades-focused sessions and member referral.',
    order: 31,
  },
  {
    name: 'ICN',
    category: 'industry-government',
    shape: 'hex',
    region: 'ACT · National',
    since: '2026',
    description: 'Industry Capability Network — connecting businesses to project and supply-chain opportunities.',
    contribution: 'Industry capability · supply chain · introductions',
    howWeWork: 'Opportunity matching and advisory.',
    order: 32,
  },
  {
    name: 'RD Consulting',
    category: 'creative-media',
    shape: 'bars',
    region: 'ACT',
    since: '2026',
    description: 'Marketing and LinkedIn consultancy running our digital marketing and social media sessions.',
    contribution: 'Digital marketing · LinkedIn · social media',
    howWeWork: 'Leads marketing workshops at our events.',
    order: 33,
  },
  {
    name: 'Allara Creative',
    category: 'creative-media',
    shape: 'diamond',
    region: 'ACT',
    since: '2026',
    description: 'Creative studio delivering branding and design for small businesses.',
    contribution: 'Branding · design · creative direction',
    howWeWork: 'Branding sessions and member project rates.',
    order: 34,
  },
  {
    name: "Women's Centre for Health Matters",
    category: 'community-delivery',
    shape: 'circle',
    region: 'ACT',
    since: '2026',
    description: "Advocacy and research organisation focused on women's health and wellbeing in the ACT.",
    contribution: 'Health & wellbeing · advocacy · research',
    howWeWork: 'Wellbeing presence and community connection.',
    order: 35,
  },
  {
    name: 'Catalysr',
    category: 'accelerator-capital',
    shape: 'triangle',
    region: 'National',
    since: '2026',
    description: 'Accelerator empowering migrant and refugee entrepreneurs to build businesses.',
    contribution: 'Acceleration · mentoring · migrant entrepreneurs',
    howWeWork: 'Co-delivered founder programs and referrals.',
    order: 36,
  },
  {
    name: 'Many Rivers',
    category: 'community-delivery',
    shape: 'arc',
    region: 'National',
    since: '2026',
    description: 'Microenterprise development and microfinance support for people starting small businesses.',
    contribution: 'Microenterprise · microfinance · mentoring',
    howWeWork: 'One-to-one business support and help desks.',
    order: 37,
  },
  {
    name: 'Normtech',
    category: 'technology',
    shape: 'hex',
    region: 'ACT',
    since: '2026',
    description: 'IT and cyber security partner running our IT Basics and security sessions.',
    contribution: 'IT support · cyber security · training',
    howWeWork: 'Leads IT & cyber workshops at our events.',
    order: 38,
  },
  {
    name: 'Her Zest',
    category: 'community-delivery',
    shape: 'arc',
    region: 'ACT',
    since: '2026',
    description: 'Network supporting and celebrating women in business across the region.',
    contribution: 'Women in business · networking · mentoring',
    howWeWork: 'Joint networking and member promotion.',
    order: 39,
  },
  {
    name: 'National Self Employment Association',
    category: 'industry-government',
    shape: 'bars',
    region: 'National',
    since: '2026',
    description: 'Peak body advocating for and supporting self-employed Australians.',
    contribution: 'Self-employment advocacy · resources · community',
    howWeWork: 'Resources and advisory presence.',
    order: 40,
  },
  {
    name: 'DEWR',
    category: 'industry-government',
    shape: 'diamond',
    region: 'National',
    since: '2026',
    description: 'Department of Employment and Workplace Relations — federal programs supporting jobs and small business.',
    contribution: 'Government programs · employment · funding',
    howWeWork: 'Program information and referral pathways.',
    order: 41,
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
