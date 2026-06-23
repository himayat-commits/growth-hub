import type { Metadata } from "next";
import { Source_Serif_4 } from "next/font/google";
import localFont from "next/font/local";
import { AuthKitProvider } from "@workos-inc/authkit-nextjs/components";
import "../globals.css";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import SummitAnnouncementBar from "@/components/SummitAnnouncementBar";
import RevealOnScroll from "@/components/RevealOnScroll";
import PostHogProvider from "@/components/PostHogProvider";
import { OrganizationJsonLd } from "@/components/seo/OrganizationJsonLd";
import Pixels from "@/components/analytics/Pixels";
import ConsentGate from "@/components/analytics/ConsentGate";
import ConsentBanner from "@/components/analytics/ConsentBanner";

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

const biroScript = localFont({
  src: "../../../public/fonts/BiroScript.otf",
  variable: "--font-script",
  weight: "400",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Growth Hub by Himayat — Your business deserves to grow.",
  description:
    "Run and grow your local business from one platform — work management, AI-powered marketing, and community support. Every subscription helps fund local jobs in Canberra.",
  metadataBase: new URL(SITE_URL),
  alternates: { canonical: "/" },
  openGraph: {
    title: "Growth Hub by Himayat",
    description:
      "Run and grow your local business from one platform — work management, AI marketing, and a community that has your back.",
    url: SITE_URL,
    siteName: "Growth Hub by Himayat",
    locale: "en_AU",
    type: "website",
    images: [{ url: "/og-image.png", width: 1200, height: 630 }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Growth Hub by Himayat",
    description: "Run and grow your local business from one platform — work management, AI marketing, and a community that has your back.",
    images: ["/og-image.png"],
  },
};

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en-AU" className={`${sourceSerif.variable} ${biroScript.variable}`}>
      <body>
        <AuthKitProvider>
          <PostHogProvider>
            <ConsentGate>
              <Pixels />
            </ConsentGate>
            <OrganizationJsonLd />
            <SummitAnnouncementBar />
            <Navbar />
            {children}
            <Footer />
            <RevealOnScroll />
            <ConsentBanner />
          </PostHogProvider>
        </AuthKitProvider>
      </body>
    </html>
  );
}
