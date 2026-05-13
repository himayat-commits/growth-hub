import type { PartnerType } from "./shared";

export interface FeaturedWallProps {
  heading?: string | null;
  lead?: string | null;
  partners?: Array<{
    id?: string | null;
    name: string;
    type?: string | null;
  }> | null;
}

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
    default: // enterprise + fallback
      return (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <rect x="3" y="7" width="18" height="14" rx="2" />
          <path d="M8 7V5a2 2 0 0 1 4 0v2" /><path d="M16 7V5a2 2 0 0 0-4 0v2" />
          <path d="M8 12h.01M12 12h.01M16 12h.01" />
        </svg>
      );
  }
}

const TYPE_LABELS: Record<string, string> = {
  technology: "Technology",
  community: "Community",
  enterprise: "Enterprise",
  funding: "Funding",
  media: "Media",
};

const DEFAULT_PARTNERS: Array<{ id?: string | null; name: string; type: PartnerType }> = [
  { name: "ACT Government", type: "funding" },
  { name: "Canberra Business Chamber", type: "community" },
  { name: "Social Traders", type: "community" },
  { name: "Birdeye", type: "technology" },
  { name: "GRIFFIN Accelerator", type: "enterprise" },
  { name: "CBR Innovation Network", type: "community" },
  { name: "Lighthouse Business", type: "enterprise" },
  { name: "Muslim Community Co-op", type: "community" },
];

export default function FeaturedWall({ heading, lead, partners }: FeaturedWallProps = {}) {
  const resolvedPartners =
    partners && partners.length > 0 ? partners : DEFAULT_PARTNERS;

  return (
    <section className="featured-wall" id="featured">
      <div className="wrap">
        <div className="fw-head">
          <div>
            <span className="section-label">Featured Partners</span>
            <h2 className="section-h2" style={{ margin: 0 }}>
              {heading ?? "The network behind the network."}
            </h2>
          </div>
          {lead && <p className="fw-lead">{lead}</p>}
        </div>

        <div className="fw-grid">
          {resolvedPartners.map((p, i) => (
            <div className="fw-cell" key={p.id ?? i}>
              <span className="fw-mark">
                <PartnerTypeIcon type={p.type} />
              </span>
              <span className="fw-name">{p.name}</span>
              <span className="fw-type">{TYPE_LABELS[p.type ?? ""] ?? p.type}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
