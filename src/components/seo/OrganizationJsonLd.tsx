import { JsonLd } from './JsonLd';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://thegrowthhub.com.au';

// Single Organization node for the public marketing surface. Mounted once
// in the (main) layout. Address & contact come from Payload SiteSettings
// at runtime if available; the fallback values are the public-facing
// Himayat office in Canberra.

export function OrganizationJsonLd(props?: {
  phone?: string | null;
  email?: string | null;
  address?: string | null;
}) {
  const data: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'Growth Hub by Himayat',
    url: SITE_URL,
    logo: `${SITE_URL}/og-image.png`,
    description:
      'An all-in-one platform for Canberra small businesses to run and grow — work management, AI-powered marketing, and community support. Every subscription fuels employment pathways in the community.',
    sameAs: [
      'https://www.linkedin.com/company/himayat-australia',
    ],
    address: {
      '@type': 'PostalAddress',
      streetAddress: props?.address ?? 'Level 4, 1 Moore St',
      addressLocality: 'Canberra',
      addressRegion: 'ACT',
      postalCode: '2601',
      addressCountry: 'AU',
    },
  };
  if (props?.email) {
    data.contactPoint = {
      '@type': 'ContactPoint',
      contactType: 'customer support',
      email: props.email,
      telephone: props.phone ?? undefined,
      areaServed: 'AU',
    };
  }
  return <JsonLd data={data} />;
}
