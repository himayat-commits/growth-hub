import type { Metadata } from "next";
import { Source_Serif_4 } from "next/font/google";
import localFont from "next/font/local";
import { ClerkProvider } from "@clerk/nextjs";
import "../globals.css";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

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
    "AI-powered digital marketing with real, local support. Every subscription fuels employment pathways in the Canberra community.",
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL ?? "https://growthhub.himayat.com.au"
  ),
  openGraph: {
    title: "Growth Hub by Himayat",
    description:
      "AI-powered digital marketing with real, local Canberra support.",
    url: "https://growthhub.himayat.com.au",
    siteName: "Growth Hub by Himayat",
    locale: "en_AU",
    type: "website",
    images: [{ url: "/og-image.png", width: 1200, height: 630 }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Growth Hub by Himayat",
    description: "AI-powered digital marketing with real, local Canberra support.",
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
        <ClerkProvider>
          <Navbar />
          {children}
          <Footer />
        </ClerkProvider>
      </body>
    </html>
  );
}
