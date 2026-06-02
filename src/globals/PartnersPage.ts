/**
 * PartnersPage global
 *
 * Stores all CMS-editable copy for the /partners page.
 * Partner directory entries live in the Partners collection.
 */
import type { GlobalConfig } from 'payload';
import { revalidate } from '../lib/cms/revalidate.ts';

export const PartnersPage: GlobalConfig = {
  slug: 'partners-page',
  admin: { group: 'Site' },
  fields: [
    // ── Hero ──────────────────────────────────────────────────────────────
    {
      type: 'collapsible',
      label: 'Hero',
      fields: [
        {
          name: 'heroEyebrow',
          type: 'text',
          defaultValue: 'Strategic Partners',
        },
        {
          name: 'heroHeading',
          type: 'text',
          defaultValue: 'Better together.',
        },
        {
          name: 'heroSubheading',
          type: 'text',
          admin: { description: 'Paragraph below the heading' },
        },
        {
          name: 'heroCtaLabel',
          type: 'text',
          defaultValue: 'Become a Partner',
        },
        {
          name: 'heroCtaHref',
          type: 'text',
          defaultValue: '#become',
        },
        {
          name: 'heroSecondaryCtaLabel',
          type: 'text',
          defaultValue: 'View Directory',
        },
        {
          name: 'heroSecondaryCtaHref',
          type: 'text',
          defaultValue: '#directory',
        },
        {
          name: 'heroTertiaryCtaLabel',
          type: 'text',
          defaultValue: 'Refer a partner',
          admin: { description: 'Optional third hero CTA. Defaults to "Refer a partner".' },
        },
        {
          name: 'heroTertiaryCtaHref',
          type: 'text',
          admin: {
            description:
              'Where the tertiary CTA points. Defaults to mailto: the site support email with a Partner referral subject.',
          },
        },
        {
          name: 'heroTertiaryCtaHint',
          type: 'text',
          defaultValue: '— know someone we should meet?',
          admin: { description: 'Small grey hint shown after the tertiary CTA label.' },
        },
        {
          name: 'heroChips',
          type: 'array',
          fields: [{ name: 'text', type: 'text', required: true }],
        },
      ],
    },
    // ── Featured Wall ──────────────────────────────────────────────────────
    {
      type: 'collapsible',
      label: 'Featured Partners Wall',
      fields: [
        {
          name: 'featuredWallHeading',
          type: 'text',
          defaultValue: 'Featured partners',
        },
        {
          name: 'featuredWallLead',
          type: 'text',
          admin: { description: 'Short lead text shown beside the heading' },
        },
      ],
    },
    // ── Directory ──────────────────────────────────────────────────────────
    {
      type: 'collapsible',
      label: 'Partner Directory',
      fields: [
        {
          name: 'directoryHeading',
          type: 'text',
          defaultValue: 'Meet our partners.',
        },
        {
          name: 'directoryLead',
          type: 'text',
        },
      ],
    },
    // ── Inline Recruitment Card (rendered at the end of the directory) ────
    {
      type: 'collapsible',
      label: 'Directory Recruitment Card',
      fields: [
        {
          name: 'recruitHeading',
          type: 'text',
          defaultValue: 'Could you be here?',
          admin: { description: 'Headline on the inline recruitment card.' },
        },
        {
          name: 'recruitBody',
          type: 'textarea',
          admin: { description: 'Short paragraph beneath the headline.' },
        },
        {
          name: 'recruitNeeds',
          type: 'array',
          admin: {
            description:
              'Specific partner roles we are recruiting for, rendered as pill tags (e.g. "Legal", "Accounting", "Trades training").',
          },
          fields: [{ name: 'text', type: 'text', required: true }],
        },
        {
          name: 'recruitCtaLabel',
          type: 'text',
          defaultValue: 'Become a partner',
        },
        {
          name: 'recruitCtaHref',
          type: 'text',
          defaultValue: '#become',
        },
      ],
    },
    // ── Benefits ──────────────────────────────────────────────────────────
    {
      type: 'collapsible',
      label: 'Partner Benefits Section',
      fields: [
        {
          name: 'benefitsHeading',
          type: 'text',
          defaultValue: 'Why partner with Growth Hub?',
        },
        {
          name: 'benefitsLead',
          type: 'text',
        },
        {
          name: 'benefits',
          type: 'array',
          admin: { description: 'Up to 3 benefit cards' },
          fields: [
            { name: 'tag', type: 'text', required: true, admin: { description: 'Small label e.g. "01 — Reach"' } },
            { name: 'heading', type: 'text', required: true },
            { name: 'body', type: 'textarea', required: true },
            { name: 'handnote', type: 'text', admin: { description: 'Handscript pull-quote (optional)' } },
          ],
        },
      ],
    },
    // ── Proof / Stats ─────────────────────────────────────────────────────
    {
      type: 'collapsible',
      label: 'Proof / Stats Section',
      fields: [
        {
          name: 'proofHeading',
          type: 'text',
          defaultValue: 'Impact by the numbers.',
        },
        {
          name: 'proofLead',
          type: 'text',
        },
        {
          name: 'proofStats',
          type: 'array',
          admin: { description: 'Up to 3 stat cards' },
          fields: [
            { name: 'tag', type: 'text', admin: { description: 'Small label e.g. "Community"' } },
            { name: 'num', type: 'text', required: true, admin: { description: 'The large number e.g. "400+"' } },
            { name: 'unit', type: 'text', admin: { description: 'Script unit e.g. "members"' } },
            { name: 'heading', type: 'text', required: true },
            { name: 'body', type: 'textarea' },
          ],
        },
        {
          name: 'proofQuotes',
          type: 'array',
          admin: { description: 'Up to 2 pull quotes' },
          fields: [
            { name: 'text', type: 'textarea', required: true },
            { name: 'attribution', type: 'text', required: true },
          ],
        },
      ],
    },
    // ── Become a Partner CTA ──────────────────────────────────────────────
    {
      type: 'collapsible',
      label: 'Become a Partner CTA',
      fields: [
        {
          name: 'becomeHeading',
          type: 'text',
          defaultValue: 'Become a partner.',
        },
        {
          name: 'becomeBody',
          type: 'textarea',
          admin: { description: 'Short paragraph below the heading' },
        },
        {
          name: 'becomeBullets',
          type: 'array',
          fields: [{ name: 'text', type: 'text', required: true }],
        },
        {
          name: 'becomeCtaLabel',
          type: 'text',
          defaultValue: 'Get in touch',
        },
        {
          name: 'becomeCtaHref',
          type: 'text',
          defaultValue: 'mailto:hello@himayat.com.au?subject=Partnership%20Enquiry',
        },
        {
          name: 'becomeSecondaryCtaLabel',
          type: 'text',
          defaultValue: 'View packages',
        },
        {
          name: 'becomeSecondaryCtaHref',
          type: 'text',
          defaultValue: '/#packages',
        },
        // ── Right-side meta block ─────────────────────────────────────────
        // Renders alongside the heading + bullets. Each optional.
        {
          name: 'partnershipLead',
          type: 'text',
          admin: {
            description:
              'Named partnership lead shown on the right meta panel, e.g. "Amal — Director of Growth". Leave blank to hide.',
          },
        },
        {
          name: 'partnerEmail',
          type: 'email',
          admin: {
            description:
              'Partnership-specific inbox (defaults to partners@himayat.com.au). Used for both the meta panel row and the mailto: when the primary CTA is left as default.',
          },
        },
        {
          name: 'deckUrl',
          type: 'text',
          admin: {
            description:
              'Public link to the partnership deck PDF. When set, the secondary CTA becomes "Download partnership deck (PDF)" and points here.',
          },
        },
        {
          name: 'requirementsUrl',
          type: 'text',
          admin: {
            description:
              'Optional link to a partner-requirements / criteria page. Shown as a "View partner requirements →" row on the meta panel when set.',
          },
        },
      ],
    },
  ],
  hooks: {
    afterChange: [async () => { await revalidate('partners-page'); }],
  },
};
