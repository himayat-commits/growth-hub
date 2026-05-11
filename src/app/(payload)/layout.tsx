import React from 'react';

// Minimal root layout for Payload CMS admin — intentionally excludes
// the site's Navbar, Footer, ClerkProvider, and brand CSS.
export default function PayloadLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
