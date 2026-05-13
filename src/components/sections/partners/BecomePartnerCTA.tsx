import Link from "next/link";

export interface BecomePartnerCTAProps {
  heading?: string | null;
  body?: string | null;
  bullets?: Array<{ text: string }> | null;
  ctaLabel?: string | null;
  ctaHref?: string | null;
  secondaryCtaLabel?: string | null;
  secondaryCtaHref?: string | null;
  /** Contact info for the right-hand panel */
  email?: string | null;
  phone?: string | null;
  address?: string | null;
}

const DEFAULTS = {
  heading: "Become a partner.",
  body: "We're always looking for aligned organisations to grow with. Whether you're a technology provider, a community organisation, a funding body, or a business support service, there's a place for you in the Growth Hub network.",
  bullets: [
    "Co-marketing and co-branding opportunities",
    "Access to a growing network of local business owners",
    "Genuine community impact — visible and measurable",
    "Featured placement on our /partners page",
  ],
  ctaLabel: "Get in touch",
  ctaHref: "mailto:hello@himayat.com.au?subject=Partnership%20Enquiry",
  secondaryCtaLabel: "View packages",
  secondaryCtaHref: "/#packages",
  email: "hello@himayat.com.au",
  phone: "02 5119 0005",
  address: "Level 4, 1 Moore St\nCanberra ACT 2601",
};

export default function BecomePartnerCTA({
  heading,
  body,
  bullets,
  ctaLabel,
  ctaHref,
  secondaryCtaLabel,
  secondaryCtaHref,
  email,
  phone,
  address,
}: BecomePartnerCTAProps = {}) {
  const resolvedBullets = bullets && bullets.length > 0
    ? bullets.map((b) => b.text)
    : DEFAULTS.bullets;

  const resolvedEmail = email ?? DEFAULTS.email;
  const resolvedPhone = phone ?? DEFAULTS.phone;
  const resolvedAddress = address ?? DEFAULTS.address;

  return (
    <section className="become" id="become">
      <div className="wrap">
        <div className="become-card">
          <div className="become-copy">
            <h2 style={{ fontFamily: "var(--font-serif)", fontWeight: 400, fontSize: "clamp(36px,3.5vw,56px)", letterSpacing: "-0.02em", lineHeight: 1.1, margin: 0 }}>
              {heading ?? DEFAULTS.heading}
            </h2>
            <p>{body ?? DEFAULTS.body}</p>

            <div style={{ display: "flex", gap: "12px", flexWrap: "wrap", marginBottom: "32px" }}>
              <Link
                href={ctaHref ?? DEFAULTS.ctaHref}
                className="btn become-primary"
              >
                {ctaLabel ?? DEFAULTS.ctaLabel}
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" aria-hidden="true">
                  <path d="M3 7h8M7 3l4 4-4 4" />
                </svg>
              </Link>
              <Link
                href={secondaryCtaHref ?? DEFAULTS.secondaryCtaHref}
                className="btn btn-secondary become-secondary"
              >
                {secondaryCtaLabel ?? DEFAULTS.secondaryCtaLabel}
              </Link>
            </div>

            {resolvedBullets.length > 0 && (
              <ul className="become-list">
                {resolvedBullets.map((b, i) => (
                  <li key={i}>
                    <span className="bullet">→</span>
                    {b}
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="become-side">
            <div className="become-meta">
              <span className="lbl">Email</span>
              <a
                href={`mailto:${resolvedEmail}`}
                className="val become-meta"
                style={{ fontSize: "15px" }}
              >
                {resolvedEmail}
              </a>
            </div>
            {resolvedPhone && (
              <div className="become-meta">
                <span className="lbl">Phone</span>
                <a
                  href={`tel:${resolvedPhone.replace(/\s/g, "")}`}
                  className="val"
                  style={{ fontSize: "15px", color: "var(--eggshell)" }}
                >
                  {resolvedPhone}
                </a>
              </div>
            )}
            {resolvedAddress && (
              <div className="become-meta">
                <span className="lbl">Visit</span>
                <span className="val" style={{ fontSize: "15px", whiteSpace: "pre-line" }}>
                  {resolvedAddress}
                </span>
              </div>
            )}
            <div className="become-sig">
              <span className="lbl">From the team at</span>
              <span className="sig">Himayat</span>
              <span className="sub">Social Traders Verified · Canberra, ACT</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
