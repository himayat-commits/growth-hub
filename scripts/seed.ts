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
              'We make that happen. AI-powered digital marketing with real, local support, so you grow confidently — knowing every subscription fuels employment pathways in our community.',
            ctaLabel: 'View Packages',
            ctaHref: '#packages',
            secondaryCtaLabel: 'Learn More',
            secondaryCtaHref: '#how',
            chips: [
              { text: '30+ local businesses supported' },
              { text: 'Community included' },
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
              { title: 'Grow with real support', description: "Weekly webinars, peer community, and live in-person events. You're never doing this alone." },
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
                  { text: 'Practical digital marketing education' },
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
                panelHeading: 'Real humans, real help',
                panelDescription:
                  'Stuck on something? Email us and a real human from the Himayat team will get back to you. No ticket queues, no offshore call centres, no chatbots pretending to help.',
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
              "Growth Hub didn't just set up our digital marketing. They introduced us to a community of other local business owners. We've never felt alone in this.",
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
            ctaHref: '#contact',
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
              { text: "Big agencies overlook small, diverse businesses. We don't. We combine powerful AI tools with real, accessible community support, so you grow with a team that actually gets it." },
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
              'Talk to someone who gets it. No sales pitch, no pressure. Just a real conversation about where your business is and what would actually help.',
            ctaLabel: 'Contact Us',
            ctaHref: 'mailto:hello@himayat.com.au?subject=Growth%20Hub%20Enquiry',
            secondaryCtaLabel: 'Sign Up Now',
            secondaryCtaHref: '#contact',
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
      heroHeading: 'Better together.',
      heroSubheading:
        'We partner with technology providers, community organisations, funding bodies, and business support services that share our commitment to local growth and real community impact.',
      heroCtaLabel: 'Become a Partner',
      heroCtaHref: '#become',
      heroSecondaryCtaLabel: 'View Directory',
      heroSecondaryCtaHref: '#directory',
      heroChips: [
        { text: 'Canberra-based ecosystem' },
        { text: 'Social Traders Verified' },
        { text: 'Community-first' },
      ],
      featuredWallHeading: 'The network behind the network.',
      featuredWallLead: '',
      directoryHeading: 'Meet our partners.',
      directoryLead: '',
      benefitsHeading: 'Why partner with Growth Hub?',
      benefitsLead: '',
      benefits: [
        {
          tag: '01 — Reach',
          heading: 'Access a growing network of local businesses.',
          body: 'Growth Hub puts your brand, services, and expertise in front of 30+ local business owners and a rapidly growing subscriber base — all actively seeking trusted partners.',
          handnote: 'Grow your pipeline.',
        },
        {
          tag: '02 — Purpose',
          heading: 'Partner with a certified social enterprise.',
          body: 'Every Growth Hub subscription funds employment pathways for people facing barriers. When you partner with us, your brand is visibly aligned with real community impact — not just a logo on a wall.',
          handnote: 'Do business differently.',
        },
        {
          tag: '03 — Co-creation',
          heading: 'Build something together.',
          body: "We're always looking for partners who want to co-create. Whether it's a joint workshop, a bundled offer, or a community event, we'll work with you to create genuine value for our shared audience.",
          handnote: 'More than a listing.',
        },
      ],
      proofHeading: 'Impact by the numbers.',
      proofLead: '',
      proofStats: [
        {
          tag: 'Community',
          num: '400+',
          unit: 'people',
          heading: 'People supported across our programs.',
          body: 'Employment pathways, digital training, and wraparound support for people facing real barriers.',
        },
        {
          tag: 'Events',
          num: '50+',
          unit: 'events',
          heading: 'Community events delivered.',
          body: 'Workshops, networking meetups, and in-person training sessions across Canberra.',
        },
        {
          tag: 'Economy',
          num: '$400K',
          unit: 'in wages',
          heading: 'Direct wages to underemployed community members.',
          body: 'Every Growth Hub subscription contributes to real employment outcomes in the local community.',
        },
      ],
      proofQuotes: [
        {
          text: "Partnering with Himayat has been one of the most rewarding decisions we've made. They genuinely care about the people they work with.",
          attribution: 'A Canberra Community Partner',
        },
        {
          text: "Growth Hub brought us closer to the local business community. The network effect has been real — we've seen referrals we wouldn't have had otherwise.",
          attribution: 'A Technology Partner',
        },
      ],
      becomeHeading: 'Become a partner.',
      becomeBody:
        "We're always looking for aligned organisations to grow with. Whether you're a technology provider, a community organisation, a funding body, or a business support service, there's a place for you in the Growth Hub network.",
      becomeBullets: [
        { text: 'Co-marketing and co-branding opportunities' },
        { text: 'Access to a growing network of local business owners' },
        { text: 'Genuine community impact — visible and measurable' },
        { text: 'Featured placement on our /partners page' },
      ],
      becomeCtaLabel: 'Get in touch',
      becomeCtaHref: 'mailto:hello@himayat.com.au?subject=Partnership%20Enquiry',
      becomeSecondaryCtaLabel: 'View packages',
      becomeSecondaryCtaHref: '/#packages',
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
        title: 'The Small Business Journey',
        slug: 'small-business-journey',
        description:
          'A full-day program of talks, workshops and help-desks for people starting, running and growing small businesses in Canberra. With dedicated tracks for diverse founders, tradies and community-service operators.',
        date: inDays(120).toISOString(),
        dateDisplay: 'Date to be confirmed',
        time: '9am – late',
        type: 'community' as const,
        category: 'summit' as const,
        tag: 'Annual Summit',
        audience: 'Small & emerging business',
        cost: 'Free',
        location: 'Canberra ACT',
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

  console.log('\n🎉  Seed complete!');
  process.exit(0);
}

seed().catch((err) => {
  console.error('❌  Seed failed:', err);
  process.exit(1);
});
