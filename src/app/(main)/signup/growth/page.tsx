import type { Metadata } from "next";
import SignupPage from "@/components/SignupPage";

export const metadata: Metadata = {
  title: "Sign up — Growth · Growth Hub by Himayat",
  description: "The reputation engine for businesses ready to grow through trust. $499/month, no lock-in.",
};

export default function GrowthSignup() {
  return (
    <SignupPage
      eyebrow="Growth"
      title="Build trust. Build reputation."
      tagline="You're a step away from a real team in your corner."
      price={499}
      priceTerms="Billed monthly · No lock-in"
      featured
      features={[
        "Everything in Foundations",
        "Timesheets & Docketing",
        "Reviews AI: automated generation & responses",
        "Review Collateral Kit: QR cards, badges, templates",
      ]}
      addon="Add Search AI from $99/mo"
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
