// Self-service + managed tiers. Content matches the latest canonical
// brand site (per the screenshots dated 2026-05-05): prices stepped up
// to $299/$499/$799, plus three new Work Management modules layered in
// (Invoicing on Foundations, Timesheets & Docketing on Growth,
// Scheduling & Rostering on Accelerate).
//
// Managed tiers are enquire-only — no checkout, no wizard.

export type PackageId = "foundations" | "growth" | "accelerate";
export type ManagedTierId = "managed-pro" | "managed-elite";

export type PackageDef = {
  id: PackageId;
  name: string;
  tagline: string;
  positioning: string;
  pricePerMonth: number;
  terms: string;
  modules: string[];
  newInTier: string[];
  addOnHint?: string;
};

export type ManagedTierDef = {
  id: ManagedTierId;
  name: string;
  tagline: string;
  positioning: string;
  pricePerMonth: number;
  terms: string;
  features: string[];
};

export const PACKAGES: Record<PackageId, PackageDef> = {
  foundations: {
    id: "foundations",
    name: "Foundations",
    tagline: "Get online. Get noticed.",
    positioning:
      "The essential digital presence for businesses building their online footprint.",
    pricePerMonth: 299,
    terms: "Billed monthly · No lock-in",
    modules: [
      "Invoicing",
      "Social AI: content creation & scheduling",
      "Listing AI: 50+ directory management",
      "Messaging: unified inbox for all channels",
      "Community + weekly webinars included",
    ],
    newInTier: [
      "Invoicing",
      "Social AI: content creation & scheduling",
      "Listing AI: 50+ directory management",
      "Messaging: unified inbox for all channels",
      "Community + weekly webinars included",
    ],
  },
  growth: {
    id: "growth",
    name: "Growth",
    tagline: "Build trust. Build reputation.",
    positioning:
      "The reputation engine for businesses ready to grow through trust.",
    pricePerMonth: 499,
    terms: "Billed monthly · No lock-in",
    modules: [
      "Everything in Foundations",
      "Timesheets & Docketing",
      "Reviews AI: automated generation & responses",
      "Review Collateral Kit: QR cards, badges, templates",
    ],
    newInTier: [
      "Timesheets & Docketing",
      "Reviews AI: automated generation & responses",
      "Review Collateral Kit: QR cards, badges, templates",
    ],
    addOnHint: "+ Add Search AI from $99/mo",
  },
  accelerate: {
    id: "accelerate",
    name: "Accelerate",
    tagline: "Convert visitors into customers.",
    positioning:
      "The full conversion engine for turning visibility into revenue.",
    pricePerMonth: 799,
    terms: "Billed monthly · No lock-in",
    modules: [
      "Everything in Growth",
      "Scheduling + Rostering",
      "Webchat AI (Robin): 24/7 lead capture",
      "Campaign Templates: SMS & email automation",
    ],
    newInTier: [
      "Scheduling + Rostering",
      "Webchat AI (Robin): 24/7 lead capture",
      "Campaign Templates: SMS & email automation",
    ],
    addOnHint: "+ Add Referrals from $175/mo",
  },
};

export const PACKAGE_LIST: PackageDef[] = [
  PACKAGES.foundations,
  PACKAGES.growth,
  PACKAGES.accelerate,
];

export const MANAGED_TIERS: ManagedTierDef[] = [
  {
    id: "managed-pro",
    name: "Managed Pro",
    tagline: "We run it. You grow.",
    positioning:
      "Expert hands on your digital marketing without hiring a team.",
    pricePerMonth: 1499,
    terms: "Billed monthly · 6-month minimum",
    features: [
      "Full Accelerate platform access",
      "12 managed social posts/month",
      "Review response management (24hr)",
      "Monthly strategy call & dedicated manager",
      "First month bonus: logo + 1-page website",
    ],
  },
  {
    id: "managed-elite",
    name: "Managed Elite",
    tagline: "Your entire online growth engine.",
    positioning:
      "Complete hands-off digital marketing with competitive intelligence.",
    pricePerMonth: 2499,
    terms: "Billed monthly · 6-month minimum",
    features: [
      "Everything in Managed Pro",
      "20 social posts/mo + custom design",
      "Search AI + Competitor AI + Insights",
      "Local SEO + Google Ads management",
      "Fortnightly strategy + full brand & website build",
    ],
  },
];

export const includesWebchat = (id: PackageId) => id === "accelerate";
export const includesReviews = (id: PackageId) => id !== "foundations";
