import type { Metadata } from 'next';

// Open Graph / Twitter fields every public page shares. Next merges metadata
// shallowly: a page that sets `openGraph` replaces the layout's whole object,
// and a page that doesn't inherits it, url and title included (which is how
// every page used to share the home page's og:url). So the layout carries
// only these, and each page spreads them into its own `openGraph` / `twitter`
// next to its own title, description and url. See "Merging" in
// node_modules/next/dist/docs/01-app/03-api-reference/04-functions/generate-metadata.md.
//
// No `images` here on purpose: the opengraph-image file in the page's own
// folder fills them in (as long as the page doesn't set `images` itself). A
// page that sets `openGraph` without such a file loses the inherited image,
// so every page that uses these has an opengraph-image next to it.
export const ogBase = {
  siteName: 'Growth Hub by Himayat',
  locale: 'en_AU',
  type: 'website',
} satisfies Metadata['openGraph'];

export const twitterBase = {
  card: 'summary_large_image',
} satisfies Metadata['twitter'];
