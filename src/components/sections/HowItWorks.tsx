import Image from "next/image";

const STEPS = [
  { n: "1", t: "Choose your tier", d: "Self-service to fully managed. Pick the level that fits your business stage and budget." },
  { n: "2", t: "We set you up", d: "Onboarding videos, platform access, and community groups activated from day one." },
  { n: "3", t: "Grow with real support", d: "Weekly webinars, peer community, and live in-person events. You're never doing this alone." },
  { n: "4", t: "Scale when you're ready", d: "Upgrade tiers or add modules as your business grows. No lock-in on self-service." },
];

export default function HowItWorks() {
  return (
    <section id="how" className="how-section">
      <div className="wrap">
        <div className="how-layout">
          <div className="how-heading">
            <span className="section-label">How it works</span>
            <h2 className="section-h2" style={{ fontSize: "clamp(32px, 3.4vw, 44px)", marginBottom: 0 }}>
              From signup to growth<br />in four simple steps.
            </h2>
          </div>

          <ol className="how-steps">
            {STEPS.map((s) => (
              <li className="how-step" key={s.n}>
                <div className="how-step-num">{s.n}</div>
                <div className="how-step-body">
                  <h3>{s.t}</h3>
                  <p>{s.d}</p>
                </div>
              </li>
            ))}
          </ol>

          <div className="how-right">
            <div className="how-photo">
              <Image
                src="/images/workshop.jpg"
                alt="Growth Hub community workshop in Canberra"
                fill
                style={{ objectFit: "cover" }}
                sizes="(max-width: 900px) 100vw, 50vw"
              />
              <span className="how-photo-badge">
                <span className="pulse" />
                Live events + webinars
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
