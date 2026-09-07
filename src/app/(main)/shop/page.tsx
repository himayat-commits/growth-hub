import type { Metadata } from 'next';
import { withAuth } from '@/lib/auth/with-auth';
import { getSubscription, isActive } from '@/lib/subscription';
import { loadCatalogue } from '@/lib/shop/catalogue';
import { ProductGrid } from '@/components/shop/ProductCard';
import { BreadcrumbListJsonLd } from '@/components/seo/BreadcrumbListJsonLd';

// Public storefront. Catalogue reads are cached (tag: products); stock and
// member status are read per request so prices and sold-out states are live.

export const metadata: Metadata = {
  title: 'Shop — Growth Hub by Himayat',
  description:
    'Growth Hub merch. Wear the community that has your back — every purchase helps fund local jobs in Canberra. Members with a paid plan get a discount.',
  alternates: { canonical: '/shop' },
  openGraph: {
    title: 'Growth Hub Shop',
    description: 'Merch from the Growth Hub community. Members save on every order.',
    url: '/shop',
    type: 'website',
  },
};

export default async function ShopPage() {
  const [{ user }, products] = await Promise.all([
    withAuth().catch(() => ({ user: null })),
    loadCatalogue(),
  ]);
  const sub = user ? await getSubscription(user.id).catch(() => null) : null;
  const isMember = isActive(sub);

  return (
    <main className="shop">
      <BreadcrumbListJsonLd crumbs={[{ name: 'Home', path: '/' }, { name: 'Shop', path: '/shop' }]} />
      <section className="shop-hero">
        <div className="wrap">
          <p className="shop-eyebrow">Shop</p>
          <h1 className="shop-h1">
            Wear the <span className="shop-h1-em">community</span>.
          </h1>
          <p className="shop-lead">
            Merch for people building something local. Every order helps fund jobs in Canberra.
            {isMember ? ' Your member price is already applied.' : ' Members with a paid plan save on every order.'}
          </p>
        </div>
      </section>
      <section className="shop-catalogue">
        <div className="wrap">
          <ProductGrid products={products} isMember={isMember} />
        </div>
      </section>
    </main>
  );
}
