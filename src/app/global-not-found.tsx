import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { Inter, Source_Serif_4 } from 'next/font/google';
import './globals.css';
import NotFoundPanel from '@/components/sections/site/NotFoundPanel';

// 404 for URLs that match no route. The app has three root layouts ((main),
// (app) and (payload)) and no app/layout.tsx, so a root app/not-found.tsx has
// no layout to render in. global-not-found (switched on by
// experimental.globalNotFound in next.config.ts) skips layouts and renders this
// full document instead. Payload's /admin and /api are catch-all routes in
// (payload), so they never reach this page.
//
// Because it renders outside the (main) layout it brings its own CSS and fonts,
// and a logo-only header: the full Navbar needs the AuthKit and cart providers.

const sourceSerif = Source_Serif_4({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
  style: ['normal', 'italic'],
  variable: '--font-serif',
  display: 'swap',
});

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Page not found | Growth Hub by Himayat',
  description: 'This page has moved or no longer exists.',
};

export default function GlobalNotFound() {
  return (
    <html lang="en-AU" className={`${sourceSerif.variable} ${inter.variable}`}>
      <body>
        <header className="nav">
          <div className="wrap nav-inner">
            <Link className="nav-logo" href="/">
              <Image
                src="/images/himayat-logo.png"
                alt="Himayat logomark"
                width={30}
                height={30}
                style={{ objectFit: 'contain' }}
              />
              <span className="wordmark">
                Growth Hub <span className="logo-sub">by Himayat</span>
              </span>
            </Link>
          </div>
        </header>
        <main>
          <NotFoundPanel />
        </main>
      </body>
    </html>
  );
}
