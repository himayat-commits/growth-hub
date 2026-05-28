import PartnerMark from "./PartnerMark";
import {
  CATEGORY_LABELS,
  defaultShapeForCategory,
  legacyCategoryFallback,
  type PartnerCategory,
  type PartnerShape,
} from "./shared";

export interface FeaturedWallProps {
  heading?: string | null;
  lead?: string | null;
  partners?: Array<{
    id?: string | null;
    name: string;
    /** New `category` field. Legacy records may pass `type` instead — both work. */
    category?: string | null;
    type?: string | null;
    shape?: string | null;
  }> | null;
}

/** Default partners shown if no CMS data — mirrors the standalone mockup
 *  so the page never renders empty. */
const DEFAULT_PARTNERS: Array<{
  name: string;
  category: PartnerCategory;
  shape: PartnerShape;
}> = [
  { name: "Small Business Digital", category: "technology", shape: "circle" },
  { name: "CBR Innovation Network", category: "industry-government", shape: "hex" },
  { name: "ACT Government", category: "industry-government", shape: "diamond" },
  { name: "Canberra Business Chamber", category: "industry-government", shape: "bars" },
  { name: "GRIFFIN Accelerator", category: "accelerator-capital", shape: "triangle" },
  { name: "Lighthouse Business", category: "accelerator-capital", shape: "arc" },
  { name: "Muslim Community Co-op", category: "community-delivery", shape: "leaf" },
  { name: "What Works", category: "technology", shape: "cross" },
];

function resolveCategory(p: {
  category?: string | null;
  type?: string | null;
}): PartnerCategory | null {
  return legacyCategoryFallback(p.category ?? p.type ?? null);
}

function resolveShape(
  shape: string | null | undefined,
  category: PartnerCategory | null,
): PartnerShape {
  if (
    shape &&
    (["leaf", "arc", "diamond", "circle", "triangle", "bars", "cross", "hex"] as const).includes(
      shape as PartnerShape,
    )
  ) {
    return shape as PartnerShape;
  }
  return defaultShapeForCategory(category);
}

export default function FeaturedWall({ heading, lead, partners }: FeaturedWallProps = {}) {
  const resolved =
    partners && partners.length > 0
      ? partners.map((p) => {
          const cat = resolveCategory(p);
          return {
            id: p.id ?? null,
            name: p.name,
            category: cat,
            shape: resolveShape(p.shape, cat),
          };
        })
      : DEFAULT_PARTNERS.map((p) => ({
          id: null as string | null,
          name: p.name,
          category: p.category,
          shape: p.shape,
        }));

  return (
    <section className="featured-wall" id="featured">
      <div className="wrap">
        <div className="fw-head">
          <div>
            <span className="section-label">Featured Partners</span>
            <h2 className="section-h2" style={{ margin: 0 }}>
              {heading ?? "A handful of trusted names that make this work."}
            </h2>
          </div>
          {lead && <p className="fw-lead">{lead}</p>}
        </div>

        <div className="fw-grid">
          {resolved.map((p, i) => (
            <div className="fw-cell" key={p.id ?? `${p.name}-${i}`}>
              <span className="fw-mark">
                <PartnerMark shape={p.shape} />
              </span>
              <span className="fw-name">{p.name}</span>
              <span className="fw-type">{p.category ? CATEGORY_LABELS[p.category] : ""}</span>
            </div>
          ))}
        </div>

        <div className="fw-cta">
          <a href="#directory" className="btn btn-secondary">
            Browse Partner Directory
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" aria-hidden="true">
              <path d="M3 7h8M7 3l4 4-4 4" />
            </svg>
          </a>
        </div>
      </div>
    </section>
  );
}
