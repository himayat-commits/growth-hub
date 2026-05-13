"use client";

import { useState } from "react";

export interface DirectoryPartner {
  id?: string | null;
  name: string;
  type?: string | null;
  description?: string | null;
  website?: string | null;
  contactName?: string | null;
  contactEmail?: string | null;
}

export interface PartnerDirectoryProps {
  heading?: string | null;
  lead?: string | null;
  partners?: DirectoryPartner[] | null;
}

const TYPE_LABELS: Record<string, string> = {
  technology: "Technology",
  community: "Community",
  enterprise: "Enterprise",
  funding: "Funding",
  media: "Media",
};

const ALL_TYPES = Object.keys(TYPE_LABELS);

function PartnerTypeIcon({ type }: { type?: string | null }) {
  switch (type) {
    case "technology":
      return (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <rect x="4" y="4" width="6" height="6" rx="1" /><rect x="14" y="4" width="6" height="6" rx="1" />
          <rect x="4" y="14" width="6" height="6" rx="1" /><rect x="14" y="14" width="6" height="6" rx="1" />
        </svg>
      );
    case "community":
      return (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <circle cx="9" cy="8" r="3" /><path d="M3 20c0-3 3-5 6-5s6 2 6 5" />
          <circle cx="17" cy="7" r="2.5" /><path d="M15 19c0-2 1.5-3.5 4-4" />
        </svg>
      );
    case "funding":
      return (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <circle cx="12" cy="12" r="9" /><path d="M12 7v1m0 8v1m-3-5h5a1.5 1.5 0 0 1 0 3H9m0 0h5" />
        </svg>
      );
    case "media":
      return (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M5 12a7 7 0 0 1 14 0" /><path d="M8.5 12a3.5 3.5 0 0 1 7 0" />
          <circle cx="12" cy="12" r="1" fill="currentColor" /><path d="M2 12a10 10 0 0 1 20 0" />
        </svg>
      );
    default:
      return (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <rect x="3" y="7" width="18" height="14" rx="2" />
          <path d="M8 7V5a2 2 0 0 1 4 0v2" /><path d="M16 7V5a2 2 0 0 0-4 0v2" />
          <path d="M8 12h.01M12 12h.01M16 12h.01" />
        </svg>
      );
  }
}

const DEFAULT_PARTNERS: DirectoryPartner[] = [
  { name: "ACT Government", type: "funding", description: "Supporting small and diverse businesses across the ACT through grants, programs, and direct investment." },
  { name: "Canberra Business Chamber", type: "community", description: "The peak body for business in the ACT, connecting local businesses with advocacy and networks.", website: "https://canberrabusiness.com" },
  { name: "Social Traders", type: "community", description: "Australia's leading social enterprise certifier. Growth Hub holds Social Traders Verified status.", website: "https://socialtraders.com.au" },
  { name: "Birdeye", type: "technology", description: "The AI-powered customer experience platform at the core of Growth Hub's digital tools.", website: "https://birdeye.com" },
  { name: "GRIFFIN Accelerator", type: "enterprise", description: "Canberra's startup and SME accelerator program supporting early-stage and growth-stage founders." },
  { name: "CBR Innovation Network", type: "community", description: "Connecting Canberra's innovation ecosystem — businesses, researchers, and government." },
  { name: "Lighthouse Business", type: "enterprise", description: "Business coaching, advisory, and mentoring services for growth-stage enterprises in Canberra." },
  { name: "Muslim Community Co-op", type: "community", description: "A Canberra-based cooperative supporting Muslim-owned businesses and community enterprises." },
];

export default function PartnerDirectory({ heading, lead, partners }: PartnerDirectoryProps = {}) {
  const resolvedPartners = partners && partners.length > 0 ? partners : DEFAULT_PARTNERS;
  const [active, setActive] = useState<string>("all");

  const typeCounts = ALL_TYPES.reduce<Record<string, number>>((acc, t) => {
    acc[t] = resolvedPartners.filter((p) => p.type === t).length;
    return acc;
  }, {});

  const visible =
    active === "all"
      ? resolvedPartners
      : resolvedPartners.filter((p) => p.type === active);

  return (
    <section className="directory" id="directory">
      <div className="wrap">
        <span className="section-label">Partner Directory</span>
        <h2 className="section-h2">{heading ?? "Meet our partners."}</h2>
        {lead && <p className="section-lead">{lead}</p>}

        <div className="dir-filters" role="group" aria-label="Filter by partner type">
          <button
            className={`dir-chip${active === "all" ? " is-on" : ""}`}
            onClick={() => setActive("all")}
          >
            All <em>{resolvedPartners.length}</em>
          </button>
          {ALL_TYPES.filter((t) => typeCounts[t] > 0).map((t) => (
            <button
              key={t}
              className={`dir-chip${active === t ? " is-on" : ""}`}
              onClick={() => setActive(t)}
            >
              {TYPE_LABELS[t]} <em>{typeCounts[t]}</em>
            </button>
          ))}
        </div>

        <div className="dir-grid">
          {visible.map((p, i) => (
            <div className="p-card reveal" key={p.id ?? i}>
              <div className="p-card-top">
                <span className="p-card-mark">
                  <PartnerTypeIcon type={p.type} />
                </span>
                <h3>{p.name}</h3>
                {p.website && (
                  <span className="p-card-meta">
                    {p.website.replace(/^https?:\/\//, "").replace(/\/$/, "")}
                  </span>
                )}
              </div>
              {p.type && (
                <span className="p-card-cat">{TYPE_LABELS[p.type] ?? p.type}</span>
              )}
              {p.description && (
                <p className="p-card-desc">{p.description}</p>
              )}
              {(p.contactName || p.contactEmail) && (
                <dl className="p-card-dl">
                  {p.contactName && (
                    <>
                      <dt>Contact</dt>
                      <dd>{p.contactName}</dd>
                    </>
                  )}
                  {p.contactEmail && (
                    <>
                      <dt>Email</dt>
                      <dd>{p.contactEmail}</dd>
                    </>
                  )}
                </dl>
              )}
              {p.website && (
                <a
                  className="p-card-link"
                  href={p.website}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Visit website
                  <svg width="13" height="13" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" aria-hidden="true">
                    <path d="M3 7h8M7 3l4 4-4 4" />
                  </svg>
                </a>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
