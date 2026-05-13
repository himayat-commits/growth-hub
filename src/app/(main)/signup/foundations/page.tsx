import type { Metadata } from "next";
import { getSignupContent } from "@/lib/cms";
import { PLANS } from "@/lib/plans";
import SignupPage from "@/components/SignupPage";

export const metadata: Metadata = {
  title: "Sign up — Foundations · Growth Hub by Himayat",
  description: "The essential digital presence for businesses building their online footprint. $299/month, no lock-in.",
};

// Hardcoded fallbacks — used when CMS has not been seeded yet
const DEFAULTS = {
  title: "Get online. Get noticed.",
  tagline: "You're a step away from a real team in your corner.",
  features: [
    "Invoicing",
    "Social AI: content creation & scheduling",
    "Listing AI: 50+ directory management",
    "Messaging: unified inbox for all channels",
    "Community + weekly webinars included",
  ],
  trustItems: [
    { text: "Social Traders Verified social enterprise" },
    { text: "No lock-in — cancel any time" },
    { text: "Canberra-based support team" },
  ],
};

export default async function FoundationsSignup() {
  const content = await getSignupContent().catch(() => null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const tier = (content as any)?.foundations;

  const features: string[] =
    Array.isArray(tier?.features) && tier.features.length > 0
      ? tier.features.map((f: { text: string }) => f.text)
      : DEFAULTS.features;

  const trustItems: { text: string }[] =
    Array.isArray(tier?.trustItems) && tier.trustItems.length > 0
      ? tier.trustItems.map((t: { text: string }) => ({ text: t.text }))
      : DEFAULTS.trustItems;

  return (
    <SignupPage
      eyebrow="Foundations"
      title={tier?.title ?? DEFAULTS.title}
      tagline={tier?.tagline ?? DEFAULTS.tagline}
      price={PLANS.foundations.monthlyPrice}
      priceTerms="Billed monthly · No lock-in"
      features={features}
      addon={tier?.addon ?? undefined}
      trustItems={trustItems}
      hubspotPortalId="442026767"
      hubspotFormId="2fbee7de-e158-409a-89ae-9b7345e0b2df"
      hubspotRegion="ap1"
    />
  );
}
