import type { Metadata } from "next";
import { getPageBySlug, getSiteSettings } from "@/lib/cms";
import BlockRenderer from "@/components/BlockRenderer";

// Fallback section imports — used when the 'home' page hasn't been seeded yet
import Hero from "@/components/sections/Hero";
import SupportedBy from "@/components/sections/SupportedBy";
import HowItWorks from "@/components/sections/HowItWorks";
import PricingSection from "@/components/sections/PricingSection";
import Community from "@/components/sections/Community";
import BigQuote from "@/components/sections/BigQuote";
import Testimonials from "@/components/sections/Testimonials";
import About from "@/components/sections/About";
import FinalCTA from "@/components/sections/FinalCTA";
import Contact from "@/components/sections/Contact";

export const metadata: Metadata = {
  title: "Growth Hub by Himayat — Your business deserves to grow.",
  description:
    "AI-powered digital marketing with real, local Canberra support. Packages from $299/mo. Social Traders Verified · NDIS Registered.",
};

export default async function HomePage() {
  const [page, siteSettings] = await Promise.all([
    getPageBySlug("home").catch(() => null),
    getSiteSettings().catch(() => null),
  ]);

  // If the CMS page has blocks, render via BlockRenderer.
  // The Contact section is always appended — it has no CMS block (form logic stays in code).
  if (page?.layout && page.layout.length > 0) {
    // Build a plain SiteSettings object for props forwarding
    const settingsData = siteSettings
      ? {
          supportEmail: (siteSettings as { supportEmail?: string | null }).supportEmail ?? null,
          phone: (siteSettings as { phone?: string | null }).phone ?? null,
          address: (siteSettings as { address?: string | null }).address ?? null,
        }
      : null;

    return (
      <main>
        <BlockRenderer blocks={page.layout as Parameters<typeof BlockRenderer>[0]["blocks"]} siteSettings={settingsData} />
        <Contact supportEmail={settingsData?.supportEmail} />
      </main>
    );
  }

  // Fallback: render all hardcoded sections until the 'home' page is seeded in the CMS.
  // This keeps the site working immediately after deployment even without seed data.
  return (
    <main>
      <Hero />
      <SupportedBy />
      <HowItWorks />
      <PricingSection />
      <Community />
      <BigQuote />
      <Testimonials />
      <About />
      <FinalCTA />
      <Contact />
    </main>
  );
}
