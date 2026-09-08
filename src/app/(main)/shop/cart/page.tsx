import type { Metadata } from 'next';
import CartPage from '@/components/shop/CartPage';

export const metadata: Metadata = {
  title: 'Your cart — Growth Hub Shop',
  robots: { index: false, follow: false },
};

export default async function ShopCartPage({
  searchParams,
}: {
  searchParams: Promise<{ cancelled?: string }>;
}) {
  const { cancelled } = await searchParams;
  return (
    <main className="shop shop-cart-page">
      <div className="wrap">
        <p className="shop-eyebrow">Shop</p>
        <h1 className="shop-h1 shop-h1-sm">Your cart</h1>
        <CartPage cancelled={cancelled === '1'} />
      </div>
    </main>
  );
}
