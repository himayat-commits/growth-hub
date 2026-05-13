import type { Metadata } from 'next';
import { getPageBySlug } from '@/lib/cms';
import PricingPageContent from '@/components/PricingPageContent';
import FAQ, { type FAQItem } from '@/components/sections/FAQ';

export const metadata: Metadata = {
  title: 'Pricing · Growth Hub by Himayat',
  description: 'No lock-in. Cancel any time. Switch tiers as your business grows.',
};

// Recursively extract plain text from a Payload Lexical JSON node.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function lexicalToText(node: any): string {
  if (!node) return '';
  if (node.type === 'text') return String(node.text ?? '');
  if (node.type === 'linebreak') return ' ';
  if (Array.isArray(node.children)) {
    const inner = node.children.map(lexicalToText).join('');
    return node.type === 'paragraph' ? inner + ' ' : inner;
  }
  return '';
}

export default async function PricingPage() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const page = await getPageBySlug('pricing').catch(() => null) as any;

  // Pull heading / subheading out of the 'pricing' block (if the CMS page exists)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const layout: any[] = page?.layout ?? [];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const pricingBlock = layout.find((b: any) => b.blockType === 'pricing') ?? null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const faqBlock = layout.find((b: any) => b.blockType === 'faq') ?? null;

  const heading: string | null = pricingBlock?.heading ?? null;
  const subheading: string | null = pricingBlock?.subheading ?? null;

  // Build FAQ items from the populated 'faq' block (depth 2 populates the relationship)
  const faqItems: FAQItem[] = Array.isArray(faqBlock?.faqs)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ? (faqBlock.faqs as any[])
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .filter((t): t is Record<string, any> => typeof t === 'object' && t !== null)
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .map((doc: Record<string, any>) => ({
          q: String(doc.question ?? ''),
          a: lexicalToText(doc.answer?.root ?? doc.answer).trim(),
        }))
        .filter((item) => item.q && item.a)
    : [];

  return (
    <>
      <PricingPageContent heading={heading} subheading={subheading} />
      {faqItems.length > 0 && <FAQ items={faqItems} />}
    </>
  );
}
