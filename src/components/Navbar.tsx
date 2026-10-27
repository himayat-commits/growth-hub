/**
 * Navbar — Server Component wrapper.
 *
 * The marketing nav is fixed in code (NavbarClient's DEFAULT_NAV_ITEMS) so it
 * always matches the pages that exist; the CMS `navigation` global is no
 * longer read here.
 *
 * The member portal is parked, so the public nav no longer reads the session
 * or shows a signed-in account menu: everyone gets the same nav. Existing
 * members reach their account via /sign-in (portal pages bounce there too).
 */
import NavbarClient from "@/components/NavbarClient";

export default function Navbar() {
  return <NavbarClient />;
}
