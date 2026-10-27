/**
 * Navbar — Server Component wrapper.
 *
 * The marketing nav is fixed in code (NavbarClient's DEFAULT_NAV_ITEMS) so it
 * always matches the pages that exist; the CMS `navigation` global is no
 * longer read here.
 *
 * There is no member sign-in on this site, so everyone gets the same nav.
 */
import NavbarClient from "@/components/NavbarClient";

export default function Navbar() {
  return <NavbarClient />;
}
