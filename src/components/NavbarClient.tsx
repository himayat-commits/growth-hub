"use client";

import { useState } from "react";
import Link from "next/link";
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
  { label: "Packages", href: "/#packages" },
  { label: "Community", href: "/#community" },
  { label: "Partners", href: "/partners" },
  { label: "About", href: "/#why" },
  { label: "FAQ", href: "/#faq" },
  { label: "Contact", href: "/#contact" },
];

export default function NavbarClient({ navItems, ctaLabel, ctaHref }: NavbarClientProps) {
  const [open, setOpen] = useState(false);

  const resolvedItems = navItems && navItems.length > 0 ? navItems : DEFAULT_NAV_ITEMS;
  const resolvedCtaLabel = ctaLabel ?? "Sign Up Now";
  // Signed-out CTA bounces through WorkOS sign-up first, then lands on /portal —
  // users explore the free modules and click "Choose a plan" inside the portal
  // when they want to upgrade.
  const resolvedCtaHref = ctaHref ?? "/sign-up?redirect_url=%2Fportal";

  return (
    <header className="nav" style={{ position: "sticky", top: 0, zIndex: 50 }}>
      <div className="wrap nav-inner">
        <Link className="nav-logo" href="/">
          <Image
            src="/images/himayat-logo.png"
            alt="Himayat logomark"
            width={30}
            height={30}
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
              <Link key={item.href} href={item.href}>
                {item.label}
              </Link>
            )
          )}
        </nav>

        <Link className="btn btn-primary nav-cta" href={resolvedCtaHref}>
          {resolvedCtaLabel}
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
            <path d="M3 7h8M7 3l4 4-4 4" />
          </svg>
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
          <div className="nav-drawer-cta">
            <Link className="btn btn-primary" href={resolvedCtaHref} onClick={() => setOpen(false)}>
              {resolvedCtaLabel}
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
                <path d="M3 7h8M7 3l4 4-4 4" />
              </svg>
            </Link>
          </div>
        </nav>
      )}
    </header>
  );
}
