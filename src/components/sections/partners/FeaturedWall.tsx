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
    /** Real logo image URL (from the CMS `logo` upload field). When absent we
     *  fall back to the abstract PartnerMark glyph. */
    logoUrl?: string | null;
    logoAlt?: string | null;
  }> | null;
}

/** Default partners shown if no CMS data — mirrors the standalone mockup
 *  so the page never renders empty. */
const DEFAULT_PARTNERS: Array<{
  name: string;
  category: PartnerCategory;
  shape: PartnerShape;
}> = [
  { name: "Birdeye", category: "technology", shape: "circle" },
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
            logoUrl: p.logoUrl ?? null,
            logoAlt: p.logoAlt ?? null,
          };
        })
      : DEFAULT_PARTNERS.map((p) => ({
          id: null as string | null,
          name: p.name,
          category: p.category,
          shape: p.shape,
          logoUrl: null as string | null,
          logoAlt: null as string | null,
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
              <span className={`fw-mark${p.logoUrl ? " has-logo" : ""}`}>
                {p.logoUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={p.logoUrl} alt={p.logoAlt || `${p.name} logo`} loading="lazy" />
                ) : (
                  <PartnerMark shape={p.shape} />
                )}
              </span>
              <span className="fw-name">{p.name}</span>
              <span className="fw-type">{p.category ? CATEGORY_LABELS[p.category] : ""}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
