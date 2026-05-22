import Link from "next/link";

export interface BecomePartnerCTAProps {
  heading?: string | null;
  body?: string | null;
  bullets?: Array<{ text: string }> | null;
  ctaLabel?: string | null;
  ctaHref?: string | null;
  secondaryCtaLabel?: string | null;
  secondaryCtaHref?: string | null;
  /** Right-side meta panel — all optional, hidden when blank */
  partnershipLead?: string | null;
  /** Partner-specific inbox; falls back to siteSettings.supportEmail. */
  partnerEmail?: string | null;
  /** When set, the secondary CTA repoints here as "Download partnership deck (PDF)". */
  deckUrl?: string | null;
  requirementsUrl?: string | null;
  /** Generic contact (used for the address row). */
  email?: string | null;
  phone?: string | null;
  address?: string | null;
}

const DEFAULTS = {
  heading: "Become a Growth Hub partner.",
  body: "A short conversation — what you bring, what you'd need, what success looks like a year from now. If it fits, we'll write you into the next planning round.",
  bullets: [
    "Reply within 2 business days",
    "One call, one page, no pitch deck demanded",
    "Pilot scope before any long-term agreement",
  ],
  ctaLabel: "Book a partnership call",
  ctaHref: "mailto:partners@himayat.com.au?subject=Partnership%20Enquiry",
  secondaryCtaLabel: "Download partnership deck (PDF)",
  secondaryCtaHref: "#",
  partnerEmail: "partners@himayat.com.au",
  address: "Level 4, 1 Moore St · Canberra ACT 2601",
};

export default function BecomePartnerCTA({
  heading,
  body,
  bullets,
  ctaLabel,
  ctaHref,
  secondaryCtaLabel,
  secondaryCtaHref,
  partnershipLead,
  partnerEmail,
  deckUrl,
  requirementsUrl,
  email,
  address,
}: BecomePartnerCTAProps = {}) {
  const resolvedBullets =
    bullets && bullets.length > 0 ? bullets.map((b) => b.text) : DEFAULTS.bullets;
  // The partnership inbox takes priority for the meta row + the default
  // primary CTA. If neither is set, we fall back to the generic site email.
  const resolvedPartnerEmail = partnerEmail ?? email ?? DEFAULTS.partnerEmail;
  const resolvedAddress = address ?? DEFAULTS.address;

  // Secondary CTA: if a deckUrl is configured, the button becomes a deck
  // download regardless of the secondaryCtaLabel/Href settings. Otherwise
  // it falls back to the CMS-configured secondary CTA (defaulting to the
  // packages link).
  const secondaryLabel = deckUrl
    ? "Download partnership deck (PDF)"
    : (secondaryCtaLabel ?? DEFAULTS.secondaryCtaLabel);
  const secondaryHref = deckUrl ?? secondaryCtaHref ?? DEFAULTS.secondaryCtaHref;

  return (
    <section className="become" id="become">
      <div className="wrap">
        <div className="become-card">
          <div className="become-copy">
            <h2
              style={{
                fontFamily: "var(--font-serif)",
                fontWeight: 400,
                fontSize: "clamp(36px,3.5vw,56px)",
                letterSpacing: "-0.02em",
                lineHeight: 1.1,
                margin: 0,
              }}
            >
              {heading ?? DEFAULTS.heading}
            </h2>
            <p>{body ?? DEFAULTS.body}</p>

            <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 32 }}>
              <Link href={ctaHref ?? DEFAULTS.ctaHref} className="btn become-primary">
                {ctaLabel ?? DEFAULTS.ctaLabel}
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 14 14"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.6"
                  strokeLinecap="round"
                  aria-hidden="true"
                >
                  <path d="M3 7h8M7 3l4 4-4 4" />
                </svg>
              </Link>
              <Link
                href={secondaryHref}
                className="btn btn-secondary become-secondary"
                target={deckUrl ? "_blank" : undefined}
                rel={deckUrl ? "noopener noreferrer" : undefined}
              >
                {secondaryLabel}
              </Link>
            </div>

            {resolvedBullets.length > 0 && (
              <ul className="become-list">
                {resolvedBullets.map((b, i) => (
                  <li key={i}>
                    <span className="bullet">✓</span>
                    {b}
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="become-side">
            {partnershipLead && (
              <div className="become-meta">
                <span className="lbl">Partnership lead</span>
                <span className="val">{partnershipLead}</span>
              </div>
            )}
            <div className="become-meta">
              <span className="lbl">Email</span>
              <a
                href={`mailto:${resolvedPartnerEmail}`}
                className="val"
                style={{ fontSize: 15, color: "var(--eggshell)" }}
              >
                {resolvedPartnerEmail}
              </a>
            </div>
            {resolvedAddress && (
              <div className="become-meta">
                <span className="lbl">Visit</span>
                <span className="val" style={{ fontSize: 15, whiteSpace: "pre-line" }}>
                  {resolvedAddress}
                </span>
              </div>
            )}
            {requirementsUrl && (
              <div className="become-meta">
                <span className="lbl">Requirements</span>
                <a
                  href={requirementsUrl}
                  className="val"
                  style={{ fontSize: 15, color: "var(--eggshell)" }}
                  target={requirementsUrl.startsWith("http") ? "_blank" : undefined}
                  rel={requirementsUrl.startsWith("http") ? "noopener noreferrer" : undefined}
                >
                  View partner requirements →
                </a>
              </div>
            )}
            <div className="become-sig">
              <span className="lbl">Signed,</span>
              <span className="sig handscript">Growth Hub</span>
              <span className="sub">A Social Traders Verified Enterprise</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
