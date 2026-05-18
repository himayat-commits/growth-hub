/**
 * Navbar — Server Component wrapper.
 *
 * Fetches navigation data from the Payload CMS `navigation` global and passes
 * it to NavbarClient (the interactive 'use client' component). If the CMS is
 * unavailable the NavbarClient falls back to its hardcoded defaults.
 *
 * When the visitor is signed in we override the CMS CTA with a portal entry
 * point ("My Growth Hub" → /portal) so returning users don't see "Sign Up Now".
 */
import { withAuth } from "@workos-inc/authkit-nextjs";
import { getNavigation } from "@/lib/cms";
import NavbarClient from "@/components/NavbarClient";

export default async function Navbar() {
  const [nav, auth] = await Promise.all([
    getNavigation().catch(() => null),
    withAuth().catch(() => ({ user: null })),
  ]);

  const isSignedIn = !!auth.user;
  // Signed-in users see a portal entry point.
  // Signed-out users go through WorkOS sign-up first, then land on /portal —
  // they explore the free modules and click "Choose a plan" inside the portal
  // when they're ready to upgrade.
  const ctaLabel = isSignedIn ? "My Growth Hub" : nav?.ctaLabel ?? null;
  const ctaHref = isSignedIn ? "/portal" : nav?.ctaHref ?? "/sign-up?redirect_url=%2Fportal";

  return (
    <NavbarClient
      navItems={nav?.navItems as { label: string; href: string; isExternal?: boolean | null }[] | null}
      ctaLabel={ctaLabel}
      ctaHref={ctaHref}
      isSignedIn={isSignedIn}
      userEmail={auth.user?.email ?? null}
    />
  );
}
