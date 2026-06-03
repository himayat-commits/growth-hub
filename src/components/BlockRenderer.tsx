/**
 * BlockRenderer
 *
 * Maps Payload CMS page layout blocks to their corresponding React section
 * components. Each block's `blockType` discriminator is used to select the
 * correct component and pass typed props through.
 *
 * siteSettings is forwarded so contact-info blocks (cta-banner, community)
 * can surface the CMS-managed email / phone / address.
 */

import Hero from "@/components/sections/Hero";
import SupportedBy from "@/components/sections/SupportedBy";
import HowItWorks from "@/components/sections/HowItWorks";
import PricingSection from "@/components/sections/PricingSection";
import Community from "@/components/sections/Community";
import BigQuote from "@/components/sections/BigQuote";
import Testimonials from "@/components/sections/Testimonials";
import About from "@/components/sections/About";
import FinalCTA from "@/components/sections/FinalCTA";
import Contact from "@/components/sections/Contact";
import FAQ, { type FAQItem } from "@/components/sections/FAQ";

// ── Lexical helpers ───────────────────────────────────────────────────────────

// Recursively extract plain text from a Payload Lexical JSON tree.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function lexicalToText(node: any): string {
  if (!node) return "";
  if (node.type === "text") return String(node.text ?? "");
  if (node.type === "linebreak") return " ";
  if (Array.isArray(node.children)) {
    const inner = node.children.map(lexicalToText).join("");
    // Add a space after each paragraph-level block so sentences don't run together.
    return node.type === "paragraph" ? inner + " " : inner;
  }
  return "";
}

// Convert a populated Payload FAQ document to {q, a} plain-text format.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function faqDocToItem(doc: any): FAQItem {
  return {
    q: String(doc.question ?? ""),
    a: lexicalToText(doc.answer?.root ?? doc.answer).trim(),
  };
}

// ── Types ────────────────────────────────────────────────────────────────────

// We use a loose block type here so BlockRenderer works before payload-types.ts
// is regenerated. After running `npx payload generate:types` the Page['layout']
// union will provide full type safety.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyBlock = Record<string, any> & { blockType: string };

interface SiteSettingsData {
  supportEmail?: string | null;
  phone?: string | null;
  address?: string | null;
}

interface BlockRendererProps {
  blocks: AnyBlock[];
  siteSettings?: SiteSettingsData | null;
}

// ── Renderer ─────────────────────────────────────────────────────────────────

export default function BlockRenderer({ blocks, siteSettings }: BlockRendererProps) {
  return (
    <>
      {blocks.map((block, i) => {
        switch (block.blockType) {
          case "hero":
            return (
              <Hero
                key={i}
                eyebrow={block.eyebrow}
                heading={block.heading}
                handnote={block.handnote}
                subheading={block.subheading}
                ctaLabel={block.ctaLabel}
                ctaHref={block.ctaHref}
                secondaryCtaLabel={block.secondaryCtaLabel}
                secondaryCtaHref={block.secondaryCtaHref}
                chips={block.chips}
              />
            );

          case "logo-strip":
            return (
              <SupportedBy
                key={i}
                heading={block.heading}
                partners={block.partners}
                textItems={block.textItems}
              />
            );

          case "how-it-works":
            return (
              <HowItWorks
                key={i}
                heading={block.heading}
                steps={block.steps}
                sectionImage={
                  block.sectionImage
                    ? { url: block.sectionImage.url, alt: block.sectionImage.alt }
                    : null
                }
                imageBadge={block.imageBadge}
              />
            );

          case "pricing":
            return (
              <PricingSection
                key={i}
                heading={block.heading}
                subheading={block.subheading}
              />
            );

          case "community":
            return (
              <Community
                key={i}
                heading={block.heading}
                subheading={block.subheading}
                tabs={block.tabs}
              />
            );

          case "big-quote":
            return (
              <BigQuote
                key={i}
                quote={block.quote}
                attribution={block.attribution}
                badges={block.badges}
              />
            );

          case "testimonials": {
            // Payload populates relationship fields as full objects when depth >= 1
            const testimonialDocs = Array.isArray(block.testimonials)
              ? (block.testimonials as AnyBlock[])
                  .filter((t): t is AnyBlock => typeof t === "object" && t !== null)
                  .map((t) => ({
                    id: t.id as string | null | undefined,
                    quote: t.quote as string | null | undefined,
                    author: t.author as string | null | undefined,
                    role: t.role as string | null | undefined,
                    company: t.company as string | null | undefined,
                  }))
              : null;
            return (
              <Testimonials
                key={i}
                testimonials={testimonialDocs}
                ctaLabel={block.ctaLabel}
                ctaHref={block.ctaHref}
              />
            );
          }

          case "about":
            return (
              <About
                key={i}
                sectionLabel={block.sectionLabel}
                heading={block.heading}
                subheading={block.subheading}
                paragraphs={block.paragraphs}
                pullQuote={block.pullQuote}
                stats={block.stats}
              />
            );

          case "cta-banner":
            return (
              <FinalCTA
                key={i}
                heading={block.heading}
                subheading={block.subheading}
                ctaLabel={block.ctaLabel}
                ctaHref={block.ctaHref}
                secondaryCtaLabel={block.secondaryCtaLabel}
                secondaryCtaHref={block.secondaryCtaHref}
                supportEmail={siteSettings?.supportEmail}
                phone={siteSettings?.phone}
                address={siteSettings?.address}
              />
            );

          // Contact section has no matching CMS block — it's always rendered
          // from the caller (page.tsx) so we don't need a case here.

          case "faq": {
            // block.faqs is populated at depth ≥ 2 as full FAQ documents.
            const faqItems: FAQItem[] = Array.isArray(block.faqs)
              ? (block.faqs as AnyBlock[])
                  .filter((t): t is AnyBlock => typeof t === "object" && t !== null)
                  .map(faqDocToItem)
                  .filter((item) => item.q && item.a)
              : [];
            return <FAQ key={i} items={faqItems.length > 0 ? faqItems : null} />;
          }

          // Blocks used on other pages (blog, team) — not rendered here
          case "rich-text":
          case "content-with-image":
          case "feature-grid":
          case "stats-banner":
          case "team-section":
          case "video-embed":
            return null;

          default:
            return null;
        }
      })}
    </>
  );
}
