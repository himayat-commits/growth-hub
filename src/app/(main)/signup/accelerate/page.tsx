import type { Metadata } from "next";
import { getSignupContent } from "@/lib/cms";
import { PLANS } from "@/lib/plans";
import SignupPage from "@/components/SignupPage";

export const metadata: Metadata = {
  title: "Sign up — Accelerate · Growth Hub by Himayat",
  description: "The full conversion engine for turning visibility into revenue. $799/month, no lock-in.",
};

// Hardcoded fallbacks — used when CMS has not been seeded yet
const DEFAULTS = {
  title: "Convert visitors into customers.",
  tagline: "You're a step away from a real team in your corner.",
  features: [
    "Everything in Growth",
    "Scheduling + Rostering",
    "Webchat AI (Robin): 24/7 lead capture",
    "Campaign Templates: SMS & email automation",
  ],
  addon: "Add Referrals from $175/mo",
  trustItems: [
    { text: "Social Traders Verified social enterprise" },
    { text: "No lock-in — cancel any time" },
    { text: "Canberra-based support team" },
  ],
};

export default async function AccelerateSignup() {
  const content = await getSignupContent().catch(() => null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const tier = (content as any)?.accelerate;

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
      eyebrow="Accelerate"
      title={tier?.title ?? DEFAULTS.title}
      tagline={tier?.tagline ?? DEFAULTS.tagline}
      price={PLANS.accelerate.monthlyPrice}
      priceTerms="Billed monthly · No lock-in"
      features={features}
      addon={tier?.addon ?? DEFAULTS.addon}
      trustItems={trustItems}
      hubspotPortalId="442026767"
      hubspotFormId="2fbee7de-e158-409a-89ae-9b7345e0b2df"
      hubspotRegion="ap1"
    />
  );
}
