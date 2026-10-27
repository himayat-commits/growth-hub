"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import Image from "next/image";

export interface NavItem {
  label: string;
  href: string;
  isExternal?: boolean | null;
}

export interface NavbarClientProps {
  navItems?: NavItem[] | null;
  ctaLabel?: string | null;
  ctaHref?: string | null;
}

const DEFAULT_NAV_ITEMS: NavItem[] = [
  { label: "Sessions", href: "/events" },
  { label: "Growth Hub Sites", href: "/sites" },
  { label: "Partners", href: "/partners" },
  { label: "About", href: "/about" },
];

function ArrowIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
      <path d="M3 7h8M7 3l4 4-4 4" />
    </svg>
  );
}

export default function NavbarClient({
  navItems,
  ctaLabel,
  ctaHref,
}: NavbarClientProps) {
  const pathname = usePathname() ?? "";
  const [open, setOpen] = useState(false);

  const resolvedItems = navItems && navItems.length > 0 ? navItems : DEFAULT_NAV_ITEMS;
  // Visitors are pointed at the Sessions calendar, the front door to
  // everything else. The label names where it goes, not a booking that may
  // not be open yet.
  const resolvedCtaLabel = ctaLabel ?? "See Session dates";
  const resolvedCtaHref = ctaHref ?? "/events#whats-on";

  return (
    <header className="nav" style={{ position: "sticky", top: 0, zIndex: 50 }}>
      <div className="wrap nav-inner">
        <Link className="nav-logo" href="/">
          <Image
            src="/images/himayat-logo.png"
            alt="Himayat logomark"
            width={30}
            height={30}
            loading="eager"
            style={{ objectFit: "contain" }}
          />
          <span className="wordmark">
            Growth Hub <span className="logo-sub">by Himayat</span>
          </span>
        </Link>

        <nav className="nav-links" aria-label="Primary navigation">
          {resolvedItems.map((item) =>
            item.isExternal ? (
              <a key={item.href} href={item.href} target="_blank" rel="noopener noreferrer">
                {item.label}
              </a>
            ) : (
              <Link
                key={item.href}
                href={item.href}
                aria-current={pathname === item.href || pathname.startsWith(`${item.href}/`) ? "page" : undefined}
              >
                {item.label}
              </Link>
            )
          )}
        </nav>

        <Link className="nav-contact" href="/about#contact">
          Contact
        </Link>

        <Link className="btn btn-primary nav-cta" href={resolvedCtaHref}>
          {resolvedCtaLabel}
          <ArrowIcon />
        </Link>

        <button
          className="nav-toggle"
          aria-label={open ? "Close menu" : "Open menu"}
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
        >
          <span />
        </button>
      </div>

      {open && (
        <nav className="nav-drawer open" aria-label="Mobile navigation">
          {resolvedItems.map((item) =>
            item.isExternal ? (
              <a
                key={item.href}
                href={item.href}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => setOpen(false)}
              >
                {item.label}
              </a>
            ) : (
              <Link key={item.href} href={item.href} onClick={() => setOpen(false)}>
                {item.label}
              </Link>
            )
          )}
          <Link href="/about#contact" onClick={() => setOpen(false)}>
            Contact
          </Link>
          <div className="nav-drawer-cta">
            <Link className="btn btn-primary" href={resolvedCtaHref} onClick={() => setOpen(false)}>
              {resolvedCtaLabel}
              <ArrowIcon />
            </Link>
          </div>
        </nav>
      )}
    </header>
  );
}
