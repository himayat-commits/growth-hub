import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';

// Routes that require an authenticated user.
// Note: /api/stripe/webhook is intentionally NOT protected — it's called by Stripe.
const isProtectedRoute = createRouteMatcher([
  '/dashboard(.*)',
  '/api/checkout',
  '/api/billing-portal',
]);

export default clerkMiddleware(async (auth, req) => {
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
