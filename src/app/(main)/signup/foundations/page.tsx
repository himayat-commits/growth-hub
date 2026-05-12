import type { Metadata } from "next";
import SignupPage from "@/components/SignupPage";

export const metadata: Metadata = {
  title: "Sign up — Foundations · Growth Hub by Himayat",
  description: "The essential digital presence for businesses building their online footprint. $299/month, no lock-in.",
};

export default function FoundationsSignup() {
  return (
    <SignupPage
      eyebrow="Foundations"
      title="Get online. Get noticed."
      tagline="You're a step away from a real team in your corner."
      price={299}
      priceTerms="Billed monthly · No lock-in"
      features={[
        "Invoicing",
        "Social AI: content creation & scheduling",
        "Listing AI: 50+ directory management",
        "Messaging: unified inbox for all channels",
        "Community + weekly webinars included",
      ]}
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
