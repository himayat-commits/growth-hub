export interface ProofStat {
  tag?: string | null;
  num: string;
  unit?: string | null;
  heading: string;
  body?: string | null;
}

export interface ProofQuote {
  text: string;
  attribution: string;
}

export interface PartnerProofProps {
  heading?: string | null;
  lead?: string | null;
  stats?: ProofStat[] | null;
  quotes?: ProofQuote[] | null;
}

// Renders ONLY what the CMS (PartnersPage global → proofStats / proofQuotes)
// supplies. There used to be hardcoded fallback stats ("400+ people", "50+
// events", "$400K in wages") and two anonymous testimonials here; they had no
// source behind them, so they were removed (Sep 2026) rather than risk
// publishing impact claims we can't stand behind. When the CMS has neither
// stats nor quotes the whole section disappears and the page flows from
// Benefits straight into the Become-a-partner CTA.
export default function PartnerProof({ heading, lead, stats, quotes }: PartnerProofProps = {}) {
  const resolvedStats = stats && stats.length > 0 ? stats : [];
  const resolvedQuotes = quotes && quotes.length > 0 ? quotes : [];

  if (resolvedStats.length === 0 && resolvedQuotes.length === 0) return null;

  const defaultHeading = resolvedStats.length > 0 ? "Impact by the numbers." : "What our partners say.";

  return (
    <section className="proof section-pad" id="proof">
      <div className="wrap">
        <div className="proof-head">
          <span className="section-label">Impact</span>
          <h2 className="section-h2">{heading ?? defaultHeading}</h2>
          {lead && <p style={{ color: "rgba(243,240,231,0.82)", marginTop: "12px", fontSize: "clamp(17px,1.25vw,20px)" }}>{lead}</p>}
        </div>

        {resolvedStats.length > 0 && (
          <div className="proof-grid">
            {resolvedStats.map((s, i) => (
              <div className="proof-card reveal" key={i}>
                {s.tag && <span className="proof-tag">{s.tag}</span>}
                <div className="proof-stat">
                  <span className="num">{s.num}</span>
                  {s.unit && <span className="unit">{s.unit}</span>}
                </div>
                <h3>{s.heading}</h3>
                {s.body && <p>{s.body}</p>}
              </div>
            ))}
          </div>
        )}

        {resolvedQuotes.length > 0 && (
          <div className="proof-quotes">
            {resolvedQuotes.map((q, i) => (
              <blockquote className="proof-quote reveal" key={i}>
                <span className="qmark" aria-hidden="true">&ldquo;</span>
                <p>{q.text}</p>
                <cite>{q.attribution}</cite>
              </blockquote>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
