"use client";

import { Fragment, useMemo, useState } from "react";
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
  /** Optional additional categories. Partner appears in each section when
   *  the directory is grouped, and matches each when filtered. */
  secondaryCategories?: Array<string | null | undefined> | null;
  /** Anchor partners render with elevated visual weight (2-col card). */
  isAnchor?: boolean | null;
  shape?: string | null;
  description?: string | null;
  region?: string | null;
  since?: string | null;
  contribution?: string | null;
  howWeWork?: string | null;
  website?: string | null;
  contactName?: string | null;
  contactEmail?: string | null;
  /** Real logo image URL (from the CMS `logo` upload field). When absent the
   *  card falls back to the abstract PartnerMark glyph. */
  logoUrl?: string | null;
  logoAlt?: string | null;
}

export interface RecruitmentCardConfig {
  heading?: string | null;
  body?: string | null;
  needs?: string[] | null;
  ctaLabel?: string | null;
  ctaHref?: string | null;
}

export interface DirectoryQuote {
  text: string;
  attribution: string;
}

export interface PartnerDirectoryProps {
  heading?: string | null;
  lead?: string | null;
  partners?: DirectoryPartner[] | null;
  /** Optional CMS-driven recruitment card; falls back to sensible defaults. */
  recruitmentCard?: RecruitmentCardConfig | null;
  /** Quotes interleaved between category sections to add social proof at the
   *  moment of consideration. Capped at 2 to keep the directory scannable. */
  quotes?: DirectoryQuote[] | null;
}

/** Need-based discovery chips — maps plain-English needs to category filters.
 *  Lets visitors browse the directory without speaking our internal taxonomy. */
const NEEDS: Array<{ id: string; label: string; cat: PartnerCategory }> = [
  { id: 'marketing', label: 'Marketing & brand', cat: 'creative-media' },
  { id: 'funding', label: 'Funding & accelerator', cat: 'accelerator-capital' },
  { id: 'tools', label: 'Tools & automation', cat: 'technology' },
  { id: 'community', label: 'Community outreach', cat: 'community-delivery' },
  { id: 'research', label: 'Research & evaluation', cat: 'research-education' },
  { id: 'gov', label: 'Industry & government', cat: 'industry-government' },
];

interface ResolvedPartner extends Omit<DirectoryPartner, 'category' | 'shape' | 'secondaryCategories'> {
  category: PartnerCategory;
  secondaryCategories: PartnerCategory[];
  shape: PartnerShape;
  isAnchor: boolean;
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

type DefaultPartner = Omit<ResolvedPartner, 'secondaryCategories' | 'isAnchor'> &
  Partial<Pick<ResolvedPartner, 'secondaryCategories' | 'isAnchor'>>;

/** Default directory content — mirrors the standalone mockup. Used when no
 *  CMS rows exist so the /partners page renders meaningfully out of the box. */
const DEFAULT_PARTNERS_RAW: DefaultPartner[] = [
  // Technology
  {
    name: "Birdeye",
    category: "technology",
    shape: "circle",
    region: "ACT · Global",
    since: "2024",
    description:
      "Reputation, reviews and AI-driven customer experience tools that power our Growth and Accelerate packages.",
    contribution: "Reviews automation · AI customer messaging · listing management",
    howWeWork: "Bundled into client subscriptions; we configure and support locally.",
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
  // Note: this is the private advisory practice. Not to be confused with the
  // "Lighthouse Business Innovation Centre" record (Industry & Government) that
  // exists in the CMS — different organisation. Keep both names disambiguated.
  {
    name: "Lighthouse Business Advisory",
    category: "accelerator-capital",
    shape: "arc",
    region: "Canberra",
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

/** Anchor a few defaults so the "anchor tier" visual treatment renders in the
 *  out-of-the-box demo state. Real anchors come through the CMS `isAnchor` flag. */
const DEFAULT_ANCHOR_NAMES = new Set([
  "ACT Government",
  "ANU Centre for Social Impact",
  "CBR Innovation Network",
]);

const DEFAULT_PARTNERS: ResolvedPartner[] = DEFAULT_PARTNERS_RAW.map((p) => ({
  ...p,
  secondaryCategories: p.secondaryCategories ?? [],
  isAnchor: p.isAnchor ?? DEFAULT_ANCHOR_NAMES.has(p.name),
}));

function normalise(p: DirectoryPartner): ResolvedPartner | null {
  const category = legacyCategoryFallback(p.category ?? p.type ?? null);
  if (!category) return null;
  const shape =
    p.shape && SHAPE_NAMES.has(p.shape as PartnerShape)
      ? (p.shape as PartnerShape)
      : defaultShapeForCategory(category);
  const secondaryCategories = (p.secondaryCategories ?? [])
    .map((c) => legacyCategoryFallback(c ?? null))
    .filter((c): c is PartnerCategory => c !== null && c !== category);
  return {
    ...p,
    category,
    secondaryCategories,
    shape,
    isAnchor: Boolean(p.isAnchor),
  };
}

function PartnerCard({ p }: { p: ResolvedPartner }) {
  return (
    <article className={`p-card reveal${p.isAnchor ? ' is-anchor' : ''}`}>
      {p.isAnchor && <span className="p-card-anchor">Anchor partner</span>}
      <span className="p-card-cat">{CATEGORY_LABELS[p.category]}</span>
      <header className="p-card-top">
        <span className={`p-card-mark${p.logoUrl ? " has-logo" : ""}`}>
          {p.logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={p.logoUrl} alt={p.logoAlt || `${p.name} logo`} loading="lazy" />
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
      </header>

      {p.description && <p className="p-card-desc">{p.description}</p>}

      {p.contribution || p.howWeWork ? (
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
      ) : (
        <p className="p-card-status">Partnership profile in progress.</p>
      )}

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
          <ArrowIcon />
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
          <ArrowIcon />
        </a>
      ) : (
        <a className="p-card-link" href="#contact">
          Read partnership profile
          <ArrowIcon />
        </a>
      )}
    </article>
  );
}

function ArrowIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" aria-hidden="true">
      <path d="M3 7h8M7 3l4 4-4 4" />
    </svg>
  );
}

function RecruitmentCard({ config }: { config: RecruitmentCardConfig }) {
  const heading = config.heading ?? 'Could you be here?';
  const body =
    config.body ??
    'Open partnership slots, two-week onboarding, real referral flow. We co-design the relationship so it pays off for your team and ours.';
  const needs = config.needs && config.needs.length > 0 ? config.needs : null;
  const ctaLabel = config.ctaLabel ?? 'Become a partner';
  const ctaHref = config.ctaHref ?? '#become';

  return (
    <aside className="dir-recruit reveal" aria-label="Become a partner">
      <div className="dir-recruit-tag">Open partnership</div>
      <h3 className="dir-recruit-h">{heading}</h3>
      <p className="dir-recruit-body">{body}</p>
      {needs && (
        <ul className="dir-recruit-needs">
          {needs.map((n) => (
            <li key={n}>{n}</li>
          ))}
        </ul>
      )}
      <a
        className="dir-recruit-link"
        href={ctaHref}
        onClick={() => track('partner_recruit_click', { source: 'directory_inline' })}
      >
        {ctaLabel}
        <ArrowIcon />
      </a>
    </aside>
  );
}

export default function PartnerDirectory({
  heading,
  lead,
  partners,
  recruitmentCard,
  quotes,
}: PartnerDirectoryProps = {}) {
  const resolved: ResolvedPartner[] =
    partners && partners.length > 0
      ? (partners.map(normalise).filter(Boolean) as ResolvedPartner[])
      : DEFAULT_PARTNERS;

  const [active, setActive] = useState<"all" | PartnerCategory>("all");

  const matchesCategory = (p: ResolvedPartner, cat: PartnerCategory) =>
    p.category === cat || p.secondaryCategories.includes(cat);

  /** Anchors render first inside each category section. */
  const anchorFirst = (a: ResolvedPartner, b: ResolvedPartner) =>
    Number(b.isAnchor) - Number(a.isAnchor);

  const counts = useMemo(() => {
    const c: Partial<Record<PartnerCategory | "all", number>> = { all: resolved.length };
    resolved.forEach((p) => {
      for (const cat of [p.category, ...p.secondaryCategories]) {
        c[cat] = (c[cat] ?? 0) + 1;
      }
    });
    return c;
  }, [resolved]);

  const populatedCategories = CATEGORY_ORDER.filter((c) => (counts[c] ?? 0) > 0);
  const visible = active === "all" ? resolved : resolved.filter((p) => matchesCategory(p, active));

  // Only show need chips whose target category actually has partners.
  const populatedNeeds = NEEDS.filter((n) => (counts[n.cat] ?? 0) > 0);

  const handleNeedClick = (need: { id: string; cat: PartnerCategory }) => {
    setActive(need.cat);
    track('partner_need_click', { need: need.id, category: need.cat });
    if (typeof window !== 'undefined') {
      window.requestAnimationFrame(() => {
        document.getElementById('directory')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      });
    }
  };

  return (
    <section className="directory" id="directory">
      <div className="wrap">
        <span className="section-label">Directory</span>
        <h2 className="section-h2">{heading ?? "Browse the partner network."}</h2>
        <p className="section-lead">
          {lead ??
            "Grouped by what they actually do for our members. Pick a need below, filter by category, or scan the whole list — every partner is named, accountable, and reachable."}
        </p>

        {populatedNeeds.length > 0 && (
          <div className="dir-needs" role="group" aria-label="Browse partners by need">
            <span className="dir-needs-label">I&rsquo;m looking for&hellip;</span>
            <div className="dir-needs-chips">
              {populatedNeeds.map((n) => (
                <button
                  type="button"
                  key={n.id}
                  className={`dir-need${active === n.cat ? ' is-on' : ''}`}
                  onClick={() => handleNeedClick(n)}
                >
                  {n.label}
                </button>
              ))}
              <a
                className="dir-need dir-need-help"
                href="#contact"
                onClick={() => track('partner_need_click', { need: 'unsure', category: null })}
              >
                Not sure — talk to us
              </a>
            </div>
          </div>
        )}

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

        {active === 'all' ? (
          <div className="dir-sections">
            {populatedCategories.map((cat, sectionIdx) => {
              const inCat = resolved.filter((p) => matchesCategory(p, cat)).slice().sort(anchorFirst);
              // Interleave a single quote after every other section. Caps at 2 total.
              const quoteIdx = Math.floor(sectionIdx / 2);
              const showQuote = quotes && quotes.length > 0 && sectionIdx > 0 && sectionIdx % 2 === 1 && quoteIdx <= quotes.length;
              const quote = showQuote ? quotes![quoteIdx - 1] ?? quotes![0] : null;
              return (
                <Fragment key={cat}>
                  <section className="dir-section" aria-label={CATEGORY_LABELS[cat]}>
                    <header className="dir-section-head">
                      <h3 className="dir-section-h">{CATEGORY_LABELS[cat]}</h3>
                      <span className="dir-section-count">{inCat.length} partner{inCat.length === 1 ? '' : 's'}</span>
                    </header>
                    <div className="dir-grid">
                      {inCat.map((p, i) => (
                        <PartnerCard key={p.id ?? `${p.name}-${i}`} p={p} />
                      ))}
                    </div>
                  </section>
                  {quote && (
                    <blockquote className="dir-quote reveal">
                      <span className="dir-quote-mark">&ldquo;</span>
                      <p>{quote.text}</p>
                      <cite>{quote.attribution}</cite>
                    </blockquote>
                  )}
                </Fragment>
              );
            })}
          </div>
        ) : (
          <div className="dir-grid">
            {visible.slice().sort(anchorFirst).map((p, i) => (
              <PartnerCard key={p.id ?? `${p.name}-${i}`} p={p} />
            ))}
          </div>
        )}

        <RecruitmentCard config={recruitmentCard ?? {}} />
      </div>
    </section>
  );
}
