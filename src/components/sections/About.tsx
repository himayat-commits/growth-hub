const DEFAULT_STATS = [
  { value: "400+", description: "People supported in our community", tone: "teal" },
  { value: "50+", description: "Community events delivered", tone: "plain" },
  { value: "$400K", description: "In direct wages to underemployed community members", tone: "lime" },
  { value: "3:1", description: "Social return on investment target", tone: "plain" },
];

const DEFAULT_PARAGRAPHS = [
  "We're a grassroots social enterprise. We started by helping people navigate complex systems that weren't built for them. Now, we bring that same unwavering support to local business owners.",
  "Big agencies overlook small, diverse businesses. We don't. We combine powerful AI tools with real, accessible community support, so you grow with a team that actually gets it.",
];

const DEFAULT_PULL_QUOTE =
  "When you choose Growth Hub, you're not just growing your business. You're partnering with an ecosystem that turns barriers into bridges, creating real jobs in the neighbourhoods we share.";

export interface AboutProps {
  sectionLabel?: string | null;
  heading?: string | null;
  subheading?: string | null;
  paragraphs?: Array<{ text: string; id?: string | null }> | null;
  pullQuote?: string | null;
  stats?: Array<{
    value: string;
    description: string;
    tone: "teal" | "lime" | "plain";
    id?: string | null;
  }> | null;
}

export default function About({
  sectionLabel,
  heading,
  subheading,
  paragraphs,
  pullQuote,
  stats,
}: AboutProps) {
  const resolvedStats = stats && stats.length > 0 ? stats : DEFAULT_STATS;
  const resolvedParagraphs =
    paragraphs && paragraphs.length > 0
      ? paragraphs.map((p) => p.text)
      : DEFAULT_PARAGRAPHS;
  const resolvedPullQuote = pullQuote ?? DEFAULT_PULL_QUOTE;

  // Build heading with optional italic subheading appended
  const resolvedHeading = heading ?? "Support that starts\nwhere systems stop.";
  const resolvedSubheading = subheading ?? "With people.";

  return (
    <section id="why" className="about">
      <div className="wrap">
        <div className="about-grid">
          <div className="about-copy">
            <span className="section-label">{sectionLabel ?? "About"}</span>
            <h2 className="section-h2 about-h2">
              {resolvedHeading.split("\n").map((line, i, arr) => (
                <span key={i}>
                  {line}
                  {i < arr.length - 1 && <br />}
                </span>
              ))}
              <br />
              <em className="about-h2-em">{resolvedSubheading}</em>
            </h2>
            {resolvedParagraphs.map((text, i) => (
              <p key={i}>{text}</p>
            ))}
            <blockquote className="about-pull">{resolvedPullQuote}</blockquote>
          </div>

          <div className="about-stats">
            {resolvedStats.map((s) => (
              <div className={`as-card as-${s.tone}`} key={s.value}>
                <div className="as-num">{s.value}</div>
                <p className="as-desc">{s.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
