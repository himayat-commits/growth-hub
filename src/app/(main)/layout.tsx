import type { Metadata } from "next";
import { Inter, Source_Serif_4 } from "next/font/google";
import localFont from "next/font/local";
import { AuthKitProvider } from "@workos-inc/authkit-nextjs/components";
import "../globals.css";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import NextSessionBar from "@/components/NextSessionBar";
import RevealOnScroll from "@/components/RevealOnScroll";
import PostHogProvider from "@/components/PostHogProvider";
import { OrganizationJsonLd } from "@/components/seo/OrganizationJsonLd";
import Pixels from "@/components/analytics/Pixels";
import ConsentGate from "@/components/analytics/ConsentGate";
import ConsentBanner from "@/components/analytics/ConsentBanner";
import { CartProvider } from "@/components/shop/CartProvider";

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://thegrowthhub.com.au";

// Root layout for the main app (multiple root layouts pattern — no app/layout.tsx).
// Provides <html>/<body>, fonts, metadata, AuthKitProvider, Navbar, and Footer.
// The (payload) route group has its own root layout via Payload's RootLayout.

const sourceSerif = Source_Serif_4({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  style: ["normal", "italic"],
  variable: "--font-serif",
  display: "swap",
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

const biroScript = localFont({
  src: "../../../public/fonts/BiroScript.otf",
  variable: "--font-script",
  weight: "400",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Growth Hub by Himayat — Your business deserves to grow.",
  description:
    "Free monthly Sessions, hands-on Build Labs and websites you can run yourself, for Canberra small businesses and sole traders. A Social Traders Verified social enterprise.",
  metadataBase: new URL(SITE_URL),
  // No `alternates.canonical` here: a layout-level canonical is inherited by
  // every child page that doesn't set its own, which pointed /pricing,
  // /case-studies/*, /signup/* at the homepage. The home page sets its own.
  openGraph: {
    title: "Growth Hub by Himayat",
    description:
      "Free monthly Sessions, hands-on Build Labs and websites you can run yourself, for Canberra small businesses.",
    url: SITE_URL,
    siteName: "Growth Hub by Himayat",
    locale: "en_AU",
    type: "website",
    // OG image comes from src/app/(main)/opengraph-image.tsx (file convention);
    // /og-image.png never existed in public/.
  },
  twitter: {
    card: "summary_large_image",
    title: "Growth Hub by Himayat",
    description: "Free monthly Sessions, hands-on Build Labs and websites you can run yourself, for Canberra small businesses.",
  },
};

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en-AU" className={`${sourceSerif.variable} ${inter.variable} ${biroScript.variable}`}>
      <body>
        <AuthKitProvider>
          <PostHogProvider>
            <CartProvider>
              <ConsentGate>
                <Pixels />
              </ConsentGate>
              <OrganizationJsonLd />
              <NextSessionBar />
              <Navbar />
              {children}
              <Footer />
              <RevealOnScroll />
              <ConsentBanner />
            </CartProvider>
          </PostHogProvider>
        </AuthKitProvider>
      </body>
    </html>
  );
}
