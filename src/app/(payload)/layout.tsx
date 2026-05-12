import React from 'react';

// Minimal segment layout for Payload CMS admin — intentionally excludes
// the site's Navbar, Footer, ClerkProvider, and brand CSS.
// The <html>/<body> wrapper is provided by the shared app/layout.tsx root layout.
export default function PayloadLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
