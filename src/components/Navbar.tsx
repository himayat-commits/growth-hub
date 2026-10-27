/**
 * Navbar — Server Component wrapper.
 *
 * The marketing nav is fixed in code (NavbarClient's DEFAULT_NAV_ITEMS) so it
 * always matches the pages that exist; the CMS `navigation` global is no
 * longer read here.
 *
 * Signed-in visitors keep a portal entry point ("My Growth Hub" → /portal) so
 * existing members can still reach their account while the portal is parked.
 */
import { withAuth } from "@workos-inc/authkit-nextjs";
import NavbarClient from "@/components/NavbarClient";

export default async function Navbar() {
  const auth = await withAuth().catch(() => ({ user: null }));
  const isSignedIn = !!auth.user;

  return (
    <NavbarClient
      ctaLabel={isSignedIn ? "My Growth Hub" : null}
      ctaHref={isSignedIn ? "/portal" : null}
      isSignedIn={isSignedIn}
      userEmail={auth.user?.email ?? null}
    />
  );
}
