import Link from "next/link";

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

// A populated `media` upload as returned by Payload at depth >= 2.
interface MediaDoc {
  url?: string | null;
  alt?: string | null;
}

// A `partners` relationship doc as returned in the logo-strip block at depth >= 1
// (logo media populated at depth 2 via getPageBySlug's depth: 2).
export interface PartnerLogo {
  id?: string | number;
  name: string;
  slug?: string | null;
  logo?: MediaDoc | string | number | null;
}

export interface SupportedByProps {
  heading?: string | null;
  textItems?: Array<{ name: string; id?: string | null }> | null;
  partners?: PartnerLogo[] | null;
}

// Normalised item the marquee renders — either a logo image or a text glyph,
// optionally wrapped in a link to its partner page.
interface MarqueeItem {
  name: string;
  href: string | null;
  logoUrl: string | null;
  logoAlt: string;
}

function partnerHref(slug?: string | null): string {
  return slug ? `/partners/${slug}` : "/partners";
}

export default function SupportedBy({ heading, textItems, partners }: SupportedByProps) {
  let items: MarqueeItem[];

  if (partners && partners.length > 0) {
    items = partners.map((p) => {
      const logo = typeof p.logo === "object" && p.logo !== null ? p.logo : null;
      return {
        name: p.name,
        href: partnerHref(p.slug),
        logoUrl: logo?.url ?? null,
        logoAlt: logo?.alt ?? p.name,
      };
    });
  } else {
    const names =
      textItems && textItems.length > 0 ? textItems.map((t) => t.name) : DEFAULT_PARTNERS;
    items = names.map((name) => ({ name, href: null, logoUrl: null, logoAlt: name }));
  }

  // Doubled for a seamless marquee loop (track translates -50%).
  const doubled = [...items, ...items];

  return (
    <section className="supported" style={{ padding: "60px 0" }}>
      <div className="wrap">
        <div className="supported-head">
          <h4>{heading ?? "Supported by"}</h4>
          <Link href="/partners" className="supported-all">
            Partners &amp; funders →
          </Link>
        </div>
      </div>
      <div className="marquee">
        <div className="marquee-track" aria-label="Partners and funders">
          {doubled.map((item, i) => {
            const isClone = i >= items.length;
            const inner = item.logoUrl ? (
              // Logos can be any format (incl. SVG); a plain <img> avoids
              // next/image's SVG/optimization constraints for the marquee.
              // eslint-disable-next-line @next/next/no-img-element
              <img src={item.logoUrl} alt={item.logoAlt} loading="lazy" decoding="async" />
            ) : (
              <>
                <span className="glyph"><GlyphIcon /></span>
                {item.name}
              </>
            );

            const className = `logo-item${item.logoUrl ? " logo-item--img" : ""}`;

            if (item.href) {
              return (
                <Link
                  href={item.href}
                  key={i}
                  className={className}
                  aria-label={isClone ? undefined : item.name}
                  aria-hidden={isClone ? "true" : undefined}
                  tabIndex={isClone ? -1 : undefined}
                >
                  {inner}
                </Link>
              );
            }

            return (
              <span className={className} key={i} aria-hidden={isClone ? "true" : undefined}>
                {inner}
              </span>
            );
          })}
        </div>
      </div>
    </section>
  );
}
