/**
 * Navbar — Server Component wrapper.
 *
 * Fetches navigation data from the Payload CMS `navigation` global and passes
 * it to NavbarClient (the interactive 'use client' component). If the CMS is
 * unavailable the NavbarClient falls back to its hardcoded defaults.
 */
import { getNavigation } from "@/lib/cms";
import NavbarClient from "@/components/NavbarClient";

export default async function Navbar() {
  const nav = await getNavigation().catch(() => null);

  return (
    <NavbarClient
      navItems={nav?.navItems as { label: string; href: string; isExternal?: boolean | null }[] | null}
      ctaLabel={nav?.ctaLabel}
      ctaHref={nav?.ctaHref}
    />
  );
}
