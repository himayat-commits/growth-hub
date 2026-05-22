import type { Metadata } from "next";
import { getPartners, getPartnersPage, getSiteSettings } from "@/lib/cms";
import Hero from "@/components/sections/Hero";
import FeaturedWall from "@/components/sections/partners/FeaturedWall";
import PartnerDirectory from "@/components/sections/partners/PartnerDirectory";
import PartnerBenefits from "@/components/sections/partners/PartnerBenefits";
import PartnerProof from "@/components/sections/partners/PartnerProof";
import BecomePartnerCTA from "@/components/sections/partners/BecomePartnerCTA";
import Contact from "@/components/sections/Contact";
import NewsletterStrip from "@/components/NewsletterStrip";

export const metadata: Metadata = {
  title: "Strategic Partners — Growth Hub by Himayat",
  description:
    "Meet the technology providers, community organisations, and funding bodies that power the Growth Hub ecosystem.",
};

// ISR: revalidated when the 'partners' or 'partners-page' CMS tags are purged.
export const revalidate = 3600;

export default async function PartnersPage() {
  const [page, partnersResult, siteSettings] = await Promise.all([
    getPartnersPage(),
    getPartners(),
    getSiteSettings(),
  ]);

  const partners = partnersResult?.docs ?? [];

  // Split partners: featured wall vs. full directory.
  // `category` is the canonical field (post-Phase-9 schema). The
  // shared.ts → legacyCategoryFallback() also handles older `type` values
  // in case any unmigrated records linger.
  const featuredPartners = partners
    .filter((p) => p.featured)
    .map((p) => ({
      id: String(p.id),
      name: p.name,
      category: (p as { category?: string | null }).category ?? null,
      shape: (p as { shape?: string | null }).shape ?? null,
    }));

  const directoryPartners = partners.map((p) => ({
    id: String(p.id),
    name: p.name,
    category: (p as { category?: string | null }).category ?? null,
    shape: (p as { shape?: string | null }).shape ?? null,
    description: p.description ?? null,
    region: (p as { region?: string | null }).region ?? null,
    since: (p as { since?: string | null }).since ?? null,
    contribution: (p as { contribution?: string | null }).contribution ?? null,
    howWeWork: (p as { howWeWork?: string | null }).howWeWork ?? null,
    website: p.website ?? null,
    contactName: p.contactName ?? null,
    contactEmail: p.contactEmail ?? null,
  }));

  return (
    <main>
      {/* Hero — dark variant (teal background) */}
      <Hero
        variant="dark"
        className="p-hero"
        eyebrow={page?.heroEyebrow ?? "Strategic Partners"}
        heading={page?.heroHeading ?? "Better together."}
        subheading={
          page?.heroSubheading ??
          "We partner with technology providers, community organisations, funding bodies, and business support services that share our commitment to local growth and real community impact."
        }
        ctaLabel={page?.heroCtaLabel ?? "Become a Partner"}
        ctaHref={page?.heroCtaHref ?? "#become"}
        secondaryCtaLabel={page?.heroSecondaryCtaLabel ?? "View Directory"}
        secondaryCtaHref={page?.heroSecondaryCtaHref ?? "#directory"}
        chips={
          page?.heroChips && page.heroChips.length > 0
            ? (page.heroChips as Array<{ text: string }>)
            : [
                { text: "Canberra-based ecosystem" },
                { text: "Social Traders Verified" },
                { text: "Community-first" },
              ]
        }
      />

      {/* Featured Partners Wall */}
      <FeaturedWall
        heading={page?.featuredWallHeading ?? "The network behind the network."}
        lead={page?.featuredWallLead ?? null}
        partners={featuredPartners.length > 0 ? featuredPartners : null}
      />

      {/* Partner Directory (client component — filterable) */}
      <PartnerDirectory
        heading={page?.directoryHeading ?? "Meet our partners."}
        lead={page?.directoryLead ?? null}
        partners={directoryPartners.length > 0 ? directoryPartners : null}
      />

      {/* Benefits (plum background) */}
      <PartnerBenefits
        heading={page?.benefitsHeading ?? null}
        lead={page?.benefitsLead ?? null}
        benefits={
          page?.benefits && page.benefits.length > 0
            ? (page.benefits as Array<{ tag: string; heading: string; body: string; handnote?: string | null }>)
            : null
        }
      />

      {/* Proof / Stats (teal background) */}
      <PartnerProof
        heading={page?.proofHeading ?? null}
        lead={page?.proofLead ?? null}
        stats={
          page?.proofStats && page.proofStats.length > 0
            ? (page.proofStats as Array<{ tag?: string; num: string; unit?: string; heading: string; body?: string }>)
            : null
        }
        quotes={
          page?.proofQuotes && page.proofQuotes.length > 0
            ? (page.proofQuotes as Array<{ text: string; attribution: string }>)
            : null
        }
      />

      {/* Become a Partner CTA */}
      <BecomePartnerCTA
        heading={page?.becomeHeading ?? null}
        body={page?.becomeBody ?? null}
        bullets={
          page?.becomeBullets && page.becomeBullets.length > 0
            ? (page.becomeBullets as Array<{ text: string }>)
            : null
        }
        ctaLabel={page?.becomeCtaLabel ?? null}
        ctaHref={page?.becomeCtaHref ?? null}
        secondaryCtaLabel={page?.becomeSecondaryCtaLabel ?? null}
        secondaryCtaHref={page?.becomeSecondaryCtaHref ?? null}
        partnershipLead={(page as { partnershipLead?: string | null })?.partnershipLead ?? null}
        partnerEmail={(page as { partnerEmail?: string | null })?.partnerEmail ?? null}
        deckUrl={(page as { deckUrl?: string | null })?.deckUrl ?? null}
        requirementsUrl={(page as { requirementsUrl?: string | null })?.requirementsUrl ?? null}
        email={siteSettings?.supportEmail ?? null}
        phone={siteSettings?.phone ?? null}
        address={siteSettings?.address ?? null}
      />

      <NewsletterStrip
        source="partners"
        heading="Stay in the loop."
        sub="Quarterly partnership updates — new co-host opportunities, joint events, partner-only roundtables."
      />

      {/* Contact form (hardcoded — same as homepage) */}
      <Contact
        supportEmail={siteSettings?.supportEmail ?? null}
        phone={siteSettings?.phone ?? null}
        address={siteSettings?.address ?? null}
      />
    </main>
  );
}
