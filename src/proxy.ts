import { authkitMiddleware } from '@workos-inc/authkit-nextjs';
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
const APP_PATHS = ['/portal', '/dashboard', '/onboarding'];

function isAppPath(pathname: string): boolean {
  return APP_PATHS.some((p) => pathname === p || pathname.startsWith(`${p}/`));
}

const authkit = authkitMiddleware({
  // /sign-in and /sign-up are GET Route Handlers that redirect to the AuthKit hosted UI.
  signUpPaths: ['/sign-up'],
});

export default async function middleware(request: NextRequest, event: NextFetchEvent) {
  const host = request.headers.get('host') ?? '';
  const { pathname } = request.nextUrl;

  // Apex: bounce app paths to the subdomain. /auth/callback stays here.
  if (host === MARKETING_HOSTNAME && isAppPath(pathname)) {
    const target = new URL(request.url);
    target.host = APP_HOSTNAME;
    return NextResponse.redirect(target, 308);
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
      return NextResponse.redirect(target, 308);
    }
  }

  // Everything else: let AuthKit refresh the session cookie as usual.
  return authkit(request, event);
}

export const config = {
  matcher: [
    // Run on everything except static files, Next internals, and the Payload admin route
    '/((?!_next|admin|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/(api|trpc)(.*)',
  ],
};
