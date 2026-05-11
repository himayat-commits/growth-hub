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

  console.log('\n🎉  Seed complete!');
  process.exit(0);
}

seed().catch((err) => {
  console.error('❌  Seed failed:', err);
  process.exit(1);
});
