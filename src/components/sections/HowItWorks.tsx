import Image from "next/image";

const DEFAULT_STEPS = [
  { title: "Choose your tier", description: "Self-service to fully managed. Pick the level that fits your business stage and budget." },
  { title: "We set you up", description: "Onboarding videos, platform access, and community groups activated from day one." },
  { title: "Grow with real support", description: "Weekly webinars, peer community, and live in-person events. You're never doing this alone." },
  { title: "Scale when you're ready", description: "Upgrade tiers or add modules as your business grows. No lock-in on self-service." },
];

export interface HowItWorksProps {
  heading?: string | null;
  steps?: Array<{ title: string; description: string; id?: string | null }> | null;
  sectionImage?: { url: string; alt?: string | null } | null;
  imageBadge?: string | null;
}

export default function HowItWorks({ heading, steps, sectionImage, imageBadge }: HowItWorksProps) {
  const resolvedSteps = steps && steps.length > 0 ? steps : DEFAULT_STEPS;

  return (
    <section id="how" className="how-section">
      <div className="wrap">
        <div className="how-layout">
          <div className="how-heading">
            <span className="section-label">How it works</span>
            <h2 className="section-h2" style={{ fontSize: "clamp(32px, 3.4vw, 44px)", marginBottom: 0 }}>
              {heading ?? "From signup to growth\nin four simple steps."}
            </h2>
          </div>

          <ol className="how-steps">
            {resolvedSteps.map((s, i) => (
              <li className="how-step" key={i}>
                <div className="how-step-num">{i + 1}</div>
                <div className="how-step-body">
                  <h3>{s.title}</h3>
                  <p>{s.description}</p>
                </div>
              </li>
            ))}
          </ol>

          <div className="how-right">
            <div className="how-photo">
              <Image
                src={sectionImage?.url ?? "/images/workshop.jpg"}
                alt={sectionImage?.alt ?? "Growth Hub community workshop in Canberra"}
                fill
                style={{ objectFit: "cover" }}
                sizes="(max-width: 900px) 100vw, 50vw"
              />
              <span className="how-photo-badge">
                <span className="pulse" />
                {imageBadge ?? "Live events + webinars"}
              </span>
              <div className="how-photo-caption">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                  <circle cx="9" cy="7" r="4" />
                  <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                  <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                </svg>
                <span>Real community. Real people. Real events.</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
