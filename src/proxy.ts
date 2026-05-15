import { authkitMiddleware } from '@workos-inc/authkit-nextjs';

// AuthKit middleware refreshes the session cookie on every request. We don't
// enable `middlewareAuth` here — protected pages call `withAuth({ ensureSignedIn: true })`
// themselves (or use `requireSubscription()` which redirects to /pricing on its own).
//
// Payload CMS manages its own auth for /admin, so we exclude that route from the
// matcher below rather than running it through AuthKit.
export default authkitMiddleware({
  // /sign-in and /sign-up render server pages that redirect to the AuthKit hosted UI
  signUpPaths: ['/sign-up'],
});

export const config = {
  matcher: [
    // Run on everything except static files, Next internals, and the Payload admin route
    '/((?!_next|admin|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/(api|trpc)(.*)',
  ],
};
