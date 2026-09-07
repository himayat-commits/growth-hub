// Storefront card + grid. Server components.

import Link from 'next/link';
import Image from 'next/image';
import { Price } from './Price';
import type { ProductView } from '@/lib/shop/types';

export function ProductCard({ product, isMember }: { product: ProductView; isMember: boolean }) {
  const img = product.images[0] ?? null;
  const prices = product.variants.map((v) => v.priceCents);
  const minList = prices.length ? Math.min(...prices) : product.priceCents;
  const varied = prices.some((p) => p !== minList);

  return (
    <Link href={`/shop/${product.slug}`} className="shop-card" data-testid="product-card">
      <div className="shop-card-media">
        {img ? (
          <Image
            src={img.url}
            alt={img.alt}
            width={img.width ?? 768}
            height={img.height ?? 512}
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          />
        ) : (
          <div className="shop-card-placeholder" aria-hidden="true" />
        )}
        {product.soldOut && <span className="shop-ribbon">Sold out</span>}
        {!product.soldOut && product.featured && <span className="shop-ribbon featured">Featured</span>}
      </div>
      <div className="shop-card-body">
        <h3>{product.name}</h3>
        {product.shortDescription && <p>{product.shortDescription}</p>}
        <div className="shop-card-foot">
          <Price priceCents={minList} memberPriceCents={product.memberPriceCents} isMember={isMember} from={varied} />
          <span className="shop-card-cta">{product.soldOut ? 'View' : 'Shop'} →</span>
        </div>
      </div>
    </Link>
  );
}

export function ProductGrid({ products, isMember }: { products: ProductView[]; isMember: boolean }) {
  if (products.length === 0) {
    return (
      <div className="shop-empty">
        <h2>Nothing on the shelves yet.</h2>
        <p>We&apos;re stocking up. Check back soon — or <Link href="/#contact">tell us what you&apos;d wear</Link>.</p>
      </div>
    );
  }
  return (
    <div className="shop-grid">
      {products.map((p) => (
        <ProductCard key={p.slug} product={p} isMember={isMember} />
      ))}
    </div>
  );
}
