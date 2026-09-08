'use client';

import { useEffect, useRef } from 'react';
import { useCart } from '@/components/shop/CartProvider';

/** Empties the local cart once the order is paid. */
export default function ClearCartOnMount() {
  const { clear, ready } = useCart();
  const done = useRef(false);
  useEffect(() => {
    if (!ready || done.current) return;
    done.current = true;
    clear();
  }, [ready, clear]);
  return null;
}
