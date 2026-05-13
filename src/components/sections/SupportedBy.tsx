const DEFAULT_PARTNERS = [
  "Birdeye",
  "CBR Innovation Network",
  "What Works",
  "ACT Government",
  "Canberra Business Chamber",
  "Lighthouse Business",
  "Muslim Community Co-op",
  "GRIFFIN Accelerator",
];

const GlyphIcon = () => (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" aria-hidden="true">
    <path d="M2 10 L 7 4 L 12 10 M4 11 H 10" />
  </svg>
);

export interface SupportedByProps {
  heading?: string | null;
  textItems?: Array<{ name: string; id?: string | null }> | null;
}

export default function SupportedBy({ heading, textItems }: SupportedByProps) {
  const partners =
    textItems && textItems.length > 0
      ? textItems.map((t) => t.name)
      : DEFAULT_PARTNERS;

  const doubled = [...partners, ...partners];

  return (
    <section className="supported" style={{ padding: "60px 0" }}>
      <div className="wrap">
        <div className="supported-head">
          <h4>{heading ?? "Supported by"}</h4>
          <span>Partners &amp; funders</span>
        </div>
      </div>
      <div className="marquee">
        <div className="marquee-track" aria-label="Partners and funders">
          {doubled.map((p, i) => (
            <span className="logo-item" key={i} aria-hidden={i >= partners.length ? "true" : undefined}>
              <span className="glyph"><GlyphIcon /></span>
              {p}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}
