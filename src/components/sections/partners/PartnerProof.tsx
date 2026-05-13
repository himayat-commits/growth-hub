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

const DEFAULT_STATS: ProofStat[] = [
  {
    tag: "Community",
    num: "400+",
    unit: "people",
    heading: "People supported across our programs.",
    body: "Employment pathways, digital training, and wraparound support for people facing real barriers.",
  },
  {
    tag: "Impact",
    num: "50+",
    unit: "events",
    heading: "Community events delivered.",
    body: "Workshops, networking meetups, and in-person training sessions across Canberra.",
  },
  {
    tag: "Economy",
    num: "$400K",
    unit: "in wages",
    heading: "Direct wages to underemployed community members.",
    body: "Every Growth Hub subscription contributes to real employment outcomes in the local community.",
  },
];

const DEFAULT_QUOTES: ProofQuote[] = [
  {
    text: "Partnering with Himayat has been one of the most rewarding decisions we've made. They genuinely care about the people they work with.",
    attribution: "A Canberra Community Partner",
  },
  {
    text: "Growth Hub brought us closer to the local business community. The network effect has been real — we've seen referrals we wouldn't have had otherwise.",
    attribution: "A Technology Partner",
  },
];

export default function PartnerProof({ heading, lead, stats, quotes }: PartnerProofProps = {}) {
  const resolvedStats = stats && stats.length > 0 ? stats : DEFAULT_STATS;
  const resolvedQuotes = quotes && quotes.length > 0 ? quotes : DEFAULT_QUOTES;

  return (
    <section className="proof section-pad" id="proof">
      <div className="wrap">
        <div className="proof-head">
          <span className="section-label">Impact</span>
          <h2 className="section-h2">{heading ?? "Impact by the numbers."}</h2>
          {lead && <p style={{ color: "rgba(243,240,231,0.82)", marginTop: "12px", fontSize: "clamp(17px,1.25vw,20px)" }}>{lead}</p>}
        </div>

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
