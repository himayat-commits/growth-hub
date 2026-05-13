export interface BenefitItem {
  tag: string;
  heading: string;
  body: string;
  handnote?: string | null;
}

export interface PartnerBenefitsProps {
  heading?: string | null;
  lead?: string | null;
  benefits?: BenefitItem[] | null;
}

const DEFAULT_BENEFITS: BenefitItem[] = [
  {
    tag: "01 — Reach",
    heading: "Access a growing network of local businesses.",
    body: "Growth Hub puts your brand, services, and expertise in front of 30+ local business owners and a rapidly growing subscriber base — all actively seeking trusted partners.",
    handnote: "Grow your pipeline.",
  },
  {
    tag: "02 — Purpose",
    heading: "Partner with a certified social enterprise.",
    body: "Every Growth Hub subscription funds employment pathways for people facing barriers. When you partner with us, your brand is visibly aligned with real community impact — not just a logo on a wall.",
    handnote: "Do business differently.",
  },
  {
    tag: "03 — Co-creation",
    heading: "Build something together.",
    body: "We're always looking for partners who want to co-create. Whether it's a joint workshop, a bundled offer, or a community event, we'll work with you to create genuine value for our shared audience.",
    handnote: "More than a listing.",
  },
];

export default function PartnerBenefits({ heading, lead, benefits }: PartnerBenefitsProps = {}) {
  const resolvedBenefits = benefits && benefits.length > 0 ? benefits : DEFAULT_BENEFITS;

  return (
    <section className="benefits section-pad" id="benefits">
      <div className="wrap">
        <span className="section-label">Why Partner With Us</span>
        <h2 className="section-h2">{heading ?? "Why partner with Growth Hub?"}</h2>
        {lead && <p className="benefits-lead">{lead}</p>}

        <div className="ben-grid">
          {resolvedBenefits.map((b, i) => (
            <div className="ben-card reveal" key={i}>
              <span className="ben-tag">{b.tag}</span>
              <h3>{b.heading}</h3>
              <p>{b.body}</p>
              {b.handnote && (
                <span className="ben-hand">{b.handnote}</span>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
