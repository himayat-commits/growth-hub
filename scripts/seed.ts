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
        question: 'Can I cancel my subscription at any time?',
        answer: lexicalParagraph('Yes — there are no lock-in contracts. Cancel any time from your dashboard and you keep access until the end of your billing period.'),
        category: 'billing' as const,
        order: 1,
      },
      {
        question: 'Do I need a long-term contract?',
        answer: lexicalParagraph('No contracts required. All plans are month-to-month (or discounted annual). You can upgrade, downgrade, or cancel whenever you like.'),
        category: 'billing' as const,
        order: 2,
      },
      {
        question: 'What is Social AI?',
        answer: lexicalParagraph('Social AI automatically generates and schedules branded social media content using your business details and local events. Our team reviews every post before it goes live.'),
        category: 'features' as const,
        order: 3,
      },
      {
        question: 'How does the Reviews AI work?',
        answer: lexicalParagraph('Reviews AI monitors your Google Business Profile and drafts personalised responses to new reviews within minutes. You approve before anything is posted.'),
        category: 'features' as const,
        order: 4,
      },
      {
        question: 'Is my data stored in Australia?',
        answer: lexicalParagraph('Yes. All data is stored in the Sydney (ap-southeast-2) region. We comply with Australian privacy law and never sell your data.'),
        category: 'technical' as const,
        order: 5,
      },
    ];

    for (const faq of faqs) {
      await payload.create({ collection: 'faqs', data: faq });
    }
    console.log('✅  Created 5 sample FAQs.');
  } else {
    console.log('⏭   FAQs already exist — skipping.');
  }

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
        { label: 'Community', href: '/#community', isExternal: false },
        { label: 'About', href: '/#why', isExternal: false },
        { label: 'FAQ', href: '/#faq', isExternal: false },
        { label: 'Contact', href: '/#contact', isExternal: false },
      ],
      ctaLabel: 'Sign Up Now',
      ctaHref: '/sign-up',
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

  // ── 7. Home page ─────────────────────────────────────────────────────────
  const { totalDocs: existingPages } = await payload.find({
    collection: 'pages',
    where: { slug: { equals: 'home' } },
    limit: 1,
  });

  if (existingPages === 0) {
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
              { title: 'Grow with real support', description: 'Weekly webinars, peer community, and live in-person events. You\'re never doing this alone.' },
              { title: 'Scale when you\'re ready', description: 'Upgrade tiers or add modules as your business grows. No lock-in on self-service.' },
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
                  'We run regular workshops and in-person meetups across Canberra. Some are free and open to everyone, others are reserved just for subscribers. Every event is designed to help local business owners build skills, share wins, and connect with a community that\'s genuinely in their corner.',
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
                  'Part training, part Q&A, part community hangout. Bring your questions, share your wins, and learn what\'s working for other local businesses in the network.',
                features: [
                  { text: 'Platform walkthroughs and feature deep-dives' },
                  { text: 'Practical digital marketing education' },
                  { text: 'Live Q&A with the Himayat team' },
                  { text: 'Recordings available if you can\'t make it live' },
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
          // 9. Final CTA (cta-banner)
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
    console.log('✅  Created home page with 9 blocks.');
  } else {
    console.log('⏭   Home page already exists — skipping.');
  }

  console.log('\n🎉  Seed complete!');
  process.exit(0);
}

seed().catch((err) => {
  console.error('❌  Seed failed:', err);
  process.exit(1);
});
