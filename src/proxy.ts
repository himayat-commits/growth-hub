import {
  authkitMiddleware,
  authkit as authkitSession,
  handleAuthkitProxy,
} from '@workos-inc/authkit-nextjs';
import { NextRequest, NextResponse, type NextFetchEvent } from 'next/server';

/**
 * Two hostname split:
 *   thegrowthhub.com.au       → marketing site (home, /pricing, /partners, auth)
 *   app.thegrowthhub.com.au   → authenticated app surface (/portal, /dashboard, /onboarding)
 *
 * Apex requests for app paths get 308'd to the subdomain. Subdomain requests
 * for non-app paths get 308'd back to the apex. Both hostnames continue to
 * serve the same Next.js project — only the public URL surface changes.
 *
 * Localhost and preview deploys (`*.vercel.app`) skip the split so dev and
 * preview environments behave like today.
 */
const MARKETING_HOSTNAME = 'thegrowthhub.com.au';
const APP_HOSTNAME = 'app.thegrowthhub.com.au';
// All routes that should live under app.thegrowthhub.com.au. /portal and
// /account are legacy URLs that 301 to /dashboard and /profile via
// next.config.ts redirects — they're listed here so the redirect happens
// on the right subdomain (otherwise the apex would 308 first, then the
// legacy 301 would fire on the subdomain).
const APP_PATHS = [
  '/portal',        // legacy → redirects to /dashboard
  '/account',       // legacy → redirects to /profile
  '/dashboard',
  '/plan',
  '/services',
  '/profile',
  '/my-events',
  '/resources',
  '/messages',
  '/benefits',
  '/onboarding',
  '/ops',  // internal staff console (gated by OPS_EMAILS allowlist)
];

function isAppPath(pathname: string): boolean {
  return APP_PATHS.some((p) => pathname === p || pathname.startsWith(`${p}/`));
}

const authkit = authkitMiddleware({
  // /sign-in and /sign-up are GET Route Handlers that redirect to the AuthKit hosted UI.
  signUpPaths: ['/sign-up'],
});

/** Referral-cookie shape — set when a visitor lands with ?ref=GROW-… and
 *  consumed once by /auth/callback on the user's first sign-in. */
const REF_COOKIE_NAME = 'gh_ref';
const REF_COOKIE_MAX_AGE = 90 * 24 * 60 * 60; // 90 days
const REF_CODE_PATTERN = /^[A-Z0-9-]{4,32}$/i;

/** Append a Set-Cookie header to any response we return when the URL has
 *  a valid ?ref= query parameter. Safe to call on redirects — the cookie
 *  travels with the response and is set on the client before the
 *  redirect target is requested.
 *
 *  Uses Headers.append rather than NextResponse.cookies.set because the
 *  authkit middleware can return either a NextResponse or a plain Response
 *  depending on whether it short-circuits, and Headers.append works on both. */
function attachReferralCookie(response: Response, request: NextRequest): Response {
  const ref = request.nextUrl.searchParams.get('ref');
  if (!ref || !REF_CODE_PATTERN.test(ref)) return response;
  const cookie = `${REF_COOKIE_NAME}=${encodeURIComponent(ref)}; Path=/; Max-Age=${REF_COOKIE_MAX_AGE}; SameSite=Lax; HttpOnly`;
  response.headers.append('set-cookie', cookie);
  return response;
}

export default async function middleware(request: NextRequest, event: NextFetchEvent) {
  const host = request.headers.get('host') ?? '';
  const { pathname } = request.nextUrl;

  // Apex: bounce app paths to the subdomain. /auth/callback stays here.
  if (host === MARKETING_HOSTNAME && isAppPath(pathname)) {
    const target = new URL(request.url);
    target.host = APP_HOSTNAME;
    return attachReferralCookie(NextResponse.redirect(target, 308), request);
  }

  // Subdomain: bounce non-app, non-auth, non-api paths to the apex.
  if (host === APP_HOSTNAME && !isAppPath(pathname)) {
    const stays =
      pathname.startsWith('/api/') ||
      pathname.startsWith('/_next/') ||
      pathname.startsWith('/auth/');
    if (!stays) {
      const target = new URL(request.url);
      target.host = MARKETING_HOSTNAME;
      return attachReferralCookie(NextResponse.redirect(target, 308), request);
    }
  }

  // Protected app surface: gate unauthenticated users HERE, at the proxy,
  // rather than in a Server Component. A Server Component's redirect() to the
  // (cross-origin) AuthKit hosted UI can't be followed by a client-side RSC
  // fetch, so a logged-out soft navigation to /dashboard dies on CORS
  // (net::ERR_FAILED) + a "Server Components render" error instead of bouncing
  // to sign-in — incident 2026-06-23. A proxy redirect is followed as a real
  // navigation on both hard and soft loads. This mirrors AuthKit's own
  // middlewareAuth path, scoped to APP_PATHS so we don't have to allowlist
  // every public marketing route. Scoped to the production app host so dev /
  // preview (and the Playwright session bypass in with-auth.ts) are untouched.
  if (host === APP_HOSTNAME && isAppPath(pathname)) {
    const { session, headers, authorizationUrl } = await authkitSession(request);
    if (!session.user && authorizationUrl) {
      return attachReferralCookie(
        handleAuthkitProxy(request, headers, { redirect: authorizationUrl }),
        request,
      );
    }
    // Authenticated (or session refreshed): forward AuthKit's headers downstream.
    return attachReferralCookie(handleAuthkitProxy(request, headers), request);
  }

  // Everything else: let AuthKit refresh the session cookie as usual.
  // authkit can return undefined for non-protected paths — fall back to
  // NextResponse.next() in that case so we can still attach our cookie.
  const response: Response = (await authkit(request, event)) ?? NextResponse.next();
  return attachReferralCookie(response, request);
}

export const config = {
  matcher: [
    // Run on everything except static files, Next internals, and the Payload admin route
    '/((?!_next|admin|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/(api|trpc)(.*)',
  ],
};
