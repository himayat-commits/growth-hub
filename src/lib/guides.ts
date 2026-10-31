// Growth Hub guides: one free, practical checklist per Session topic, plus a
// Growth Lab prep guide. They're the "three next steps" people take home from a
// Session, and the first thing someone who can't come yet can use.
//
// Content lives here in code, like the season plan in sessions.ts. Facts that
// change (laws, prices, phone numbers) are left to the official sources each
// guide links to; the guides stay on habits that won't date. Re-check the
// links and bump `updated` when you edit a guide.

import type { SessionArea } from '@/lib/sessions';

export type GuideArea = SessionArea | 'Growth Lab';

export interface GuideStep {
  h: string;
  p: string;
}

export interface Guide {
  slug: string;
  area: GuideArea;
  title: string;
  /** One line for cards, meta descriptions and share cards. */
  summary: string;
  /** Rough time to work through the checklist, not to read it. */
  time: string;
  intro: string;
  sections: Array<{ h: string; steps: GuideStep[] }>;
  /** The three next steps handed out at the end of a Session. */
  nextSteps: [string, string, string];
  /** Official or first-party sources; the guide defers to these on detail. */
  sources: Array<{ label: string; href: string }>;
  /** YYYY-MM-DD, the last time the content and links were checked. */
  updated: string;
}

export const GUIDES: Guide[] = [
  {
    slug: 'digital-set-up',
    area: 'Get started',
    title: 'Digital set-up that saves hours',
    summary: 'Email, passwords, files and payments set up once, properly, so admin stops eating your evenings.',
    time: 'One section a week',
    intro:
      'Most owners set up their tech in a hurry, one tool at a time. This checklist puts the basics in order. None of it needs a consultant, and each step pays you back every week after.',
    sections: [
      {
        h: 'Your name and your inbox',
        steps: [
          {
            h: 'Use an email address on your own domain',
            p: 'hello@yourbusiness.com.au looks more trustworthy than a free webmail address, and it stays yours if you change provider. Google Workspace and Microsoft 365 both do this for a monthly fee per person.',
          },
          {
            h: 'Register the domain in the business’s name',
            p: 'A .com.au name needs an Australian connection, such as an ABN. Put it in the business’s name, not your web designer’s, and switch on auto-renew so it never lapses.',
          },
          {
            h: 'Keep one calendar everyone can see',
            p: 'Jobs, bookings and leave in one shared calendar beats three diaries and a whiteboard.',
          },
        ],
      },
      {
        h: 'Passwords and sign-ins',
        steps: [
          {
            h: 'Get a password manager',
            p: 'It remembers a different strong password for every account, so one leaked password doesn’t open everything. Share business logins through it, never by text message.',
          },
          {
            h: 'Turn on multi-factor authentication',
            p: 'Start with your email, then banking and accounting. An authenticator app is safer than a code sent by text.',
          },
          {
            h: 'Write down who can get into what',
            p: 'One page: each account, who can sign in, and where the recovery codes are kept. It turns a lost phone or a staff change into a ten-minute job.',
          },
        ],
      },
      {
        h: 'Files and payments',
        steps: [
          {
            h: 'Put work files in one shared cloud folder',
            p: 'A simple structure (Clients, Money, Marketing, Admin) instead of desktops and USB sticks. It doubles as a copy of your files if a laptop dies.',
          },
          {
            h: 'Connect your bank to your accounting software',
            p: 'Bank feeds bring transactions in by themselves, so bookkeeping becomes matching, not typing.',
          },
          {
            h: 'Make it easy to pay you',
            p: 'Tap to pay on your phone, a payment link on every invoice, and invoices that carry what the ATO asks for. Check the ATO’s page on tax invoices if you’re registered for GST.',
          },
          {
            h: 'Write your templates once',
            p: 'Quote, invoice, welcome email and “here’s what happens next”: written once, reused every time.',
          },
        ],
      },
    ],
    nextSteps: [
      'This week: turn on multi-factor authentication for your email and your bank.',
      'This month: move to a password manager and an email address on your own domain.',
      'Next: put your files in one shared folder and switch on bank feeds.',
    ],
    sources: [
      { label: 'ACSC small business cyber security guide (cyber.gov.au)', href: 'https://www.cyber.gov.au/resources-business-and-government/essential-cyber-security/small-business-cyber-security' },
      { label: 'Tax invoices (ATO)', href: 'https://www.ato.gov.au/businesses-and-organisations/gst-excise-and-indirect-taxes/gst/tax-invoices' },
      { label: 'Rules for .au domain names (auDA)', href: 'https://www.auda.org.au/au-domain-names/au-rules-and-policies/' },
    ],
    updated: '2026-10-29',
  },
  {
    slug: 'be-found-online',
    area: 'Get found',
    title: 'Be found and chosen online',
    summary: 'Your Google Business Profile, your reviews, and a website that turns a search into an enquiry.',
    time: 'An afternoon, then ten minutes a week',
    intro:
      'When someone searches for what you do, three things decide whether they get in touch: whether you show up, what other customers say, and whether your site makes the next step obvious.',
    sections: [
      {
        h: 'Show up on the map',
        steps: [
          {
            h: 'Claim your Google Business Profile',
            p: 'It’s free. Verify it, choose the most specific category you can, and set the area you serve if you go to customers.',
          },
          {
            h: 'Fill in every field',
            p: 'Hours (public holidays too), services with prices or “from” prices, and photos of your work, your team and your front door.',
          },
          {
            h: 'Claim Apple Business Connect and Bing Places too',
            p: 'Some phones, maps and assistants read these instead of Google. Each takes about ten minutes.',
          },
          {
            h: 'Keep your details identical everywhere',
            p: 'The same business name, address and phone number on your profiles, your site, your invoices and every directory.',
          },
        ],
      },
      {
        h: 'Get chosen: reviews',
        steps: [
          {
            h: 'Ask for a review when the job is done',
            p: 'A short message with your review link, sent the same day. Make it a habit, not a campaign.',
          },
          {
            h: 'Keep reviews genuine',
            p: 'Never write reviews yourself, or have family, staff or anyone you pay post them without saying so, and never hide or edit the negative ones. The ACCC sets out the rules.',
          },
          {
            h: 'Reply to every review',
            p: 'Thank people by name. Answer a hard review calmly, once, and offer to sort it out directly. Future customers read your replies.',
          },
        ],
      },
      {
        h: 'Turn a search into an enquiry',
        steps: [
          {
            h: 'Say what you do and where, first',
            p: '“Bathroom renovations in Belconnen and Gungahlin” beats “Welcome to our website”.',
          },
          {
            h: 'Give every page one clear next step',
            p: 'Call, book or get a quote. Pick one, and make it a big button.',
          },
          {
            h: 'Check it on your own phone',
            p: 'Many local searches happen on a phone. Can you tap to call, or book, in one go?',
          },
          {
            h: 'Test your enquiry form every month',
            p: 'Send yourself a message. A broken form loses work without anyone noticing.',
          },
        ],
      },
    ],
    nextSteps: [
      'Today: claim or check your Google Business Profile, and fix your hours.',
      'This week: ask your last five customers for a review.',
      'This month: rewrite the first line of your site to say what you do and where.',
    ],
    sources: [
      { label: 'Google Business Profile', href: 'https://www.google.com/business/' },
      { label: 'Apple Business Connect', href: 'https://businessconnect.apple.com/' },
      { label: 'Bing Places for Business', href: 'https://www.bingplaces.com/' },
      { label: 'Online reviews: the rules for business (ACCC)', href: 'https://www.accc.gov.au/business/advertising-and-promotions/online-reviews-for-product-and-services' },
    ],
    updated: '2026-10-29',
  },
  {
    slug: 'practical-ai',
    area: 'Practical AI',
    title: 'AI tools you’ll use tomorrow',
    summary: 'Fewer tools, used with confidence: where AI saves time in a small business, and where to be careful.',
    time: 'An hour to start, then daily habits',
    intro:
      'You don’t need ten AI subscriptions. One general assistant, used for the right jobs with a few house rules, is enough to start.',
    sections: [
      {
        h: 'Good first jobs for AI',
        steps: [
          {
            h: 'First drafts',
            p: 'Quotes, follow-up emails, job ads, social posts and website copy. It gets you past the blank page; you edit.',
          },
          {
            h: 'Summaries',
            p: 'A long email thread, a tender or meeting notes, boiled down to what you need to do.',
          },
          {
            h: 'Rewrites',
            p: 'Friendlier, shorter or plainer. Useful for customers who read English as a second language. For translations, have a fluent speaker check before you publish.',
          },
          {
            h: 'Ideas, not answers',
            p: 'Ten names for a workshop, five ways to explain your pricing. You pick, and improve.',
          },
        ],
      },
      {
        h: 'House rules',
        steps: [
          {
            h: 'Keep personal information out',
            p: 'Don’t paste customers’ names, contact or health details, or anything said in confidence into a public AI tool. The OAIC has guidance on this.',
          },
          {
            h: 'Check every fact',
            p: 'AI can be confidently wrong about prices, laws, dates and quotes. Check anything a customer will rely on against the source.',
          },
          {
            h: 'Read the data settings',
            p: 'Many business plans let you stop your data being used to train the tool. Check before you rely on it.',
          },
          {
            h: 'Be honest about it',
            p: 'If someone asks whether AI helped write something, say so. Never use it for reviews or testimonials.',
          },
        ],
      },
      {
        h: 'Choose one tool and learn it',
        steps: [
          {
            h: 'Start with one general assistant',
            p: 'ChatGPT, Claude, Copilot and Gemini all do the basics well. Pick the one that fits the email and documents you already use.',
          },
          {
            h: 'Give it your context once',
            p: 'Your services, prices and tone of voice (no personal information), so it writes more like you.',
          },
          {
            h: 'Keep the prompts that work',
            p: 'One shared document: “Write a quote follow-up in our tone: warm, short, no jargon.”',
          },
        ],
      },
    ],
    nextSteps: [
      'This week: have AI draft one email you’ve been putting off, then edit it yourself.',
      'Write your house rules on one page and share them with anyone who helps you.',
      'Save three prompts that worked.',
    ],
    sources: [
      { label: 'Privacy and commercially available AI products (OAIC)', href: 'https://www.oaic.gov.au/privacy/privacy-guidance-for-organisations-and-government-agencies/guidance-on-privacy-and-the-use-of-commercially-available-ai-products' },
      { label: 'Artificial intelligence for business (business.gov.au)', href: 'https://business.gov.au/online-and-digital/artificial-intelligence' },
    ],
    updated: '2026-10-29',
  },
  {
    slug: 'cyber-basics',
    area: 'Stay safe',
    title: 'Cyber basics in an hour',
    summary: 'Multi-factor authentication, updates, backups and scam checks, in plain English.',
    time: 'One hour',
    intro:
      'Most attacks on small businesses aren’t clever. They walk through an unlocked door: a reused password, a missed update, a fake invoice. An hour closes most of those doors.',
    sections: [
      {
        h: 'Lock the front doors',
        steps: [
          {
            h: 'Turn on multi-factor authentication, email first',
            p: 'Your email can reset every other password, so protect it first. Then banking, accounting and social media.',
          },
          {
            h: 'Use a different password everywhere',
            p: 'A password manager makes this painless. Change any password you’ve used on more than one site.',
          },
          {
            h: 'Switch on automatic updates',
            p: 'Phones, laptops, your website and your router. Updates close the holes attackers already know about.',
          },
        ],
      },
      {
        h: 'Have a way back',
        steps: [
          {
            h: 'Back up automatically, somewhere separate',
            p: 'A copy of your important files that updates by itself and isn’t on the same laptop. Restore one file each quarter to prove it works.',
          },
          {
            h: 'Know who to call',
            p: 'Save your bank’s fraud line, your IT helper if you have one, and the Australian Cyber Security Hotline, 1300 CYBER1 (1300 292 371).',
          },
        ],
      },
      {
        h: 'Spot the scam',
        steps: [
          {
            h: 'Check any change of bank details by phone',
            p: 'Invoice scams swap the account number on a real-looking invoice. Call the supplier on a number you already have, not the one in the email.',
          },
          {
            h: 'Slow down when it’s urgent',
            p: 'Scams push you to act now: a parcel fee, a tax debt, a boss who needs gift cards. Hang up, then call back on the official number.',
          },
          {
            h: 'Report it, and act fast if money has gone',
            p: 'Call your bank straight away. Report cybercrime at cyber.gov.au and scams to Scamwatch.',
          },
          {
            h: 'Know your privacy duties',
            p: 'If you hold customers’ details, the OAIC explains what to do if they’re lost or stolen.',
          },
        ],
      },
    ],
    nextSteps: [
      'Today: turn on multi-factor authentication for your email.',
      'This week: check your backups run, and restore one file to prove it.',
      'Save the cyber hotline and your bank’s fraud number in your phone.',
    ],
    sources: [
      { label: 'Small business cyber security guide (cyber.gov.au)', href: 'https://www.cyber.gov.au/resources-business-and-government/essential-cyber-security/small-business-cyber-security' },
      { label: 'Report a cybercrime (cyber.gov.au)', href: 'https://www.cyber.gov.au/submit-a-report' },
      { label: 'Scamwatch', href: 'https://www.scamwatch.gov.au/' },
      { label: 'Notifiable data breaches (OAIC)', href: 'https://www.oaic.gov.au/privacy/notifiable-data-breaches' },
    ],
    updated: '2026-10-29',
  },
  {
    slug: 'choosing-business-software',
    area: 'Run smarter',
    title: 'Choosing business software you’ll use',
    summary: 'Start from the job, not the feature list, then trial it properly and make it stick.',
    time: 'Two weeks per tool',
    intro:
      'Most software that fails in a small business was never set up properly, or was bought for a feature nobody needed. Choose from the job you want done.',
    sections: [
      {
        h: 'Start from the job',
        steps: [
          {
            h: 'Write down the job, not the product',
            p: '“Quote on site and turn it into an invoice” is a job. “CRM” is a category. Jobs make comparisons easy.',
          },
          {
            h: 'Count what it costs you now',
            p: 'If a job takes an hour a week by hand, a tool that costs less than that hour is worth a look.',
          },
          {
            h: 'List what it has to connect to',
            p: 'Usually your accounting software, calendar and payments. Ask whether it connects without a paid add-on.',
          },
        ],
      },
      {
        h: 'Try before you commit',
        steps: [
          {
            h: 'Shortlist three, trial one properly',
            p: 'Two weeks on real work, not a demo.',
          },
          {
            h: 'Ask the boring questions',
            p: 'Monthly or yearly contract? How do I get my data out? Where is it stored? Is there support during our working hours?',
          },
          {
            h: 'Check the price per person',
            p: 'A cheap plan for one can get expensive when you hire.',
          },
        ],
      },
      {
        h: 'Make it stick',
        steps: [
          {
            h: 'Set it up once, properly',
            p: 'Templates, users and your existing data brought across. Block out a morning for it.',
          },
          {
            h: 'Give it one owner',
            p: 'One person who knows it well and keeps it tidy.',
          },
          {
            h: 'Review your subscriptions once a year',
            p: 'Before the end of the financial year, list what you pay for and what you used, and cancel the rest. Keep the records the ATO asks for.',
          },
        ],
      },
    ],
    nextSteps: [
      'List your three most annoying weekly jobs.',
      'Check your bank statement for subscriptions, and cancel one you don’t use.',
      'Trial one tool, for one job, for two weeks.',
    ],
    sources: [
      { label: 'Record keeping for business (ATO)', href: 'https://www.ato.gov.au/businesses-and-organisations/preparing-lodging-and-paying/record-keeping-for-business' },
      { label: 'Digital Solutions advisory services (business.gov.au)', href: 'https://business.gov.au/expertise-and-advice/digital-solutions-australian-small-business-advisory-services' },
    ],
    updated: '2026-10-29',
  },
  {
    slug: 'build-lab-prep',
    area: 'Growth Lab',
    title: 'Get ready for your Growth Lab',
    summary: 'What to bring, and the ten minutes of thinking that make your morning count.',
    time: 'Ten minutes, before the day',
    intro:
      'A Growth Lab is three hours, and you leave with a website that’s live. The owners who get the most from it arrive with their photos on the laptop and a few answers ready.',
    sections: [
      {
        h: 'Bring',
        steps: [
          {
            h: 'A laptop and its charger',
            p: 'A phone or tablet isn’t enough to build on.',
          },
          {
            h: 'Your logo and five good photos, on the laptop',
            p: 'Your work, your place or your team. No logo yet? Your business name in a clean font works well.',
          },
          {
            h: 'Access to your email inbox',
            p: 'Your Growth Hub Sites account is set up with your email address on the day. If you already own a domain, bring the login for wherever it’s registered.',
          },
        ],
      },
      {
        h: 'Think about',
        steps: [
          {
            h: 'What you sell, in one sentence',
            p: 'Plain words, the way you’d say it to a neighbour.',
          },
          {
            h: 'Who it’s for, and where',
            p: 'The customers you want more of, and the suburbs or region you cover.',
          },
          {
            h: 'The one thing a visitor should do',
            p: 'Call, book, ask for a quote or visit. Your site is built around it.',
          },
          {
            h: 'The three questions customers always ask',
            p: 'They become the questions section of your site.',
          },
          {
            h: 'Your actual details',
            p: 'Phone, email, hours and service area. We check every one with you before you publish, so no placeholder text goes live.',
          },
        ],
      },
      {
        h: 'After the morning',
        steps: [
          {
            h: 'Your site stays yours',
            p: 'Your first site is on the Starter plan, on a Growth Hub web address. Keep editing it whenever you like.',
          },
          {
            h: 'Your own domain, when you’re ready',
            p: 'Want yourbusiness.com.au? That comes with Storefront, and you can move up any time.',
          },
        ],
      },
    ],
    nextSteps: [
      'Book your seat and answer the brief questions.',
      'Put your logo and photos in one folder on your laptop.',
      'Write your one-sentence description.',
    ],
    sources: [
      { label: 'Google Business Profile (link it to your new site)', href: 'https://www.google.com/business/' },
      { label: 'Rules for .au domain names (auDA)', href: 'https://www.auda.org.au/au-domain-names/au-rules-and-policies/' },
    ],
    updated: '2026-10-29',
  },
];

export function getGuide(slug: string): Guide | undefined {
  return GUIDES.find((g) => g.slug === slug);
}

/** The guide for a Session topic, or the Growth Lab prep guide. */
export function guideForArea(area: GuideArea | undefined): Guide | undefined {
  return area ? GUIDES.find((g) => g.area === area) : undefined;
}

/** "2026-10-28" → "28 October 2026". */
export function guideUpdated(dateKey: string): string {
  const [y, m, d] = dateKey.split('-').map(Number);
  return new Intl.DateTimeFormat('en-AU', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' }).format(
    new Date(Date.UTC(y, m - 1, d, 12)),
  );
}
