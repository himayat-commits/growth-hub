"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import SignOutButton from "./SignOutButton";

export interface NavItem {
  label: string;
  href: string;
  isExternal?: boolean | null;
}

export interface NavbarClientProps {
  navItems?: NavItem[] | null;
  ctaLabel?: string | null;
  ctaHref?: string | null;
  /** Surface the auth state so we can show an account menu instead of the
   *  "Sign Up Now" CTA when the user is signed in. */
  isSignedIn?: boolean;
  userEmail?: string | null;
}

const DEFAULT_NAV_ITEMS: NavItem[] = [
  { label: "Packages", href: "/#packages" },
  { label: "Community", href: "/#community" },
  { label: "Partners", href: "/partners" },
  { label: "About", href: "/#why" },
  { label: "FAQ", href: "/#faq" },
  { label: "Contact", href: "/#contact" },
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
  isSignedIn = false,
  userEmail = null,
}: NavbarClientProps) {
  const [open, setOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close the account menu when clicking outside it.
  useEffect(() => {
    if (!menuOpen) return;
    const onDown = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [menuOpen]);

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

        {isSignedIn ? (
          <div className="nav-account" ref={menuRef}>
            <Link className="btn btn-primary nav-cta" href={resolvedCtaHref}>
              {resolvedCtaLabel}
              <ArrowIcon />
            </Link>
            <button
              type="button"
              className="nav-account-toggle"
              aria-label="Account menu"
              aria-expanded={menuOpen}
              onClick={() => setMenuOpen((v) => !v)}
            >
              <span aria-hidden="true" className="nav-account-avatar">
                {(userEmail?.[0] ?? "?").toUpperCase()}
              </span>
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
                <path d="M3 4.5L6 7.5L9 4.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
            {menuOpen && (
              <div className="nav-account-menu" role="menu">
                {userEmail && (
                  <p className="nav-account-email" title={userEmail}>
                    {userEmail}
                  </p>
                )}
                <Link role="menuitem" href="/account" onClick={() => setMenuOpen(false)}>
                  Account &amp; billing
                </Link>
                <Link role="menuitem" href="/portal" onClick={() => setMenuOpen(false)}>
                  My Growth Hub
                </Link>
                <div className="nav-account-divider" />
                <SignOutButton className="nav-account-signout" />
              </div>
            )}
          </div>
        ) : (
          <Link className="btn btn-primary nav-cta" href={resolvedCtaHref}>
            {resolvedCtaLabel}
            <ArrowIcon />
          </Link>
        )}

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
          {isSignedIn && (
            <>
              <Link href="/account" onClick={() => setOpen(false)}>
                Account &amp; billing
              </Link>
              <SignOutButton className="nav-drawer-signout" />
            </>
          )}
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
