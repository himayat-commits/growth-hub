import Link from "next/link";
import Image from "next/image";

export default function Footer() {
  return (
    <footer className="foot">
      <div className="wrap">
        <div className="foot-grid">
          <div className="foot-col">
            <div className="foot-brand">
              <Image
                src="/images/himayat-logo.png"
                alt="Himayat logomark"
                width={36}
                height={36}
                style={{ objectFit: "contain", filter: "brightness(0) invert(1) sepia(1) saturate(5) hue-rotate(10deg) brightness(1.08)" }}
              />
              <div className="foot-brand-text">
                <span className="name">Growth Hub</span>
                <span className="sub">by Himayat</span>
              </div>
            </div>
            <p>
              A grassroots social enterprise helping local Canberra businesses
              grow with AI-powered tools and real community support.
            </p>
            <div className="foot-badges">
              <span className="mini">Social Traders Verified</span>
              <span className="mini">NDIS Registered</span>
            </div>
          </div>

          <div className="foot-col">
            <h5>Explore</h5>
            <ul>
              <li><Link href="/#packages">Packages</Link></li>
              <li><Link href="/events">Events</Link></li>
              <li><Link href="/partners">Partners</Link></li>
              <li><Link href="/#community">Community</Link></li>
              <li><Link href="/pricing#faq">FAQ</Link></li>
              <li><Link href="/#why">About us</Link></li>
              <li><Link href="/#contact">Contact</Link></li>
            </ul>
          </div>

          <div className="foot-col">
            <h5>Get in touch</h5>
            <ul>
              <li><a href="mailto:hello@himayat.com.au">hello@himayat.com.au</a></li>
              <li><a href="tel:0251190005">02 5119 0005</a></li>
              <li>Level 4, 1 Moore St, Canberra ACT 2601</li>
            </ul>
          </div>
        </div>

        <div className="foot-legal">
          <span>© Himayat 2026. Built by the people it serves.</span>
          <span>ABN 40 169 711 734 · NDIS Reg. 4050130469</span>
        </div>
      </div>
    </footer>
  );
}
