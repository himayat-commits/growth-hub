"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";

export default function Navbar() {
  const [open, setOpen] = useState(false);

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
          <Link href="/#packages">Packages</Link>
          <Link href="/#community">Community</Link>
          <Link href="/#why">About</Link>
          <Link href="/#faq">FAQ</Link>
          <Link href="/#contact">Contact</Link>
        </nav>

        <Link className="btn btn-primary nav-cta" href="/sign-up">
          Sign Up Now
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
          <Link href="/#packages" onClick={() => setOpen(false)}>Packages</Link>
          <Link href="/#community" onClick={() => setOpen(false)}>Community</Link>
          <Link href="/#why" onClick={() => setOpen(false)}>About</Link>
          <Link href="/#faq" onClick={() => setOpen(false)}>FAQ</Link>
          <Link href="/#contact" onClick={() => setOpen(false)}>Contact</Link>
          <div className="nav-drawer-cta">
            <Link className="btn btn-primary" href="/sign-up" onClick={() => setOpen(false)}>
              Sign Up Now
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
