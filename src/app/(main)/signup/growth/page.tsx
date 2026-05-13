import type { Metadata } from "next";
import { getSignupContent } from "@/lib/cms";
import { PLANS } from "@/lib/plans";
import SignupPage from "@/components/SignupPage";

export const metadata: Metadata = {
  title: "Sign up — Growth · Growth Hub by Himayat",
  description: "The reputation engine for businesses ready to grow through trust. $499/month, no lock-in.",
};

// Hardcoded fallbacks — used when CMS has not been seeded yet
const DEFAULTS = {
  title: "Build trust. Build reputation.",
  tagline: "You're a step away from a real team in your corner.",
  features: [
    "Everything in Foundations",
    "Timesheets & Docketing",
    "Reviews AI: automated generation & responses",
    "Review Collateral Kit: QR cards, badges, templates",
  ],
  addon: "Add Search AI from $99/mo",
  trustItems: [
    { text: "Social Traders Verified social enterprise" },
    { text: "No lock-in — cancel any time" },
    { text: "Canberra-based support team" },
  ],
};

export default async function GrowthSignup() {
  const content = await getSignupContent().catch(() => null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const tier = (content as any)?.growth;

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
      eyebrow="Growth"
      title={tier?.title ?? DEFAULTS.title}
      tagline={tier?.tagline ?? DEFAULTS.tagline}
      price={PLANS.growth.monthlyPrice}
      priceTerms="Billed monthly · No lock-in"
      featured
      features={features}
      addon={tier?.addon ?? DEFAULTS.addon}
      trustItems={trustItems}
      hubspotPortalId="442026767"
      hubspotFormId="2fbee7de-e158-409a-89ae-9b7345e0b2df"
      hubspotRegion="ap1"
    />
  );
}
