import Link from "next/link";

const ITEMS = [
  { q: "Growth Hub understood our business from day one. We went from invisible online to getting calls every week.", who: "Local restaurant owner", where: "Canberra" },
  { q: "The community webinars alone are worth it. I've learned more in two months than in a year trying to figure it out myself.", who: "Home services operator", where: "Queanbeyan" },
  { q: "Having a team that actually gets what it's like to run a small business in a new country. That's what made the difference.", who: "Retail business owner", where: "Belconnen" },
  { q: "I finally understand my own marketing. The team walked me through every tool until it clicked.", who: "Cafe owner", where: "Gungahlin" },
  { q: "We doubled our bookings in three months. I can't believe how affordable it is compared to agencies.", who: "Salon owner", where: "Tuggeranong" },
  { q: "Google reviews went from 12 to over 80 in six months. The Reviews AI just does it all in the background.", who: "Trades business owner", where: "Kingston" },
];

const loop = [...ITEMS, ...ITEMS];

export default function Testimonials() {
  return (
    <section className="ttg">
      <div className="ttg-marquee" aria-label="Customer stories">
        <div className="ttg-track">
          {loop.map((it, i) => (
            <div
              className="ttg-card"
              key={i}
              aria-hidden={i >= ITEMS.length ? "true" : undefined}
            >
              <div className="ttg-stars" aria-label="5 out of 5 stars">★★★★★</div>
              <p>&ldquo;{it.q}&rdquo;</p>
              <footer>
                <span className="who">{it.who}</span>
                <span className="where">{it.where}</span>
              </footer>
            </div>
          ))}
        </div>
      </div>
      <div className="ttg-cta">
        <Link className="btn btn-primary" href="#contact">
          Sign Up Now
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
            <path d="M3 7h8M7 3l4 4-4 4" />
          </svg>
        </Link>
      </div>
    </section>
  );
}
