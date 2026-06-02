export interface FinalCTAProps {
  heading?: string | null;
  subheading?: string | null;
  ctaLabel?: string | null;
  ctaHref?: string | null;
  secondaryCtaLabel?: string | null;
  secondaryCtaHref?: string | null;
  supportEmail?: string | null;
  phone?: string | null;
  address?: string | null;
}

export default function FinalCTA({
  heading,
  subheading,
  ctaLabel,
  ctaHref,
  secondaryCtaLabel,
  secondaryCtaHref,
  supportEmail,
  phone,
  address,
}: FinalCTAProps) {
  const resolvedEmail = supportEmail ?? "hello@himayat.com.au";
  const resolvedPhone = phone ?? "02 5119 0005";
  const resolvedPhoneHref = resolvedPhone.replace(/\s/g, "");
  const resolvedAddress = address ?? "Level 4, 1 Moore St, Canberra ACT 2601";

  return (
    <section className="final">
      <div className="wrap">
        <span className="section-label" style={{ color: "var(--lime)" }}>
          Let&apos;s talk
        </span>
        <div className="final-grid" style={{ marginTop: 16 }}>
          <div>
            <h2 className="section-h2">
              {heading ?? "Not sure which package is right for you?"}
            </h2>
            <p>
              {subheading ??
                "Talk to someone who gets it. No sales pitch, no pressure — just a straight conversation about where your business is and what would actually help."}
            </p>
            <div className="hero-ctas">
              <a
                className="btn btn-primary"
                href={ctaHref ?? `mailto:${resolvedEmail}?subject=Growth%20Hub%20Enquiry`}
              >
                {ctaLabel ?? "Contact Us"}
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
                  <path d="M3 7h8M7 3l4 4-4 4" />
                </svg>
              </a>
              <a className="btn btn-secondary" href={secondaryCtaHref ?? "#contact"}>
                {secondaryCtaLabel ?? "Sign Up Now"}
              </a>
            </div>
          </div>

          <div className="final-contact">
            <div className="row">
              <span className="lbl">email</span>
              <a href={`mailto:${resolvedEmail}`}>{resolvedEmail}</a>
            </div>
            <div className="row">
              <span className="lbl">phone</span>
              <a href={`tel:${resolvedPhoneHref}`}>{resolvedPhone}</a>
            </div>
            <div className="row">
              <span className="lbl">visit</span>
              <span>{resolvedAddress}</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
