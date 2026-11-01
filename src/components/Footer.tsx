import Link from "next/link";
import { CONTACT, SITES } from "@/lib/site";
import { Logo } from "@/components/brand/Logo";

export default function Footer() {
  return (
    <footer className="foot">
      <div className="wrap">
        <div className="foot-grid">
          <div className="foot-col">
            <Logo placement="footer" />
            <p>
              Free monthly Sessions, hands-on Growth Labs and websites you can run
              yourself, for Canberra small businesses and sole traders.
            </p>
            <p className="foot-run">Run by Himayat, a Canberra social enterprise.</p>
          </div>

          <div className="foot-col">
            <h5>Sessions</h5>
            <ul>
              <li><Link href="/events">What&apos;s on</Link></li>
              <li><Link href="/events#build-lab">Growth Labs</Link></li>
              <li><Link href="/guides">Free guides</Link></li>
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
