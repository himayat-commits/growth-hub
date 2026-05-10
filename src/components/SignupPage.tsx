"use client";

import Script from "next/script";

interface TrustItem {
  text: string;
}

interface SignupPageProps {
  eyebrow: string;
  title: string;
  tagline: string;
  price: number;
  priceTerms: string;
  features: string[];
  addon?: string;
  featured?: boolean;
  trustItems: TrustItem[];
  hubspotPortalId: string;
  hubspotFormId: string;
  hubspotRegion: string;
}

const TRUST_ICONS = [
  <svg key="shield" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M12 2 L 3 6 V 12 C 3 17 7 21 12 22 C 17 21 21 17 21 12 V 6 Z" /><path d="M9 12 L 11 14 L 15 10" /></svg>,
  <svg key="lock" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></svg>,
  <svg key="check" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="9" /><path d="M8 12 L 11 15 L 16 9" /></svg>,
];

export default function SignupPage({
  eyebrow,
  title,
  tagline,
  price,
  priceTerms,
  features,
  addon,
  featured,
  trustItems,
  hubspotPortalId,
  hubspotFormId,
  hubspotRegion,
}: SignupPageProps) {
  return (
    <>
      {/* Portal-specific script — auto-discovers .hs-form-frame divs on the page */}
      <Script
        src={`https://js-${hubspotRegion}.hsforms.net/forms/embed/${hubspotPortalId}.js`}
        strategy="afterInteractive"
      />
      <main className="signup-main">
        <div className="wrap">
          <div className="signup-grid">
            {/* Left summary column */}
            <div className="signup-summary">
              <div className="signup-eyebrow">{eyebrow}</div>
              <h1 className="signup-title">{title}</h1>
              <p className="signup-tagline">{tagline}</p>

              <div className={`signup-pricecard ${featured ? "featured" : ""}`}>
                <div className="signup-price">
                  ${price.toLocaleString()}
                  <span className="unit">/month</span>
                </div>
                <p style={{ fontSize: 13, margin: "8px 0 20px", opacity: 0.7 }}>
                  {priceTerms}
                </p>
                <ul className="signup-features">
                  {features.map((f) => <li key={f}>{f}</li>)}
                </ul>
                {addon && (
                  <p style={{ fontSize: 14, fontStyle: "italic", marginTop: 16, opacity: 0.75 }}>
                    + {addon}
                  </p>
                )}
              </div>

              <div className="signup-trust">
                {trustItems.map((item, i) => (
                  <div className="signup-trust-item" key={item.text}>
                    {TRUST_ICONS[i % TRUST_ICONS.length]}
                    <span>{item.text}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Right form column — portal script auto-initialises this div */}
            <div>
              <div className="signup-formwrap">
                <div
                  className="hs-form-frame"
                  data-region={hubspotRegion}
                  data-portal-id={hubspotPortalId}
                  data-form-id={hubspotFormId}
                />
              </div>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
