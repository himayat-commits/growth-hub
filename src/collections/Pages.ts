import type { CollectionConfig } from 'payload';
import { revalidate } from '../lib/cms/revalidate.ts';
import { HeroBlock } from '../blocks/HeroBlock.ts';
import { PricingBlock } from '../blocks/PricingBlock.ts';
import { TestimonialsBlock } from '../blocks/TestimonialsBlock.ts';
import { FAQBlock } from '../blocks/FAQBlock.ts';
import { LogoStrip } from '../blocks/LogoStrip.ts';
import { FeatureGrid } from '../blocks/FeatureGrid.ts';
import { ContentWithImage } from '../blocks/ContentWithImage.ts';
import { VideoEmbed } from '../blocks/VideoEmbed.ts';
import { CTABanner } from '../blocks/CTABanner.ts';
import { TeamSection } from '../blocks/TeamSection.ts';
import { StatsBanner } from '../blocks/StatsBanner.ts';
import { RichTextBlock } from '../blocks/RichTextBlock.ts';
import { HowItWorksBlock } from '../blocks/HowItWorksBlock.ts';
import { AboutBlock } from '../blocks/AboutBlock.ts';
import { BigQuoteBlock } from '../blocks/BigQuoteBlock.ts';
import { CommunityBlock } from '../blocks/CommunityBlock.ts';

export const Pages: CollectionConfig = {
  slug: 'pages',
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'slug', 'status', 'updatedAt'],
    preview: (doc) =>
      `${process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'}/${doc.slug === 'home' ? '' : String(doc.slug)}`,
  },
  versions: {
    drafts: { autosave: true },
  },
  fields: [
    {
      name: 'title',
      type: 'text',
      required: true,
    },
    {
      name: 'slug',
      type: 'text',
      required: true,
      unique: true,
      admin: {
        description: 'URL path segment. Use "home" for the homepage.',
      },
    },
    {
      name: 'layout',
      type: 'blocks',
      blocks: [
        HeroBlock,
        PricingBlock,
        TestimonialsBlock,
        FAQBlock,
        LogoStrip,
        FeatureGrid,
        ContentWithImage,
        VideoEmbed,
        CTABanner,
        TeamSection,
        StatsBanner,
        RichTextBlock,
        HowItWorksBlock,
        AboutBlock,
        BigQuoteBlock,
        CommunityBlock,
      ],
    },
    {
      name: 'meta',
      type: 'group',
      label: 'SEO',
      fields: [
        { name: 'title', type: 'text' },
        { name: 'description', type: 'textarea' },
        { name: 'image', type: 'upload', relationTo: 'media' },
        { name: 'noIndex', type: 'checkbox', defaultValue: false },
      ],
    },
    {
      name: 'status',
      type: 'select',
      options: ['draft', 'published'],
      defaultValue: 'draft',
      required: true,
    },
  ],
  hooks: {
    afterChange: [async () => { await revalidate('pages'); }],
    afterDelete: [async () => { await revalidate('pages'); }],
  },
};
