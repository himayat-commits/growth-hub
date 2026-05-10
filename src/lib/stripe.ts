import Stripe from 'stripe';

// Cached singleton — lazy so new Stripe() is never called at module-evaluation
// time (Next.js evaluates all server modules during build, before env vars exist).
let _stripe: Stripe | undefined;

/**
 * Returns the Stripe client. Call this inside route handlers / server
 * functions rather than at module scope so the key is read at request time.
 */
export function getStripe(): Stripe {
  if (!_stripe) {
    _stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
      apiVersion: '2026-04-22.dahlia',
      typescript: true,
      appInfo: {
        name: 'growth-hub',
        url: 'https://himayat.com.au',
      },
    });
  }
  return _stripe;
}
