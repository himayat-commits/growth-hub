import type { Metadata } from "next";
import SignupPage from "@/components/SignupPage";

export const metadata: Metadata = {
  title: "Sign up — Accelerate · Growth Hub by Himayat",
  description: "The full conversion engine for turning visibility into revenue. $799/month, no lock-in.",
};

export default function AccelerateSignup() {
  return (
    <SignupPage
      eyebrow="Accelerate"
      title="Convert visitors into customers."
      tagline="You're a step away from a real team in your corner."
      price={799}
      priceTerms="Billed monthly · No lock-in"
      features={[
        "Everything in Growth",
        "Scheduling + Rostering",
        "Webchat AI (Robin): 24/7 lead capture",
        "Campaign Templates: SMS & email automation",
      ]}
      addon="Add Referrals from $175/mo"
      trustItems={[
        { text: "Social Traders Verified social enterprise" },
        { text: "No lock-in — cancel any time" },
        { text: "Canberra-based support team" },
      ]}
      hubspotPortalId="442026767"
      hubspotFormId="2fbee7de-e158-409a-89ae-9b7345e0b2df"
      hubspotRegion="ap1"
    />
  );
}
