import Link from "next/link";
import Image from "next/image";
import { CONTACT, SITES } from "@/lib/site";

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
              Free monthly Sessions, hands-on Build Labs and websites you can run
              yourself, for Canberra small businesses and sole traders.
            </p>
            <div className="foot-badges">
              <span className="mini">Social Traders Verified</span>
            </div>
          </div>

          <div className="foot-col">
            <h5>Sessions</h5>
            <ul>
              <li><Link href="/events">What&apos;s on</Link></li>
              <li><Link href="/events#build-lab">Build Labs</Link></li>
              <li><Link href="/events/entrepreneurship-for-everyone">Entrepreneurship for Everyone</Link></li>
            </ul>
          </div>

          <div className="foot-col">
            <h5>Growth Hub Sites</h5>
            <ul>
              <li><Link href="/sites">Plans and templates</Link></li>
              <li><a href={SITES.signIn}>Sign in to your site</a></li>
            </ul>
          </div>

          <div className="foot-col">
            <h5>Growth Hub</h5>
            <ul>
              <li><Link href="/about">About</Link></li>
              <li><Link href="/partners">Partners</Link></li>
              <li><Link href="/about#contact">Contact</Link></li>
            </ul>
          </div>

          <div className="foot-col">
            <h5>Say hello</h5>
            <ul>
              <li><a href={`mailto:${CONTACT.email}`}>{CONTACT.email}</a></li>
              <li><a href={CONTACT.phoneHref}>{CONTACT.phone}</a></li>
              <li>{CONTACT.address}</li>
            </ul>
          </div>
        </div>

        <p className="foot-ack">
          We acknowledge the Ngunnawal people, traditional custodians of the land
          where we work, and pay our respects to Elders past and present.
        </p>

        <div className="foot-legal">
          <span>© Himayat 2026 · ABN 40 169 711 734</span>
          <span className="foot-legal-links">
            <Link href="/privacy">Privacy</Link>
            <Link href="/community-guidelines">Community guidelines</Link>
          </span>
        </div>
      </div>
    </footer>
  );
}
