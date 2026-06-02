import Image from "next/image";
import Link from "next/link";

function Underline({ color = "#E3F29C" }: { color?: string }) {
  return (
    <svg
      viewBox="0 0 320 22"
      width="100%"
      aria-hidden="true"
      fill="none"
      stroke={color}
      strokeWidth="3"
      strokeLinecap="round"
      style={{ position: "absolute", left: 0, bottom: "-10px", width: "100%" }}
    >
      <path d="M6 14 C 60 6, 120 4, 180 8 C 230 11, 280 9, 314 13" />
      <path d="M12 18 C 80 15, 160 13, 300 17" opacity="0.5" />
    </svg>
  );
}

// Default content — mirrors the original hardcoded values; used as fallback when CMS fields are absent
const DEFAULTS = {
  eyebrow: "A Social Traders Verified Enterprise",
  handnote: "Grow local. Grow together.",
  subheading:
    "We make that happen. AI-powered digital marketing with real, local support, so you grow confidently — knowing every subscription fuels employment pathways in our community.",
  ctaLabel: "View Packages",
  ctaHref: "#packages",
  secondaryCtaLabel: "Learn More",
  secondaryCtaHref: "#how",
  chips: [
    { text: "30+ local businesses supported" },
    { text: "Community included" },
    { text: "Canberra-based support" },
  ],
};

export interface HeroProps {
  eyebrow?: string | null;
  heading?: string | null;
  handnote?: string | null;
  subheading?: string | null;
  ctaLabel?: string | null;
  ctaHref?: string | null;
  secondaryCtaLabel?: string | null;
  secondaryCtaHref?: string | null;
  /** Optional tertiary CTA. When omitted, the default "Join free" CTA renders.
   *  Pass `tertiaryCta: null` to hide the tertiary slot entirely. */
  tertiaryCtaLabel?: string | null;
  tertiaryCtaHref?: string | null;
  tertiaryCtaHint?: string | null;
  tertiaryCtaAriaLabel?: string | null;
  hideTertiaryCta?: boolean;
  chips?: Array<{ text: string; id?: string | null }> | null;
  /** "dark" renders the hero with a teal background and eggshell text */
  variant?: "light" | "dark";
  /** Extra CSS class(es) applied to the <section> */
  className?: string;
}

export default function Hero({
  eyebrow,
  heading,
  handnote,
  subheading,
  ctaLabel,
  ctaHref,
  secondaryCtaLabel,
  secondaryCtaHref,
  tertiaryCtaLabel,
  tertiaryCtaHref,
  tertiaryCtaHint,
  tertiaryCtaAriaLabel,
  hideTertiaryCta,
  chips,
  variant,
  className,
}: HeroProps) {
  const resolvedChips = chips && chips.length > 0 ? chips : DEFAULTS.chips;

  // Detect if the heading ends with "grow." so we can apply the styled underline
  const resolvedHeading = heading ?? "Your business deserves to grow.";
  const growMatch = resolvedHeading.match(/^([\s\S]*?)(grow)\.\s*$/);

  return (
    <section
      className={["hero", variant === "dark" ? "hero-dark" : "", className ?? ""].filter(Boolean).join(" ")}
      id="top"
    >
      <div className="wrap">
        <div className="hero-eyebrow">
          <span className="dot" />
          {eyebrow ?? DEFAULTS.eyebrow}
        </div>

        <h1 className="hero-h1">
          {growMatch ? (
            <>
              {growMatch[1]}
              <span className="grow">
                grow
                <Underline />
              </span>
              .
            </>
          ) : (
            resolvedHeading
          )}
        </h1>

        <div className="hero-handnote">
          <span className="txt handscript">{handnote ?? DEFAULTS.handnote}</span>
        </div>

        <p className="hero-sub">{subheading ?? DEFAULTS.subheading}</p>

        <div className="hero-ctas">
          <Link className="btn btn-primary" href={ctaHref ?? DEFAULTS.ctaHref}>
            {ctaLabel ?? DEFAULTS.ctaLabel}
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
              <path d="M3 7h8M7 3l4 4-4 4" />
            </svg>
          </Link>
          <Link className="btn btn-secondary" href={secondaryCtaHref ?? DEFAULTS.secondaryCtaHref}>
            {secondaryCtaLabel ?? DEFAULTS.secondaryCtaLabel}
          </Link>
          {!hideTertiaryCta && (
            <Link
              className="btn btn-tertiary"
              href={tertiaryCtaHref ?? "/sign-up?redirect_url=%2Fdashboard"}
              aria-label={tertiaryCtaAriaLabel ?? `${tertiaryCtaLabel ?? "Join free"} ${tertiaryCtaHint ?? "— no card needed"}`}
            >
              {tertiaryCtaLabel ?? "Join free"}{" "}
              <span className="hero-cta-hint">{tertiaryCtaHint ?? "— no card needed"}</span>
            </Link>
          )}
        </div>

        <div className="hero-chips">
          {resolvedChips.map((chip, i) => (
            <span className="chip" key={i}>
              <span className="chip-dot" /> {chip.text}
            </span>
          ))}
        </div>
      </div>

      <div className="hero-art" aria-hidden="true">
        <Image
          src="/images/himayat-logo.png"
          alt=""
          width={520}
          height={520}
          style={{
            objectFit: "contain",
            filter: "opacity(0.14)",
            width: "100%",
            height: "auto",
          }}
        />
      </div>
    </section>
  );
}
