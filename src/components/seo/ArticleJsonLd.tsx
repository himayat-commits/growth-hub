import { JsonLd } from './JsonLd';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://thegrowthhub.com.au';

// Schema.org Article markup for /insights/[slug]. Drives the article
// rich results in Google search (datePublished, author, image card) and
// is the signal Google Discover uses to surface posts.
//
// Author is the Organization rather than an individual to match the
// editorial-by-team voice; revisit when Posts grow per-author bylines.

export interface ArticleJsonLdInput {
  headline: string;
  slug: string;
  description?: string | null;
  datePublished?: string | null;
  dateModified?: string | null;
  imageUrl?: string | null;
}

export function ArticleJsonLd(input: ArticleJsonLdInput) {
  const url = `${SITE_URL}/insights/${input.slug}`;
  const data: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: input.headline,
    url,
    mainEntityOfPage: { '@type': 'WebPage', '@id': url },
    author: {
      '@type': 'Organization',
      name: 'Growth Hub by Himayat',
      url: SITE_URL,
    },
    publisher: {
      '@type': 'Organization',
      name: 'Growth Hub by Himayat',
      url: SITE_URL,
      logo: {
        '@type': 'ImageObject',
        url: `${SITE_URL}/og-image.png`,
      },
    },
  };

  if (input.description) data.description = input.description;
  if (input.datePublished) data.datePublished = input.datePublished;
  if (input.dateModified) data.dateModified = input.dateModified;
  // Google's article rich results require an absolute image URL — Payload
  // already returns full URLs from Vercel Blob, so we pass straight through.
  if (input.imageUrl) data.image = [input.imageUrl];

  return <JsonLd data={data} />;
}
