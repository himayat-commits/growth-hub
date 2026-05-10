import type { Metadata } from "next";
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

export default function HomePage() {
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
