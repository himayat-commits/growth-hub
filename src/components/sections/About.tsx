const STATS = [
  { n: "400+", d: "People supported in our community", tone: "teal" },
  { n: "50+", d: "Community events delivered", tone: "plain" },
  { n: "$400K", d: "In direct wages to underemployed community members", tone: "lime" },
  { n: "3:1", d: "Social return on investment target", tone: "plain" },
];

export default function About() {
  return (
    <section id="why" className="about">
      <div className="wrap">
        <div className="about-grid">
          <div className="about-copy">
            <span className="section-label">About</span>
            <h2 className="section-h2 about-h2">
              Support that starts<br />where systems stop.<br />
              <em className="about-h2-em">With&nbsp;people.</em>
            </h2>
            <p>
              We're a grassroots social enterprise. We started by helping people
              navigate complex systems that weren't built for them. Now, we bring
              that same unwavering support to local business owners.
            </p>
            <p>
              Big agencies overlook small, diverse businesses. We don't. We combine
              powerful AI tools with real, accessible community support, so you grow
              with a team that actually gets it.
            </p>
            <blockquote className="about-pull">
              When you choose Growth Hub, you're not just growing your business.
              You're partnering with an ecosystem that turns barriers into bridges,
              creating real jobs in the neighbourhoods we share.
            </blockquote>
          </div>

          <div className="about-stats">
            {STATS.map((s) => (
              <div className={`as-card as-${s.tone}`} key={s.n}>
                <div className="as-num">{s.n}</div>
                <p className="as-desc">{s.d}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
