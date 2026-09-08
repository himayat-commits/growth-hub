import type { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { notFound } from 'next/navigation';
import { withAuth } from '@/lib/auth/with-auth';
import { getSubscription, isActive } from '@/lib/subscription';
import { getProductSlugs } from '@/lib/cms';
import { loadProduct, productHeroImage } from '@/lib/shop/catalogue';
import { formatAud } from '@/lib/shop/pricing';
import LexicalRichText from '@/components/LexicalRichText';
import TrackOnMount from '@/components/TrackOnMount';
import { BreadcrumbListJsonLd } from '@/components/seo/BreadcrumbListJsonLd';
import { JsonLd } from '@/components/seo/JsonLd';
import ProductPurchasePanel from '@/components/shop/ProductPurchasePanel';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://thegrowthhub.com.au';

type Params = Promise<{ slug: string }>;

export async function generateStaticParams() {
  const slugs = await getProductSlugs();
  return slugs.map(({ slug }) => ({ slug }));
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { slug } = await params;
  const loaded = await loadProduct(slug);
  if (!loaded) return { title: 'Shop — Growth Hub by Himayat' };
  const { raw, view } = loaded;
  const desc = view.shortDescription ?? `${view.name} from the Growth Hub Shop. ${formatAud(view.priceCents)}, GST included.`;
  const hero = productHeroImage(raw);
  return {
    title: `${view.name} — Growth Hub Shop`,
    description: desc,
    alternates: { canonical: `/shop/${view.slug}` },
    openGraph: {
      title: view.name,
      description: desc,
      url: `/shop/${view.slug}`,
      type: 'website',
      ...(hero ? { images: [{ url: hero.url }] } : {}),
    },
    other: {
      'product:price:amount': (view.priceCents / 100).toFixed(2),
      'product:price:currency': 'AUD',
    },
  };
}

export default async function ProductPage({ params }: { params: Params }) {
  const { slug } = await params;
  const [{ user }, loaded] = await Promise.all([withAuth().catch(() => ({ user: null })), loadProduct(slug)]);
  if (!loaded) notFound();
  const { raw, view } = loaded;
  const sub = user ? await getSubscription(user.id).catch(() => null) : null;
  const isMember = isActive(sub);
  const hero = productHeroImage(raw) ?? view.images[0] ?? null;
  const gallery = view.images.slice(1, 4);

  return (
    <main className="shop shop-product">
      <TrackOnMount event="shop_product_view" properties={{ product: view.slug }} />
      <BreadcrumbListJsonLd
        crumbs={[
          { name: 'Home', path: '/' },
          { name: 'Shop', path: '/shop' },
          { name: view.name, path: `/shop/${view.slug}` },
        ]}
      />
      <JsonLd
        data={{
          '@context': 'https://schema.org',
          '@type': 'Product',
          name: view.name,
          description: view.shortDescription ?? undefined,
          image: view.images.map((i) => i.url),
          url: `${SITE_URL}/shop/${view.slug}`,
          brand: { '@type': 'Brand', name: 'Growth Hub by Himayat' },
          offers: {
            '@type': 'Offer',
            priceCurrency: 'AUD',
            price: (view.priceCents / 100).toFixed(2),
            availability: view.soldOut ? 'https://schema.org/OutOfStock' : 'https://schema.org/InStock',
            url: `${SITE_URL}/shop/${view.slug}`,
          },
        }}
      />

      <div className="wrap">
        <nav className="shop-crumbs" aria-label="Breadcrumb">
          <Link href="/shop">Shop</Link> <span aria-hidden="true">/</span> <span>{view.name}</span>
        </nav>

        <div className="shop-product-grid">
          <div className="shop-product-media">
            {hero ? (
              <Image
                src={hero.url}
                alt={hero.alt}
                width={hero.width ?? 1200}
                height={hero.height ?? 900}
                priority
                sizes="(max-width: 900px) 100vw, 55vw"
              />
            ) : (
              <div className="shop-card-placeholder" aria-hidden="true" />
            )}
            {gallery.length > 0 && (
              <div className="shop-gallery">
                {gallery.map((img) => (
                  <Image key={img.url} src={img.url} alt={img.alt} width={img.width ?? 768} height={img.height ?? 512} sizes="20vw" />
                ))}
              </div>
            )}
          </div>

          <div className="shop-product-info">
            <p className="shop-eyebrow">{view.category}</p>
            <h1 className="shop-product-h1">{view.name}</h1>
            {view.shortDescription && <p className="shop-lead">{view.shortDescription}</p>}

            <ProductPurchasePanel product={view} isMember={isMember} />

            {raw.description && (
              <div className="shop-desc">
                <LexicalRichText content={raw.description} />
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
