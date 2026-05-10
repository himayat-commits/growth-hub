export default function FinalCTA() {
  return (
    <section className="final">
      <div className="wrap">
        <span className="section-label" style={{ color: "var(--lime)" }}>
          Let's talk
        </span>
        <div className="final-grid" style={{ marginTop: 16 }}>
          <div>
            <h2 className="section-h2">
              Not sure which package is right for you?
            </h2>
            <p>
              Talk to someone who gets it. No sales pitch, no pressure. Just a
              real conversation about where your business is and what would
              actually help.
            </p>
            <div className="hero-ctas">
              <a
                className="btn btn-primary"
                href="mailto:hello@himayat.com.au?subject=Growth%20Hub%20Enquiry"
              >
                Contact Us
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
                  <path d="M3 7h8M7 3l4 4-4 4" />
                </svg>
              </a>
              <a className="btn btn-secondary" href="#contact">
                Sign Up Now
              </a>
            </div>
          </div>

          <div className="final-contact">
            <div className="row">
              <span className="lbl">email</span>
              <a href="mailto:hello@himayat.com.au">hello@himayat.com.au</a>
            </div>
            <div className="row">
              <span className="lbl">phone</span>
              <a href="tel:0251190005">02 5119 0005</a>
            </div>
            <div className="row">
              <span className="lbl">visit</span>
              <span>Level 4, 1 Moore St, Canberra ACT 2601</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
