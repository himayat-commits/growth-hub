import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';

// Routes that require an authenticated user.
// Note: /api/stripe/webhook is intentionally NOT protected — it's called by Stripe.
const isProtectedRoute = createRouteMatcher([
  '/dashboard(.*)',
  '/onboarding(.*)',
  '/portal(.*)',
  '/api/checkout',
  '/api/billing-portal',
]);

// Payload CMS manages its own authentication for /admin — Clerk must not intercept.
const isPayloadRoute = createRouteMatcher(['/admin(.*)']);

export default clerkMiddleware(async (auth, req) => {
  if (isPayloadRoute(req)) return NextResponse.next();
  if (isProtectedRoute(req)) {
    await auth.protect();
  }
});

export const config = {
  matcher: [
    // Run on everything except static files and Next internals
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/(api|trpc)(.*)',
  ],
};
