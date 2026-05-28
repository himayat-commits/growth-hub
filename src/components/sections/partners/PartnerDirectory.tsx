"use client";

import { useMemo, useState } from "react";
import PartnerMark from "./PartnerMark";
import { track } from "@/lib/analytics";
import {
  CATEGORY_LABELS,
  CATEGORY_ORDER,
  defaultShapeForCategory,
  legacyCategoryFallback,
  type PartnerCategory,
  type PartnerShape,
} from "./shared";

export interface DirectoryPartner {
  id?: string | null;
  /** URL slug — when set, the card links to /partners/[slug]. */
  slug?: string | null;
  name: string;
  /** New CMS field. Legacy `type` is bridged via legacyCategoryFallback. */
  category?: string | null;
  type?: string | null;
  shape?: string | null;
  description?: string | null;
  region?: string | null;
  since?: string | null;
  contribution?: string | null;
  howWeWork?: string | null;
  website?: string | null;
  contactName?: string | null;
  contactEmail?: string | null;
  /** Optional uploaded partner logo. Falls back to PartnerMark glyph when missing. */
  logoUrl?: string | null;
  logoAlt?: string | null;
}

export interface PartnerDirectoryProps {
  heading?: string | null;
  lead?: string | null;
  partners?: DirectoryPartner[] | null;
}

interface ResolvedPartner extends Omit<DirectoryPartner, 'category' | 'shape'> {
  category: PartnerCategory;
  shape: PartnerShape;
}

const SHAPE_NAMES = new Set<PartnerShape>([
  "leaf",
  "arc",
  "diamond",
  "circle",
  "triangle",
  "bars",
  "cross",
  "hex",
]);

/** Default directory content — mirrors the standalone mockup. Used when no
 *  CMS rows exist so the /partners page renders meaningfully out of the box. */
const DEFAULT_PARTNERS: ResolvedPartner[] = [
  // Technology
  {
    name: "Small Business Digital",
    category: "technology",
    shape: "circle",
    region: "Australia",
    since: "2025",
    description:
      "Digital-readiness programs and tooling for small business — built for the people we serve.",
    contribution: "Digital programs · capability uplift · operator coaching",
    howWeWork: "Co-delivered cohorts and joint clinics for our members.",
  },
  {
    name: "What Works",
    category: "technology",
    shape: "cross",
    region: "Sydney",
    since: "2025",
    description:
      "AI workflow studio. We co-design lightweight automations for small-business operations.",
    contribution: "AI workflows · ops automation · staff training",
    howWeWork: "Joint discovery sessions; build-and-handover engagements.",
  },
  {
    name: "Stitch Analytics",
    category: "technology",
    shape: "bars",
    region: "Melbourne",
    since: "2025",
    description:
      "Privacy-first analytics so members can read their own data without a degree in dashboards.",
    contribution: "GA4 alternative · plain-English reporting",
    howWeWork: "White-labelled inside our member portal.",
  },

  // Creative & Media
  {
    name: "Hue & Cue Studio",
    category: "creative-media",
    shape: "diamond",
    region: "Canberra",
    since: "2024",
    description:
      "Boutique brand & photography studio. They lead our visual refresh sprints for members.",
    contribution: "Brand · photography · campaign art direction",
    howWeWork: "Project rates discounted for Growth Hub members.",
  },
  {
    name: "Riverline Films",
    category: "creative-media",
    shape: "triangle",
    region: "ACT",
    since: "2025",
    description:
      "Documentary-style video for small businesses. Quietly excellent. Allergic to cliché.",
    contribution: "Founder films · social cutdowns · community storytelling",
    howWeWork: "Co-funded shoots for community campaigns.",
  },
  {
    name: "Foundry Sound",
    category: "creative-media",
    shape: "hex",
    region: "Canberra",
    since: "2025",
    description: "Podcast production house. Co-host of our “Local & Loud” series.",
    contribution: "Podcast production · audio editing · distribution",
    howWeWork: "Member rate; joint episodes funded by Growth Hub.",
  },

  // Community & Delivery
  {
    name: "Muslim Community Co-op",
    category: "community-delivery",
    shape: "leaf",
    region: "Canberra",
    since: "2023",
    description:
      "Long-standing community partner. Trusted referral channel into the businesses we serve.",
    contribution: "Outreach · translation · cultural advisory",
    howWeWork: "Shared events, joint outreach, paid community workshops.",
  },
  {
    name: "New Roots Network",
    category: "community-delivery",
    shape: "arc",
    region: "ACT",
    since: "2024",
    description: "Refugee and newcomer business support. We host their digital clinics.",
    contribution: "Referrals · mentorship · cultural brokering",
    howWeWork: "Monthly clinics at our Moore St space.",
  },

  // Industry & Government
  {
    name: "CBR Innovation Network",
    category: "industry-government",
    shape: "hex",
    region: "ACT",
    since: "2024",
    description:
      "Connector across the Canberra innovation ecosystem. Our front door to the wider sector.",
    contribution: "Introductions · co-marketing · venue support",
    howWeWork: "Joint programming and member pipeline.",
  },
  {
    name: "ACT Government",
    category: "industry-government",
    shape: "diamond",
    region: "ACT",
    since: "2023",
    description:
      "Funding partner for our community employment pathways and accessibility programs.",
    contribution: "Grant funding · policy guidance · access to programs",
    howWeWork: "Annual grant agreements; outcomes reporting.",
  },
  {
    name: "Canberra Business Chamber",
    category: "industry-government",
    shape: "bars",
    region: "ACT",
    since: "2024",
    description:
      "Local advocacy and business support. We host joint events for new operators.",
    contribution: "Member benefits · advocacy · referral",
    howWeWork: "Cross-membership pricing for small businesses.",
  },

  // Accelerator & Capital
  {
    name: "GRIFFIN Accelerator",
    category: "accelerator-capital",
    shape: "triangle",
    region: "Canberra",
    since: "2024",
    description:
      "Startup accelerator. They take our high-growth members further when the timing is right.",
    contribution: "Coaching · investor access · alumni network",
    howWeWork: "Warm introductions, joint mentor pool.",
  },
  {
    name: "Lighthouse Business",
    category: "accelerator-capital",
    shape: "arc",
    region: "ACT",
    since: "2024",
    description: "Advisory practice for owner-operated firms. Strategy that fits a 7-person team.",
    contribution: "Strategy · finance · governance",
    howWeWork: "Subsidised advisory hours for members.",
  },

  // Research & Education
  {
    name: "ANU Centre for Social Impact",
    category: "research-education",
    shape: "circle",
    region: "Canberra",
    since: "2024",
    description: "Independent measurement of our social return. They keep us honest.",
    contribution: "SROI · evaluation · published research",
    howWeWork: "Annual evaluation engagement, open reporting.",
  },
  {
    name: "CIT Solutions",
    category: "research-education",
    shape: "leaf",
    region: "ACT",
    since: "2025",
    description:
      "Vocational training partner. Pathway from our community programs into accredited courses.",
    contribution: "Accredited training · recognition of prior learning",
    howWeWork: "Stipended placements for community members.",
  },
];

function normalise(p: DirectoryPartner): ResolvedPartner | null {
  const category = legacyCategoryFallback(p.category ?? p.type ?? null);
  if (!category) return null;
  const shape =
    p.shape && SHAPE_NAMES.has(p.shape as PartnerShape)
      ? (p.shape as PartnerShape)
      : defaultShapeForCategory(category);
  return {
    ...p,
    category,
    shape,
  };
}

export default function PartnerDirectory({
  heading,
  lead,
  partners,
}: PartnerDirectoryProps = {}) {
  const resolved: ResolvedPartner[] =
    partners && partners.length > 0
      ? (partners.map(normalise).filter(Boolean) as ResolvedPartner[])
      : DEFAULT_PARTNERS;

  const [active, setActive] = useState<"all" | PartnerCategory>("all");

  const counts = useMemo(() => {
    const c: Partial<Record<PartnerCategory | "all", number>> = { all: resolved.length };
    resolved.forEach((p) => {
      c[p.category] = (c[p.category] ?? 0) + 1;
    });
    return c;
  }, [resolved]);

  const visible = active === "all" ? resolved : resolved.filter((p) => p.category === active);

  // Only show category chips that have at least one partner.
  const populatedCategories = CATEGORY_ORDER.filter((c) => (counts[c] ?? 0) > 0);

  return (
    <section className="directory" id="directory">
      <div className="wrap">
        <span className="section-label">Directory</span>
        <h2 className="section-h2">{heading ?? "Browse the partner network."}</h2>
        <p className="section-lead">
          {lead ??
            "Grouped by what they actually do for our members. Filter to the category you need or scan the whole list — every partner is named, accountable, and reachable."}
        </p>

        <div className="dir-filters" role="group" aria-label="Filter by partner category">
          <button
            type="button"
            className={`dir-chip${active === "all" ? " is-on" : ""}`}
            onClick={() => setActive("all")}
          >
            <span>All</span>
            <em>{counts.all ?? 0}</em>
          </button>
          {populatedCategories.map((c) => (
            <button
              type="button"
              key={c}
              className={`dir-chip${active === c ? " is-on" : ""}`}
              onClick={() => setActive(c)}
            >
              <span>{CATEGORY_LABELS[c]}</span>
              <em>{counts[c] ?? 0}</em>
            </button>
          ))}
        </div>

        <div className="dir-grid">
          {visible.map((p, i) => (
            <article className="p-card reveal" key={p.id ?? `${p.name}-${i}`}>
              <header className="p-card-top">
                <span className="p-card-mark">
                  {p.logoUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={p.logoUrl} alt={p.logoAlt ?? `${p.name} logo`} className="p-card-logo" />
                  ) : (
                    <PartnerMark shape={p.shape} />
                  )}
                </span>
                <div className="p-card-id">
                  <h3>{p.name}</h3>
                  {(p.region || p.since) && (
                    <span className="p-card-meta">
                      {p.region}
                      {p.region && p.since && <span className="dot-sep"> · </span>}
                      {p.since && <>Since&nbsp;{p.since}</>}
                    </span>
                  )}
                </div>
                <span className="p-card-cat">{CATEGORY_LABELS[p.category]}</span>
              </header>

              {p.description && <p className="p-card-desc">{p.description}</p>}

              {(p.contribution || p.howWeWork) && (
                <dl className="p-card-dl">
                  {p.contribution && (
                    <>
                      <dt>What they bring</dt>
                      <dd>{p.contribution}</dd>
                    </>
                  )}
                  {p.howWeWork && (
                    <>
                      <dt>How we work together</dt>
                      <dd>{p.howWeWork}</dd>
                    </>
                  )}
                </dl>
              )}

              {/* Card link priority: own deep page > external website > #contact.
                  Deep page wins because /partners/[slug] is fully under our
                  control and gives the visitor more context than a website
                  drop-off. */}
              {p.slug ? (
                <a
                  className="p-card-link"
                  href={`/partners/${p.slug}`}
                  onClick={() =>
                    track('partner_card_click', {
                      partner: p.slug,
                      category: p.category,
                      destination: 'profile',
                    })
                  }
                >
                  Read partnership profile
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" aria-hidden="true">
                    <path d="M3 7h8M7 3l4 4-4 4" />
                  </svg>
                </a>
              ) : p.website ? (
                <a
                  className="p-card-link"
                  href={p.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() =>
                    track('partner_card_click', {
                      partner: p.name,
                      category: p.category,
                      destination: 'website',
                    })
                  }
                >
                  Visit website
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" aria-hidden="true">
                    <path d="M3 7h8M7 3l4 4-4 4" />
                  </svg>
                </a>
              ) : (
                <a className="p-card-link" href="#contact">
                  Read partnership profile
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" aria-hidden="true">
                    <path d="M3 7h8M7 3l4 4-4 4" />
                  </svg>
                </a>
              )}
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
