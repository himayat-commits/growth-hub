import { CATEGORY_ORDER, type PartnerCategory } from "./shared";

export interface NetworkStatsPartner {
  category?: string | null;
  since?: string | null;
}

export interface NetworkStatsStripProps {
  partners: NetworkStatsPartner[];
}

export default function NetworkStatsStrip({ partners }: NetworkStatsStripProps) {
  const total = partners.length;
  if (total === 0) return null;

  const categories = new Set<PartnerCategory>();
  let earliestYear: number | null = null;

  for (const p of partners) {
    if (p.category && (CATEGORY_ORDER as readonly string[]).includes(p.category)) {
      categories.add(p.category as PartnerCategory);
    }
    if (p.since) {
      const year = parseInt(p.since, 10);
      if (!Number.isNaN(year) && (earliestYear === null || year < earliestYear)) {
        earliestYear = year;
      }
    }
  }

  return (
    <section className="net-stats" aria-label="Partner network at a glance">
      <div className="wrap">
        <ul className="net-stats-row">
          <li>
            <span className="net-stats-num">{total}</span>
            <span className="net-stats-lbl">Active partners</span>
          </li>
          <li>
            <span className="net-stats-num">{categories.size}</span>
            <span className="net-stats-lbl">Categories</span>
          </li>
          {earliestYear !== null && (
            <li>
              <span className="net-stats-num">Since {earliestYear}</span>
              <span className="net-stats-lbl">Building the network</span>
            </li>
          )}
        </ul>
      </div>
    </section>
  );
}
