/**
 * Payload CMS seed script.
 * Run with: npm run seed
 *
 * Idempotent — skips any collection that already has documents.
 * Requires DATABASE_URL, PAYLOAD_SECRET, and optionally PAYLOAD_SEED_EMAIL /
 * PAYLOAD_SEED_PASSWORD in your .env.local.
 */
import { getPayload } from 'payload';
import config from '../src/payload.config';

const SEED_EMAIL = process.env.PAYLOAD_SEED_EMAIL ?? 'admin@himayat.com.au';
const SEED_PASSWORD = process.env.PAYLOAD_SEED_PASSWORD ?? 'changeme-replace-me!';

// Minimal Lexical JSON for a single paragraph of plain text.
function lexicalParagraph(text: string) {
  return {
    root: {
      type: 'root',
      version: 1,
      direction: 'ltr' as const,
      format: '' as const,
      indent: 0,
      children: [
        {
          type: 'paragraph',
          version: 1,
          direction: 'ltr' as const,
          format: '' as const,
          indent: 0,
          children: [{ type: 'text', text, version: 1 }],
        },
      ],
    },
  };
}

async function seed() {
  console.log('🌱  Starting Payload CMS seed…');
  const payload = await getPayload({ config });

  // ── 1. Admin user ────────────────────────────────────────────────────────
  const { totalDocs: existingUsers } = await payload.find({
    collection: 'users',
    limit: 1,
  });

  if (existingUsers === 0) {
    await payload.create({
      collection: 'users',
      data: {
        name: 'Admin',
        email: SEED_EMAIL,
        password: SEED_PASSWORD,
      },
    });
    console.log(`✅  Created admin user: ${SEED_EMAIL}`);
  } else {
    console.log('⏭   Admin user already exists — skipping.');
  }

  // ── 2. Testimonials ──────────────────────────────────────────────────────
  const { totalDocs: existingTestimonials } = await payload.find({
    collection: 'testimonials',
    limit: 1,
  });

  if (existingTestimonials === 0) {
    await payload.create({
      collection: 'testimonials',
      data: {
        quote: 'Growth Hub transformed our online presence within 3 months. We saw a real uplift in foot traffic and enquiries.',
        author: 'Sarah Chen',
        role: 'Owner',
        company: 'Canteen Lane Café',
        featured: true,
      },
    });
    await payload.create({
      collection: 'testimonials',
      data: {
        quote: 'The reviews AI alone paid for itself in 6 weeks. The Himayat team are genuinely invested in our success.',
        author: 'Mark Tran',
        role: 'Director',
        company: 'ACT Plumbing Solutions',
        featured: true,
      },
    });
    await payload.create({
      collection: 'testimonials',
      data: {
        quote: 'I was sceptical about AI-driven marketing but the Growth Hub team made it simple and the results speak for themselves.',
        author: 'Priya Sharma',
        role: 'Principal',
        company: 'Sharma Financial Planning',
        featured: false,
      },
    });
    console.log('✅  Created 3 sample testimonials.');
  } else {
    console.log('⏭   Testimonials already exist — skipping.');
  }

  // ── 3. FAQs ──────────────────────────────────────────────────────────────
  const { totalDocs: existingFAQs } = await payload.find({
    collection: 'faqs',
    limit: 1,
  });

  if (existingFAQs === 0) {
    const faqs = [
      {
        question: 'Who is Growth Hub for?',
        answer: lexicalParagraph('Growth Hub is built for local, location-based businesses: anyone selling a physical product or service in their area. We work with cafes, trades, clinics, retail shops, salons, and more. Our tools and community are especially valuable for diverse business owners who may be navigating digital marketing for the first time.'),
        category: 'general' as const,
        order: 1,
      },
      {
        question: 'How is Growth Hub different from a regular digital agency?',
        answer: lexicalParagraph("We're a Social Traders Verified social enterprise. That means your subscription doesn't just grow your business; it directly funds employment pathways and digital inclusion programs for people in your community. Plus, our support model is built around community (weekly webinars, peer groups, events), not billable hours."),
        category: 'general' as const,
        order: 2,
      },
      {
        question: 'Can I upgrade my package later?',
        answer: lexicalParagraph('Yes. Self-service tiers (Foundations, Growth, Accelerate) have no lock-in. You can upgrade anytime and your new modules activate immediately. Managed tiers have a 6-month minimum commitment.'),
        category: 'billing' as const,
        order: 3,
      },
      {
        question: 'Can I cancel my subscription at any time?',
        answer: lexicalParagraph('Yes — there are no lock-in contracts. Cancel any time from your dashboard and you keep access until the end of your billing period.'),
        category: 'billing' as const,
        order: 4,
      },
      {
        question: 'What happens in the first month?',
        answer: lexicalParagraph('You get access to onboarding videos for every module in your tier, an invitation to the community groups (Slack, Facebook, WhatsApp), and your first weekly webinar. Managed tier clients also receive a dedicated onboarding call, and Managed Pro/Elite clients get first-month brand and website setup included.'),
        category: 'general' as const,
        order: 5,
      },
      {
        question: 'What is Social AI?',
        answer: lexicalParagraph('Social AI automatically generates and schedules branded social media content using your business details and local events. Our team reviews every post before it goes live.'),
        category: 'features' as const,
        order: 6,
      },
      {
        question: 'What is Agentic AI?',
        answer: lexicalParagraph("Most of the modules powering Growth Hub use Agentic AI, meaning the AI doesn't just suggest actions, it takes them. It writes and publishes social posts, responds to reviews, manages your listings, and captures leads via webchat, all on your behalf."),
        category: 'features' as const,
        order: 7,
      },
      {
        question: 'How does the Reviews AI work?',
        answer: lexicalParagraph('Reviews AI monitors your Google Business Profile and drafts personalised responses to new reviews within minutes. You approve before anything is posted.'),
        category: 'features' as const,
        order: 8,
      },
      {
        question: 'Is my data stored in Australia?',
        answer: lexicalParagraph('Yes. All data is stored in the Sydney (ap-southeast-2) region. We comply with Australian privacy law and never sell your data.'),
        category: 'technical' as const,
        order: 9,
      },
      {
        question: 'How do I learn to use the platform?',
        answer: lexicalParagraph("Every subscriber gets access to our on-demand onboarding video library: short, plain-English walkthroughs covering every feature. You can learn at your own pace, rewatch anytime from your subscriber portal, and new videos unlock as you activate more tools. Prefer learning live? Our weekly subscriber webinar covers the same ground with a real person on the other end of your questions."),
        category: 'general' as const,
        order: 10,
      },
    ];

    for (const faq of faqs) {
      await payload.create({ collection: 'faqs', data: faq });
    }
    console.log('✅  Created 10 FAQs.');
  } else {
    console.log('⏭   FAQs already exist — skipping.');
  }

  // Fetch all FAQ IDs (needed for the FAQ block in pages)
  const { docs: allFAQs } = await payload.find({
    collection: 'faqs',
    sort: 'order',
    limit: 0,
    depth: 0,
  });
  const faqIds = allFAQs.map((f) => f.id);

  // ── 4. Site Settings global ──────────────────────────────────────────────
  await payload.updateGlobal({
    slug: 'site-settings',
    data: {
      siteName: 'Growth Hub by Himayat',
      tagline: 'Your business deserves to grow.',
      supportEmail: 'hello@himayat.com.au',
      phone: '02 5119 0005',
      address: 'Level 4, 1 Moore St, Canberra ACT 2601',
      socialLinks: {
        linkedin: 'https://linkedin.com/company/himayat',
        instagram: 'https://instagram.com/himayat',
        facebook: '',
        twitter: '',
      },
    },
  });
  console.log('✅  Updated SiteSettings global.');

  // ── 5. Navigation global ─────────────────────────────────────────────────
  await payload.updateGlobal({
    slug: 'navigation',
    data: {
      navItems: [
        { label: 'Packages', href: '/#packages', isExternal: false },
        { label: 'Events', href: '/events', isExternal: false },
        { label: 'Partners', href: '/partners', isExternal: false },
        { label: 'About', href: '/#why', isExternal: false },
        { label: 'FAQ', href: '/pricing#faq', isExternal: false },
        { label: 'Contact', href: '/#contact', isExternal: false },
      ],
      ctaLabel: 'Sign Up Now',
      ctaHref: '/sign-up?redirect_url=%2Fportal',
    },
  });
  console.log('✅  Updated Navigation global.');

  // ── 6. Announcement Bar global ───────────────────────────────────────────
  await payload.updateGlobal({
    slug: 'announcement-bar',
    data: {
      enabled: false,
      message: 'New: Search AI add-on now available for Growth & Accelerate plans.',
      linkText: 'Learn more',
      linkHref: '/pricing',
      bgColor: '#0D3F48',
    },
  });
  console.log('✅  Updated AnnouncementBar global.');

  // ── 7. SignupPageContent global ──────────────────────────────────────────
  await payload.updateGlobal({
    slug: 'signup-page-content',
    data: {
      foundations: {
        title: 'Get online. Get noticed.',
        tagline: "You're a step away from a real team in your corner.",
        features: [
          { text: 'Invoicing' },
          { text: 'Social AI: content creation & scheduling' },
          { text: 'Listing AI: 50+ directory management' },
          { text: 'Messaging: unified inbox for all channels' },
          { text: 'Community + weekly webinars included' },
        ],
        addon: '',
        trustItems: [
          { text: 'Social Traders Verified social enterprise' },
          { text: 'No lock-in — cancel any time' },
          { text: 'Canberra-based support team' },
        ],
      },
      growth: {
        title: 'Build trust. Build reputation.',
        tagline: "You're a step away from a real team in your corner.",
        features: [
          { text: 'Everything in Foundations' },
          { text: 'Timesheets & Docketing' },
          { text: 'Reviews AI: automated generation & responses' },
          { text: 'Review Collateral Kit: QR cards, badges, templates' },
        ],
        addon: 'Add Search AI from $99/mo',
        trustItems: [
          { text: 'Social Traders Verified social enterprise' },
          { text: 'No lock-in — cancel any time' },
          { text: 'Canberra-based support team' },
        ],
      },
      accelerate: {
        title: 'Convert visitors into customers.',
        tagline: "You're a step away from a real team in your corner.",
        features: [
          { text: 'Everything in Growth' },
          { text: 'Scheduling + Rostering' },
          { text: 'Webchat AI (Robin): 24/7 lead capture' },
          { text: 'Campaign Templates: SMS & email automation' },
        ],
        addon: 'Add Referrals from $175/mo',
        trustItems: [
          { text: 'Social Traders Verified social enterprise' },
          { text: 'No lock-in — cancel any time' },
          { text: 'Canberra-based support team' },
        ],
      },
    },
  });
  console.log('✅  Updated SignupPageContent global.');

  // ── 8. Home page ─────────────────────────────────────────────────────────
  const { totalDocs: existingHomePages } = await payload.find({
    collection: 'pages',
    where: { slug: { equals: 'home' } },
    limit: 1,
  });

  if (existingHomePages === 0) {
    await payload.create({
      collection: 'pages',
      data: {
        title: 'Home',
        slug: 'home',
        status: 'published',
        layout: [
          // 1. Hero
          {
            blockType: 'hero',
            eyebrow: 'A Social Traders Verified Enterprise',
            heading: 'Your business deserves to grow.',
            handnote: 'Grow local. Grow together.',
            subheading:
              "We make that happen — with one platform to run the day-to-day and grow what's next: work management, AI-powered marketing, and a community of local owners in your corner. And every subscription helps create local jobs.",
            ctaLabel: 'View Packages',
            ctaHref: '#packages',
            secondaryCtaLabel: 'Learn More',
            secondaryCtaHref: '#how',
            chips: [
              { text: 'Run + grow in one place' },
              { text: 'Backed by a local community' },
              { text: 'Canberra-based support' },
            ],
          },
          // 2. Supported By (logo strip with text items)
          {
            blockType: 'logo-strip',
            heading: 'Supported by',
            autoScroll: true,
            textItems: [
              { name: 'Birdeye' },
              { name: 'CBR Innovation Network' },
              { name: 'What Works' },
              { name: 'ACT Government' },
              { name: 'Canberra Business Chamber' },
              { name: 'Lighthouse Business' },
              { name: 'Muslim Community Co-op' },
              { name: 'GRIFFIN Accelerator' },
            ],
          },
          // 3. How It Works
          {
            blockType: 'how-it-works',
            steps: [
              { title: 'Choose your tier', description: 'Self-service to fully managed. Pick the level that fits your business stage and budget.' },
              { title: 'We set you up', description: 'Onboarding videos, platform access, and community groups activated from day one.' },
              { title: 'Grow with momentum', description: 'Weekly webinars, peer groups, and in-person events keep you moving long after setup.' },
              { title: "Scale when you're ready", description: 'Upgrade tiers or add modules as your business grows. No lock-in on self-service.' },
            ],
            imageBadge: 'Live events + webinars',
          },
          // 4. Pricing (heading only — tier data stays in code)
          {
            blockType: 'pricing',
            heading: 'Choose your level of support.',
            showToggle: true,
          },
          // 5. Community
          {
            blockType: 'community',
            heading: "You're not just buying software.",
            subheading: "You're joining a community that has your back.",
            tabs: [
              {
                label: 'In-Person Events',
                slug: 'events',
                badge: 'Free & Subscriber',
                locked: false,
                tagLine: 'In Person · Canberra & Online',
                panelHeading: 'Learn, network and grow together',
                panelDescription:
                  "We run regular workshops and in-person meetups across Canberra. Some are free and open to everyone, others are reserved just for subscribers. Every event is designed to help local business owners build skills, share wins, and connect with a community that's genuinely in their corner.",
                features: [],
              },
              {
                label: 'Weekly Live Webinar',
                slug: 'webinar',
                badge: 'Subscribers Only',
                locked: true,
                tagLine: 'Live · Every Week',
                panelHeading: 'Weekly live sessions with the Himayat team',
                panelDescription:
                  "Part training, part Q&A, part community hangout. Bring your questions, share your wins, and learn what's working for other local businesses in the network.",
                features: [
                  { text: 'Platform walkthroughs and feature deep-dives' },
                  { text: 'Practical marketing and business-tools training' },
                  { text: 'Live Q&A with the Himayat team' },
                  { text: "Recordings available if you can't make it live" },
                ],
              },
              {
                label: 'Community Access',
                slug: 'community',
                badge: 'Subscribers Only',
                locked: true,
                tagLine: 'Peer Support · Always On',
                panelHeading: 'A network of owners who back each other',
                panelDescription:
                  "You're never on your own. The moment you sign up, you're part of a network of Canberra business owners who share advice, refer each other, and celebrate wins together.",
                features: [
                  { text: 'Private Slack workspace for day-to-day questions' },
                  { text: 'Facebook group for wider conversation and wins' },
                  { text: 'WhatsApp group for quick help and local chat' },
                  { text: 'Member-to-member referrals and introductions' },
                ],
              },
              {
                label: 'Email Support',
                slug: 'support',
                badge: 'Subscribers Only',
                locked: true,
                tagLine: '48-Hour Response',
                panelHeading: 'A human on the other end',
                panelDescription:
                  'Stuck on something? Email us and someone from the Himayat team gets back to you. No ticket queues, no offshore call centres, no chatbots pretending to help.',
                features: [
                  { text: 'Platform access and login help' },
                  { text: 'Troubleshooting setup issues' },
                  { text: '48-hour response time across all tiers' },
                  { text: 'Escalation to the Himayat team for anything urgent' },
                ],
              },
            ],
          },
          // 6. Big Quote
          {
            blockType: 'big-quote',
            quote:
              "Growth Hub gave us more than marketing — the tools to run the day-to-day and a community of local owners who've had our back the whole way. We've never felt alone in this.",
            attribution: 'A Local Canberra Business Owner',
            badges: [
              { label: 'Social Traders Verified', icon: 'verified' },
              { label: 'NDIS Registered Provider', icon: 'ndis' },
              { label: 'Canberra-based', icon: 'location' },
            ],
          },
          // 7. Testimonials (references seeded docs — if they exist)
          {
            blockType: 'testimonials',
            ctaLabel: 'Sign Up Now',
            ctaHref: '/sign-up?redirect_url=%2Fportal',
            layout: 'carousel',
          },
          // 8. About
          {
            blockType: 'about',
            sectionLabel: 'About',
            heading: 'Support that starts\nwhere systems stop.',
            subheading: 'With people.',
            paragraphs: [
              { text: "We're a grassroots social enterprise. We started by helping people navigate complex systems that weren't built for them. Now, we bring that same unwavering support to local business owners." },
              { text: "Big agencies overlook small, diverse businesses. We don't. We bring together everything you need to run and grow — work management, AI-powered marketing, and accessible community support — so you grow with a team that gets it." },
            ],
            pullQuote:
              "When you choose Growth Hub, you're not just growing your business. You're partnering with an ecosystem that turns barriers into bridges, creating real jobs in the neighbourhoods we share.",
            stats: [
              { value: '400+', description: 'People supported in our community', tone: 'teal' },
              { value: '50+', description: 'Community events delivered', tone: 'plain' },
              { value: '$400K', description: 'In direct wages to underemployed community members', tone: 'lime' },
              { value: '3:1', description: 'Social return on investment target', tone: 'plain' },
            ],
          },
          // 9. FAQ — seeded with all FAQ docs
          {
            blockType: 'faq',
            heading: 'Common questions.',
            faqs: faqIds,
            category: 'all',
          },
          // 10. Final CTA (cta-banner)
          {
            blockType: 'cta-banner',
            heading: 'Not sure which package is right for you?',
            subheading:
              'Talk to someone who gets it. No sales pitch, no pressure — just a straight conversation about where your business is and what would actually help.',
            ctaLabel: 'Contact Us',
            ctaHref: 'mailto:hello@himayat.com.au?subject=Growth%20Hub%20Enquiry',
            secondaryCtaLabel: 'Sign Up Now',
            secondaryCtaHref: '/sign-up?redirect_url=%2Fportal',
            variant: 'teal',
          },
          // Note: Contact section is always rendered in code — no block needed
        ],
      },
    });
    console.log('✅  Created home page with 10 blocks.');
  } else {
    console.log('⏭   Home page already exists — skipping.');
  }

  // ── 9. Pricing page ──────────────────────────────────────────────────────
  const { totalDocs: existingPricingPages } = await payload.find({
    collection: 'pages',
    where: { slug: { equals: 'pricing' } },
    limit: 1,
  });

  if (existingPricingPages === 0) {
    await payload.create({
      collection: 'pages',
      data: {
        title: 'Pricing',
        slug: 'pricing',
        status: 'published',
        layout: [
          // 1. Pricing block — heading + subheading for the page
          {
            blockType: 'pricing',
            heading: 'Pricing',
            subheading: 'No lock-in. Cancel any time. Switch tiers as your business grows.',
          },
          // 2. FAQ block — references all seeded FAQ docs
          {
            blockType: 'faq',
            heading: 'Common questions.',
            faqs: faqIds,
            category: 'all',
          },
        ],
      },
    });
    console.log('✅  Created pricing page with 2 blocks.');
  } else {
    console.log('⏭   Pricing page already exists — skipping.');
  }

  // ── 10. Partners ─────────────────────────────────────────────────────────
  const { totalDocs: existingPartners } = await payload.find({
    collection: 'partners',
    limit: 1,
  });

  if (existingPartners === 0) {
    // Mirrors the standalone Partners mockup (May 2026) — 6 categories,
    // richer card content with region/since/contribution/howWeWork.
    const partnerData = [
      // Technology
      {
        name: 'Birdeye',
        category: 'technology' as const,
        shape: 'circle' as const,
        region: 'ACT · Global',
        since: '2024',
        description:
          'Reputation, reviews and AI-driven customer experience tools that power our Growth and Accelerate packages.',
        contribution: 'Reviews automation · AI customer messaging · listing management',
        howWeWork: 'Bundled into client subscriptions; we configure and support locally.',
        website: 'https://birdeye.com',
        featured: true,
        order: 1,
        status: 'published' as const,
      },
      {
        name: 'What Works',
        category: 'technology' as const,
        shape: 'cross' as const,
        region: 'Sydney',
        since: '2025',
        description:
          'AI workflow studio. We co-design lightweight automations for small-business operations.',
        contribution: 'AI workflows · ops automation · staff training',
        howWeWork: 'Joint discovery sessions; build-and-handover engagements.',
        featured: true,
        order: 2,
        status: 'published' as const,
      },
      {
        name: 'Stitch Analytics',
        category: 'technology' as const,
        shape: 'bars' as const,
        region: 'Melbourne',
        since: '2025',
        description:
          'Privacy-first analytics so members can read their own data without a degree in dashboards.',
        contribution: 'GA4 alternative · plain-English reporting',
        howWeWork: 'White-labelled inside our member portal.',
        order: 3,
        status: 'published' as const,
      },

      // Creative & Media
      {
        name: 'Hue & Cue Studio',
        category: 'creative-media' as const,
        shape: 'diamond' as const,
        region: 'Canberra',
        since: '2024',
        description:
          'Boutique brand & photography studio. They lead our visual refresh sprints for members.',
        contribution: 'Brand · photography · campaign art direction',
        howWeWork: 'Project rates discounted for Growth Hub members.',
        order: 4,
        status: 'published' as const,
      },
      {
        name: 'Riverline Films',
        category: 'creative-media' as const,
        shape: 'triangle' as const,
        region: 'ACT',
        since: '2025',
        description:
          'Documentary-style video for small businesses. Quietly excellent. Allergic to cliché.',
        contribution: 'Founder films · social cutdowns · community storytelling',
        howWeWork: 'Co-funded shoots for community campaigns.',
        order: 5,
        status: 'published' as const,
      },
      {
        name: 'Foundry Sound',
        category: 'creative-media' as const,
        shape: 'hex' as const,
        region: 'Canberra',
        since: '2025',
        description: 'Podcast production house. Co-host of our "Local & Loud" series.',
        contribution: 'Podcast production · audio editing · distribution',
        howWeWork: 'Member rate; joint episodes funded by Growth Hub.',
        order: 6,
        status: 'published' as const,
      },

      // Community & Delivery
      {
        name: 'Muslim Community Co-op',
        category: 'community-delivery' as const,
        shape: 'leaf' as const,
        region: 'Canberra',
        since: '2023',
        description:
          'Long-standing community partner. Trusted referral channel into the businesses we serve.',
        contribution: 'Outreach · translation · cultural advisory',
        howWeWork: 'Shared events, joint outreach, paid community workshops.',
        featured: true,
        order: 7,
        status: 'published' as const,
      },
      {
        name: 'New Roots Network',
        category: 'community-delivery' as const,
        shape: 'arc' as const,
        region: 'ACT',
        since: '2024',
        description: 'Refugee and newcomer business support. We host their digital clinics.',
        contribution: 'Referrals · mentorship · cultural brokering',
        howWeWork: 'Monthly clinics at our Moore St space.',
        order: 8,
        status: 'published' as const,
      },

      // Industry & Government
      {
        name: 'CBR Innovation Network',
        category: 'industry-government' as const,
        shape: 'hex' as const,
        region: 'ACT',
        since: '2024',
        description:
          'Connector across the Canberra innovation ecosystem. Our front door to the wider sector.',
        contribution: 'Introductions · co-marketing · venue support',
        howWeWork: 'Joint programming and member pipeline.',
        website: 'https://cbrin.com.au',
        featured: true,
        order: 9,
        status: 'published' as const,
      },
      {
        name: 'ACT Government',
        category: 'industry-government' as const,
        shape: 'diamond' as const,
        region: 'ACT',
        since: '2023',
        description:
          'Funding partner for our community employment pathways and accessibility programs.',
        contribution: 'Grant funding · policy guidance · access to programs',
        howWeWork: 'Annual grant agreements; outcomes reporting.',
        featured: true,
        order: 10,
        status: 'published' as const,
      },
      {
        name: 'Canberra Business Chamber',
        category: 'industry-government' as const,
        shape: 'bars' as const,
        region: 'ACT',
        since: '2024',
        description:
          'Local advocacy and business support. We host joint events for new operators.',
        contribution: 'Member benefits · advocacy · referral',
        howWeWork: 'Cross-membership pricing for small businesses.',
        website: 'https://canberrabusiness.com',
        featured: true,
        order: 11,
        status: 'published' as const,
      },

      // Accelerator & Capital
      {
        name: 'GRIFFIN Accelerator',
        category: 'accelerator-capital' as const,
        shape: 'triangle' as const,
        region: 'Canberra',
        since: '2024',
        description:
          'Startup accelerator. They take our high-growth members further when the timing is right.',
        contribution: 'Coaching · investor access · alumni network',
        howWeWork: 'Warm introductions, joint mentor pool.',
        featured: true,
        order: 12,
        status: 'published' as const,
      },
      {
        name: 'Lighthouse Business',
        category: 'accelerator-capital' as const,
        shape: 'arc' as const,
        region: 'ACT',
        since: '2024',
        description:
          'Advisory practice for owner-operated firms. Strategy that fits a 7-person team.',
        contribution: 'Strategy · finance · governance',
        howWeWork: 'Subsidised advisory hours for members.',
        website: 'https://lighthousebusiness.com.au',
        order: 13,
        status: 'published' as const,
      },

      // Research & Education
      {
        name: 'ANU Centre for Social Impact',
        category: 'research-education' as const,
        shape: 'circle' as const,
        region: 'Canberra',
        since: '2024',
        description: 'Independent measurement of our social return. They keep us honest.',
        contribution: 'SROI · evaluation · published research',
        howWeWork: 'Annual evaluation engagement, open reporting.',
        order: 14,
        status: 'published' as const,
      },
      {
        name: 'CIT Solutions',
        category: 'research-education' as const,
        shape: 'leaf' as const,
        region: 'ACT',
        since: '2025',
        description:
          'Vocational training partner. Pathway from our community programs into accredited courses.',
        contribution: 'Accredited training · recognition of prior learning',
        howWeWork: 'Stipended placements for community members.',
        order: 15,
        status: 'published' as const,
      },
    ];

    for (const partner of partnerData) {
      await payload.create({ collection: 'partners', data: partner });
    }
    console.log(`✅  Created ${partnerData.length} sample partners.`);
  } else {
    console.log('⏭   Partners already exist — skipping.');
  }

  // ── 11. PartnersPage global ───────────────────────────────────────────────
  await payload.updateGlobal({
    slug: 'partners-page',
    data: {
      heroEyebrow: 'Strategic Partners',
      heroHeading: "We don't grow alone.",
      heroSubheading:
        'We collaborate with trusted technology, media, creative, and delivery partners to deliver complete solutions — so local businesses get big-agency capability with a community in their corner.',
      heroCtaLabel: 'Become a Partner',
      heroCtaHref: '#become',
      heroSecondaryCtaLabel: 'Meet the partners',
      heroSecondaryCtaHref: '#directory',
      heroChips: [
        { text: '15 active partners' },
        { text: '6 partner categories' },
        { text: 'Canberra & ACT focused' },
      ],
      featuredWallHeading: 'A handful of trusted names that make this work.',
      featuredWallLead:
        'These are the partners we lean on most often — the technology stack, the local institutions, and the community groups that show up alongside us.',
      directoryHeading: 'Browse the partner network.',
      directoryLead:
        'Grouped by what they actually do for our members. Filter to the category you need or scan the whole list — every partner is named, accountable, and reachable.',
      benefitsHeading: 'Six reasons partnerships with us tend to last.',
      benefitsLead:
        'Most "partnership pages" are logo zoos. Ours isn\'t. Here\'s what working alongside Growth Hub actually buys you.',
      benefits: [
        { tag: '01', heading: 'Grow revenue, together.',
          body: 'Reach new buyers through our member base — 30+ active small businesses and counting, with bundled subscriptions and referral fees built in.',
          handnote: 'win + win' },
        { tag: '02', heading: 'Meet underserved audiences.',
          body: "We're the front door for migrant, refugee and culturally diverse business owners across the ACT. That's a market most agencies can't reach.",
          handnote: 'community first' },
        { tag: '03', heading: 'Production & AI support.',
          body: "Tap our in-house team for marketing, content and AI workflow build-out. We'll co-deliver work neither of us could do alone.",
          handnote: 'real hands, not just decks' },
        { tag: '04', heading: 'Co-branded campaigns.',
          body: 'Anchor joint launches, workshops and community events with shared messaging and a Canberra-grounded story.',
          handnote: 'together is louder' },
        { tag: '05', heading: 'Verifiable social impact.',
          body: 'Independently measured SROI through ANU. Your partnership reads cleanly in annual reports, RFPs and grant applications.',
          handnote: 'audit-ready' },
        { tag: '06', heading: 'Long-term relationships.',
          body: "We don't churn. Our oldest partners renew yearly and most expand scope. Slow, deliberate, mutual.",
          handnote: 'in it for the decade' },
      ],
      proofHeading: 'What the partnerships actually delivered.',
      proofLead: '',
      proofStats: [
        { tag: 'Technology partnership', num: '12', unit: 'businesses',
          heading: 'Birdeye × Growth Hub bundle',
          body: 'Twelve members onboarded onto reputation tooling in the first quarter. Average review volume up 3.4× across the cohort.' },
        { tag: 'Creative partnership', num: '8', unit: 'community campaigns',
          heading: 'Riverline Films co-productions',
          body: 'Eight founder films produced for migrant-led businesses in 2025 — distributed through partner channels and ACT Government media.' },
        { tag: 'Government partnership', num: '$180K', unit: 'co-funded',
          heading: 'ACT Government employment pathway',
          body: 'Joint program funded $180K of wages for underemployed community members embedded inside member businesses.' },
      ],
      proofQuotes: [
        { text: "We've worked with a lot of \"community\" partners. Growth Hub is the only one where the spreadsheet and the trust both line up at the end of the year.",
          attribution: 'Director, Industry Partner · Canberra' },
        { text: "They deliver. Quietly. Then they share the credit. It's an unusual combination.",
          attribution: 'Programs Lead, Government Partner · ACT' },
      ],
      becomeHeading: 'Become a Growth Hub partner.',
      becomeBody:
        "A short conversation — what you bring, what you'd need, what success looks like a year from now. If it fits, we'll write you into the next planning round.",
      becomeBullets: [
        { text: 'Reply within 2 business days' },
        { text: 'One call, one page, no pitch deck demanded' },
        { text: 'Pilot scope before any long-term agreement' },
      ],
      becomeCtaLabel: 'Book a partnership call',
      becomeCtaHref: 'mailto:partners@himayat.com.au?subject=Partnership%20Enquiry',
      becomeSecondaryCtaLabel: 'View packages',
      becomeSecondaryCtaHref: '/#packages',
      // Right-side meta panel — editors can edit in /admin without redeploying.
      partnershipLead: 'Amal — Director of Growth',
      partnerEmail: 'partners@himayat.com.au',
      deckUrl: '',
      requirementsUrl: '',
    },
  });
  console.log('✅  Updated PartnersPage global.');

  // ── Events ──────────────────────────────────────────────────────────────────
  const existingEvents = await payload.find({ collection: 'events', limit: 1 });
  if (existingEvents.totalDocs > 0) {
    console.log('⏭   Events already exist — skipping.');
  } else {
    const now = new Date();
    const inDays = (n: number) => new Date(now.getTime() + n * 24 * 60 * 60 * 1000);
    // Includes both the dashboard sample events (type: webinar/workshop/community
    // for the /(app)/my-events RSVP surface) and the public-hub catalogue
    // (category, slug, audience, cost, tag for /(main)/events). One row =
    // one event on both surfaces.
    const sampleEvents = [
      {
        // Canonical flagship summit. Slug matches scripts/seed-cbrin-event.ts
        // (which additionally wires the CBRIN host relationship), so the two
        // seeders upsert the same row rather than creating duplicates. The
        // public landing page is the hand-built static route at
        // /events/entrepreneurship-for-everyone (bespoke → skips [slug]).
        title: 'Entrepreneurship for Everyone',
        slug: 'entrepreneurship-for-everyone',
        description:
          'A free, full-day small-business summit for Canberra — talks, workshops and help-desks for people starting, running and growing small businesses. With dedicated tracks for diverse founders, tradies and community-service operators.',
        date: new Date('2026-07-09T02:30:00.000Z').toISOString(),
        dateDisplay: '',
        time: '9:00 am – 5:00 pm',
        type: 'community' as const,
        category: 'summit' as const,
        tag: 'Free full-day summit',
        audience: 'Small & emerging business',
        cost: 'Free',
        location: 'CBR Innovation Network · Level 5, 1 Moore Street, Canberra ACT',
        featured: true,
        bespoke: true,
      },
      {
        title: 'AI for Small Business — hands-on workshop',
        slug: 'ai-for-small-business',
        description: "Two hours. Real laptops. Real tools. We'll set up an AI customer-message workflow, a reviews responder, and a content drafting helper — and you'll leave with all three working.",
        date: inDays(12).toISOString(),
        time: '10:00am – 12:00pm',
        type: 'workshop' as const,
        category: 'workshop' as const,
        tag: 'Workshop',
        audience: 'Existing owner-operators',
        cost: 'Free for members · $40 guests',
        location: 'Level 4, 1 Moore St · Canberra',
        seats: '12 of 18 spots left',
      },
      {
        title: 'Migrant Founders Mixer',
        slug: 'migrant-founders-mixer',
        description: 'An evening for founders from migrant and refugee backgrounds — short stories from three operators, supper, and a long, unhurried chat. Translators on hand.',
        date: inDays(26).toISOString(),
        time: '5:30pm – 8:00pm',
        type: 'community' as const,
        category: 'mixer' as const,
        tag: 'Mixer',
        audience: 'Migrant & refugee founders',
        cost: 'Free · RSVP',
        location: 'The Loft · Kingston',
      },
      {
        title: 'Tradie Tax Time Bootcamp',
        slug: 'tradie-tax-time-bootcamp',
        description: "BAS, deductions, GST on quotes, and the apps that won't break your morning. Co-hosted with What Works. Bring last quarter's mess.",
        date: inDays(38).toISOString(),
        time: '6:30am – 8:30am',
        type: 'workshop' as const,
        category: 'workshop' as const,
        tag: 'Workshop',
        audience: 'Sole-trader tradies',
        cost: 'Free',
        location: 'Mitchell Trade Hub',
      },
      {
        title: 'Grants & Funding Office Hours',
        slug: 'grants-office-hours',
        description: "Monthly drop-in. Bring a half-written application or a vague idea — we'll help shape it, pressure-test it, and tell you what's competitive this round.",
        date: inDays(47).toISOString(),
        time: '10:00am – 2:00pm',
        type: 'workshop' as const,
        category: 'clinic' as const,
        tag: 'Clinic',
        audience: 'Any stage',
        cost: 'Free · drop in',
        location: 'Level 4, 1 Moore St · Canberra',
      },
      {
        title: "Founders' Yarn — community circle",
        slug: 'founders-yarn',
        description: 'A quiet, structured peer-support circle for owner-operators in their first three years. Same time every fortnight. No pitching, no selling.',
        date: inDays(7).toISOString(),
        dateDisplay: 'Fortnightly · alternating Tuesdays',
        time: '12:30pm – 1:30pm',
        type: 'community' as const,
        category: 'community' as const,
        tag: 'Community',
        audience: 'First 3 years',
        cost: 'Free',
        location: 'Level 4, 1 Moore St · Canberra',
      },
      {
        title: 'Marketing without burnout — for small operators',
        slug: 'marketing-without-burnout',
        description: 'How to run sustainable marketing as a team of one or two — with a content cadence you can actually keep.',
        date: inDays(2).toISOString(),
        time: '12:30 – 1:30pm',
        type: 'webinar' as const,
        category: 'webinar' as const,
        tag: 'Webinar',
        audience: 'Existing owner-operators',
        cost: 'Free',
        seats: '42 spots open',
      },
    ];
    for (const e of sampleEvents) {
      await payload.create({ collection: 'events', data: e });
    }
    console.log(`✅  Created ${sampleEvents.length} sample events.`);
  }

  // ── Resources ──────────────────────────────────────────────────────────────
  const existingResources = await payload.find({ collection: 'resources', limit: 1 });
  if (existingResources.totalDocs > 0) {
    console.log('⏭   Resources already exist — skipping.');
  } else {
    const today = new Date().toISOString();
    const sampleResources = [
      {
        title: 'First steps: define your offer in one sentence',
        tag: 'Guide' as const,
        tone: 'cream' as const,
        meta: '5-min read',
        free: true,
        featured: true,
        publishedAt: today,
      },
      {
        title: 'One-page business canvas — Growth Hub edition',
        tag: 'Template' as const,
        tone: 'lime' as const,
        meta: 'PDF · Editable',
        free: true,
        featured: true,
        publishedAt: today,
      },
      {
        title: 'From idea to first paying customer — 4 modules',
        tag: 'Course' as const,
        tone: 'teal' as const,
        meta: 'Self-paced · 2 hrs',
        free: true,
        featured: false,
        publishedAt: today,
      },
      {
        title: 'Pricing calculator for service businesses',
        tag: 'Template' as const,
        tone: 'cream' as const,
        meta: 'Spreadsheet · A$0',
        free: true,
        featured: false,
        publishedAt: today,
      },
      {
        title: 'How to write an About page people actually read',
        tag: 'Guide' as const,
        tone: 'lav' as const,
        meta: '8-min read',
        free: true,
        featured: false,
        publishedAt: today,
      },
      {
        title: 'Three questions to ask every new customer',
        tag: 'Video' as const,
        tone: 'plum' as const,
        meta: 'Watch · 12 min',
        free: true,
        featured: false,
        publishedAt: today,
      },
      {
        title: 'SEO Foundations — Module 1 free preview',
        tag: 'Course' as const,
        tone: 'teal' as const,
        meta: 'Self-paced · 35 min',
        free: true,
        featured: true,
        publishedAt: today,
      },
      {
        title: 'Discovery call script + question bank',
        tag: 'Template' as const,
        tone: 'lime' as const,
        meta: 'Doc · Editable',
        free: true,
        featured: false,
        publishedAt: today,
      },
    ];
    for (const r of sampleResources) {
      await payload.create({ collection: 'resources', data: r });
    }
    console.log(`✅  Created ${sampleResources.length} sample resources.`);
  }

  // ── Services ────────────────────────────────────────────────────────────────
  const existingServices = await payload.find({ collection: 'services', limit: 1 });
  if (existingServices.totalDocs > 0) {
    console.log('⏭   Services already exist — skipping.');
  } else {
    const sampleServices = [
      {
        title: 'Free Growth Call',
        slug: 'growth-call',
        description:
          'A 30-minute 1:1 with a Growth Strategist. We listen, ask sharp questions and leave you with three concrete next moves.',
        category: 'strategy' as const,
        tone: 'lime' as const,
        icon: 'cal' as const,
        price: 'Complimentary',
        priceLabel: 'first call free',
        ctaLabel: 'Book a time',
        active: true,
        sortOrder: 0,
      },
      {
        title: 'Website Setup & Coaching',
        slug: 'website-setup',
        description:
          'Get a clear, fast website live in 2-3 weeks. We design, write and ship it — and teach you to edit it without us.',
        category: 'build' as const,
        tone: 'teal' as const,
        icon: 'globe' as const,
        price: 'From A$1,950',
        priceLabel: 'fixed project fee',
        ctaLabel: 'Request',
        active: true,
        sortOrder: 10,
      },
      {
        title: 'Marketing Coaching',
        slug: 'marketing-coaching',
        description:
          "Weekly 1:1 strategy with a coach who's run small businesses. We build your 90-day plan and keep you accountable to it.",
        category: 'marketing' as const,
        tone: 'plum' as const,
        icon: 'megaphone' as const,
        price: 'A$390 / mo',
        priceLabel: 'month-to-month',
        ctaLabel: 'Request',
        active: true,
        sortOrder: 20,
      },
      {
        title: 'Branding Workshop',
        slug: 'branding-workshop',
        description:
          'One full day to nail your story, audience and voice. You leave with a brand book, tagline options and a 12-month plan.',
        category: 'strategy' as const,
        tone: 'lav' as const,
        icon: 'type' as const,
        price: 'A$1,200',
        priceLabel: 'one-day intensive',
        ctaLabel: 'Request',
        active: true,
        sortOrder: 30,
      },
      {
        title: 'SEO Foundations',
        slug: 'seo-foundations',
        description:
          'Get found on Google for what your customers actually search. Technical audit, keyword plan and the first 3 articles done.',
        category: 'marketing' as const,
        tone: 'teal' as const,
        icon: 'trend' as const,
        price: 'From A$1,400',
        priceLabel: '6-week sprint',
        ctaLabel: 'Request',
        active: true,
        sortOrder: 40,
      },
      {
        title: 'Social Media Plan',
        slug: 'social-media-plan',
        description:
          'A 90-day content plan in one sitting — channels, themes, posts. Optional add-on for our team to publish for you.',
        category: 'marketing' as const,
        tone: 'plum' as const,
        icon: 'share' as const,
        price: 'A$650',
        priceLabel: 'planning sprint',
        ctaLabel: 'Request',
        active: true,
        sortOrder: 50,
      },
    ];
    for (const s of sampleServices) {
      await payload.create({ collection: 'services', data: s });
    }
    console.log(`✅  Created ${sampleServices.length} sample services.`);
  }

  // ── Case Studies ────────────────────────────────────────────────────────
  // Seed one founding case study (Saffron Bakery — the testimonial source
  // already on the homepage). Idempotent — skips if the slug exists.
  const { totalDocs: existingCaseStudies } = await payload.find({
    collection: 'case-studies',
    where: { slug: { equals: 'saffron-bakery' } },
    limit: 1,
  });
  if (existingCaseStudies === 0) {
    const para = (text: string) => ({
      type: 'paragraph',
      version: 1,
      direction: 'ltr' as const,
      format: '' as const,
      indent: 0,
      children: [{ type: 'text', text, version: 1 }],
    });
    const heading = (text: string) => ({
      type: 'heading',
      tag: 'h2',
      version: 1,
      direction: 'ltr' as const,
      format: '' as const,
      indent: 0,
      children: [{ type: 'text', text, version: 1 }],
    });
    const quote = (text: string) => ({
      type: 'quote',
      version: 1,
      direction: 'ltr' as const,
      format: '' as const,
      indent: 0,
      children: [{ type: 'text', text, version: 1 }],
    });

    await payload.create({
      collection: 'case-studies',
      data: {
        title: "How Saffron Bakery doubled wholesale leads in six months",
        slug: 'saffron-bakery',
        client: 'Saffron Bakery',
        outcome:
          '2× wholesale enquiries · 80 Google reviews (from 12) · ranked top 3 for "Persian bakery Canberra"',
        status: 'published',
        body: {
          root: {
            type: 'root',
            version: 1,
            direction: 'ltr' as const,
            format: '' as const,
            indent: 0,
            children: [
              para(
                "Priya Subramaniam runs Saffron Bakery — a small Persian–Australian bakery in inner south Canberra. When she joined Growth Hub in 2025 she had a single-page Squarespace site, a Facebook page with 800 followers, and a handful of regulars who'd been buying her saffron pastries for years.",
              ),
              para(
                "What she didn't have was a way to convert the steady stream of people who tried her pastries at the Lyneham Sunday market into wholesale enquiries from cafes. \"People kept asking who we supplied,\" she said. \"And I kept giving them my Instagram handle.\"",
              ),
              heading('Where she was stuck'),
              para(
                "Saffron's Google profile was claimed but unmanaged. Twelve reviews, no responses. Listings on the directories that mattered — Beanhunter, Concrete Playground, Time Out Canberra — were either wrong or missing. Wholesale enquiries came through a contact form that emailed an address Priya checked twice a week.",
              ),
              quote(
                "I was working 60 hours making the pastries. I didn't have a 61st hour for marketing.",
              ),
              heading('What changed'),
              para(
                "Over Priya's first three months on Growth (Birdeye-bundled): we set up review automation across Google + Facebook, surfaced 6 dormant directory listings and corrected them, and rebuilt her contact form to fire SMS notifications instead of email. Her reviews AI started prompting happy customers in-person via a QR card at the till.",
              ),
              para(
                "Three months in, reviews went from 12 to 51. We added a second Reviews AI prompt at the end of the wholesale conversation — and a new Google Business product post every two weeks pulled from her existing Instagram (handled by the Social AI module).",
              ),
              heading('Where she is now'),
              para(
                "Six months in: 80 reviews, an average rating that held at 4.9, and ranking in the top 3 for 'Persian bakery Canberra' and 'saffron pastry ACT'. Wholesale enquiries roughly doubled — from 4 a month to 8–10 — and three of those converted to standing weekly orders at local cafes.",
              ),
              quote(
                "Walked in with a half-built website and walked out with the next three things to fix. Every other workshop I've been to is selling something — this one wasn't.",
              ),
              heading('What she said to make us write this'),
              para(
                "We asked Priya whether she'd be open to a case study because she's the kind of operator we built Growth Hub for — making something genuinely good, in a market most agencies overlook, with no time to think about funnels. Her answer was \"yes if it helps another owner with a market stall and no website.\"",
              ),
              para(
                "If that's you: come to a Growth Call or a free clinic. We'll start where you are.",
              ),
            ],
          },
        },
      },
    });
    console.log('✅  Created 1 sample case study (Saffron Bakery).');
  } else {
    console.log('⏭   Saffron Bakery case study already exists — skipping.');
  }

  // ── Additional case studies — trades + community-services personas ─────
  // Each is gated on its own slug so adding new ones to the seed is safe
  // for prod (idempotent per slug). Lexical helpers re-declared inline so
  // this block stands alone if Saffron is ever removed.
  const _para = (text: string) => ({
    type: 'paragraph',
    version: 1,
    direction: 'ltr' as const,
    format: '' as const,
    indent: 0,
    children: [{ type: 'text', text, version: 1 }],
  });
  const _heading = (text: string) => ({
    type: 'heading',
    tag: 'h2',
    version: 1,
    direction: 'ltr' as const,
    format: '' as const,
    indent: 0,
    children: [{ type: 'text', text, version: 1 }],
  });
  const _quote = (text: string) => ({
    type: 'quote',
    version: 1,
    direction: 'ltr' as const,
    format: '' as const,
    indent: 0,
    children: [{ type: 'text', text, version: 1 }],
  });

  // Helper: create a case study if its slug isn't already present.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async function ensureCaseStudy(slug: string, data: any) {
    const existing = await payload.find({
      collection: 'case-studies',
      where: { slug: { equals: slug } },
      limit: 1,
    });
    if (existing.totalDocs > 0) {
      console.log(`⏭   Case study "${slug}" already exists — skipping.`);
      return;
    }
    await payload.create({ collection: 'case-studies', data });
    console.log(`✅  Created case study: ${slug}`);
  }

  // 2. ACT Plumbing Solutions — trades persona. Sourced from the homepage
  //    testimonial ("Reviews AI alone paid for itself in 6 weeks").
  await ensureCaseStudy('act-plumbing-solutions', {
    title: 'How ACT Plumbing Solutions stopped chasing reviews and started winning them',
    slug: 'act-plumbing-solutions',
    client: 'ACT Plumbing Solutions',
    outcome:
      '5× review rate · $4K avg job size up 35% · top-3 ranking for "emergency plumber Canberra"',
    status: 'published',
    body: {
      root: {
        type: 'root',
        version: 1,
        direction: 'ltr' as const,
        format: '' as const,
        indent: 0,
        children: [
          _para(
            "Mark Tran runs ACT Plumbing Solutions — a five-tradie operation based in Mitchell that covers emergency call-outs across the north of Canberra. When he came to a Growth Hub workshop in late 2024, he had 22 Google reviews built up over four years and a website his nephew made in 2019.",
          ),
          _para(
            "His problem wasn't lead volume. His problem was that the leads he got were price-shoppers — people calling three plumbers and picking the cheapest. Mark wanted to be the choice that came up first, with the rating that justified the call-out fee.",
          ),
          _heading('Where he was stuck'),
          _para(
            "Mark was already a Birdeye customer through another agency, but the seat had gone dormant — nobody was setting up review prompts, nobody was responding to the reviews that came in. His after-job SMS confirmation didn't include a review link. His Google Business Profile had photos from 2020.",
          ),
          _quote(
            "I was going to cancel Birdeye. Couldn't see what I was paying for. The Growth Hub team set it up properly in a single morning.",
          ),
          _heading('What changed'),
          _para(
            "We switched him onto our Growth tier, which bundles Birdeye into a managed configuration: review prompts now fire automatically two hours after every job, the responses are drafted by Reviews AI and approved by Mark in under a minute via the mobile dashboard, and the GBP gets a fresh job-site photo every fortnight (uploaded by the apprentices, sorted by Social AI).",
          ),
          _para(
            "We also rewrote his pricing page. Mark agreed to publish call-out fees and after-hours rates — most plumbers won't, and the price-shoppers self-filtered.",
          ),
          _heading('Where he is now'),
          _para(
            "Six months in: reviews went from 22 to 138. Average rating held at 4.8. Mark ranks top-3 on Google Maps for \"emergency plumber Canberra\" and #1 for \"24 hour plumber Mitchell\". Average job size up 35% because the cheapest-three calls dropped off — those leads now go to other tradies, and the leads who reach him are people who chose him on the rating.",
          ),
          _quote(
            "The reviews AI alone paid for itself in 6 weeks. The Himayat team are genuinely invested in our success.",
          ),
          _heading('What he said to make us write this'),
          _para(
            "We asked Mark whether he'd be open to a case study because his story directly contradicts the assumption that AI tools are for big businesses with marketing budgets. He runs five tradies and a ute. He said yes \"if it helps another sparky or plumber stop giving away $80 jobs.\"",
          ),
          _para(
            "If that's you: come to a Tradie Tax Time Bootcamp or book a 30-minute Growth Call. We'll look at your Google profile together.",
          ),
        ],
      },
    },
  });

  // 3. NorthLine Care — NDIS / community-services persona. Sourced from
  //    the events testimonial about the grants office hours.
  await ensureCaseStudy('northline-care', {
    title: 'How NorthLine Care won $180K in funding without hiring a grant writer',
    slug: 'northline-care',
    client: 'NorthLine Care',
    outcome:
      '$180K in successful grants over 8 months · 3 new NDIS participants/month · own a clear digital front door',
    status: 'published',
    body: {
      root: {
        type: 'root',
        version: 1,
        direction: 'ltr' as const,
        format: '' as const,
        indent: 0,
        children: [
          _para(
            "Tara Whittaker founded NorthLine Care in 2023 — an NDIS-registered support coordination practice serving Belconnen and Gungahlin. When she came to us in early 2025 she was a one-person operation supporting 14 participants, a long Facebook waitlist, and a recurring grant rejection problem: she'd write applications late at night between client visits and lose every one to providers with dedicated grant writers.",
          ),
          _heading('Where she was stuck'),
          _para(
            "Tara's positioning was clear in her head and invisible online. Her website was a one-pager built in Wix; her LinkedIn presence was a personal profile with no business posts; her grant applications copy-pasted boilerplate from her registration paperwork.",
          ),
          _quote(
            "The applications I sent felt indistinguishable from anyone else's. I knew our model was different. I couldn't get that across in 400 words at midnight.",
          ),
          _heading('What changed'),
          _para(
            "Tara joined the monthly Grants & Funding Office Hours at Growth Hub. We didn't write applications for her — we re-scoped the ones already in her drawer. Her ACT Community Services grant got restructured around outcomes (number of participants moved off crisis support, hours of carer respite delivered) rather than activities. Submitted in March. Funded in June.",
          ),
          _para(
            "In parallel we rebuilt her web presence. NorthLine moved onto our Foundations tier — Social AI now publishes one LinkedIn post per week pulled from a topic queue Tara approves monthly; Listing AI ensures NorthLine appears correctly across the 30+ NDIS-adjacent directories that participants and coordinators search; the website rewrite focused on the three referral pathways (self-managed participants, plan managers, and aged-care discharge planners) with a separate landing page for each.",
          ),
          _heading('Where she is now'),
          _para(
            "Eight months in: $180K in funding across three successful applications (ACT Community Services, Hands Across Canberra, a small private foundation). NorthLine now onboards three new participants per month — steady, predictable — and Tara has hired a part-time support coordinator.",
          ),
          _para(
            "More importantly: Tara stopped writing grants at midnight. Each application now starts from a working template she keeps in her Growth Hub member portal, populated with the latest outcomes data from her own service.",
          ),
          _quote(
            "Showed up to office hours with a grant draft that wasn't going anywhere. Left with a re-scoped application that got funded six weeks later.",
          ),
          _heading('What she said to make us write this'),
          _para(
            "We asked Tara whether she'd be open to a case study because she's exactly the kind of community-services operator the Growth Hub model exists to serve — small, registered, locally trusted, and locked out of the marketing-spend tier where most NDIS competitors play. Her answer was \"yes if it tells other sole-practitioners they don't need to hire a grant writer to fund the work they're already doing.\"",
          ),
          _para(
            "If that's you: the next Grants & Funding Office Hours is on the events page. Drop in with whatever you have.",
          ),
        ],
      },
    },
  });

  console.log('\n🎉  Seed complete!');
  process.exit(0);
}

seed().catch((err) => {
  console.error('❌  Seed failed:', err);
  process.exit(1);
});
