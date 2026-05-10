const BADGES = [
  {
    t: "Social Traders Verified",
    icon: <path d="M12 2 L 3 6 V 12 C 3 17 7 21 12 22 C 17 21 21 17 21 12 V 6 Z M 9 12 L 11 14 L 15 10" />,
  },
  {
    t: "NDIS Registered Provider",
    icon: (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="M8 12 L 11 15 L 16 9" />
      </>
    ),
  },
  {
    t: "Canberra-based",
    icon: (
      <>
        <path d="M12 21 C 7 15 4 11 4 8 A 8 8 0 0 1 20 8 C 20 11 17 15 12 21 Z" />
        <circle cx="12" cy="9" r="2.5" />
      </>
    ),
  },
];

export default function BigQuote() {
  return (
    <section className="big-quote">
      <div className="wrap">
        <div className="bq-card">
          <div className="bq-mark" aria-hidden="true">
            <svg viewBox="0 0 60 48" fill="currentColor">
              <path d="M0 48V28C0 12 8 2 24 0L26 8C16 10 12 16 12 24H24V48H0ZM34 48V28C34 12 42 2 58 0L60 8C50 10 46 16 46 24H58V48H34Z" />
            </svg>
          </div>
          <blockquote>
            <p>
              Growth Hub didn't just set up our digital marketing. They introduced
              us to a community of other local business owners. We've never felt
              alone in this.
            </p>
            <cite>— A Local Canberra Business Owner</cite>
          </blockquote>
          <div className="bq-badges">
            {BADGES.map((b) => (
              <div className="bq-badge" key={b.t}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  {b.icon}
                </svg>
                <span>{b.t}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
