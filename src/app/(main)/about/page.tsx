import type { Metadata } from 'next';
import { ogBase, twitterBase } from '../shared-metadata';
import Link from 'next/link';
import Contact from '@/components/sections/Contact';

const TITLE = 'About and contact — Growth Hub by Himayat';
const DESCRIPTION =
  'Growth Hub is a Canberra social enterprise by Himayat: support that starts where systems stop, with people. Write us a line.';

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: '/about' },
  openGraph: { ...ogBase, title: TITLE, description: DESCRIPTION, url: '/about' },
  twitter: { ...twitterBase, title: TITLE, description: DESCRIPTION },
};

const VALUES = [
  {
    w: 'Human.',
    p: "A person answers: in a room, on the phone or by email. You're never handed a chatbot when you need help.",
  },
  {
    w: 'Honest.',
    p: "Plain prices, straight answers and no sales pitch in a free Session. If something isn't right for you, we'll say so.",
  },
  {
    w: 'Here.',
    p: 'Canberra-based and in the room. We work with the services and networks owners already use.',
  },
];

export default function AboutPage() {
  return (
    <main>
      <section className="site-hero">
        <div className="wrap site-split">
          <div>
            <span className="section-label">About Growth Hub</span>
            <h1 className="hero-h1">Support that starts where systems stop. With people.</h1>
            <p className="site-lede" style={{ maxWidth: '46ch' }}>
              We&apos;re a grassroots social enterprise. Himayat started by helping people
              find their way through systems that weren&apos;t built for them. Growth Hub
              brings the same support to local business owners, especially the small and
              diverse businesses that big agencies overlook.
            </p>
            <div className="site-ctas">
              <Link className="btn btn-primary" href="/events#whats-on">See Session dates</Link>
              <a className="btn btn-secondary" href="#contact">Write us a line</a>
            </div>
          </div>
          <div className="site-panel site-panel--lavender" style={{ gridTemplateColumns: '1fr' }}>
            <div>
              <span className="section-label">Growth Hub by Himayat</span>
              <h2 className="section-h2">What we do</h2>
            </div>
            <ul className="lab-steps" style={{ gap: 10 }}>
              <li className="site-card" style={{ padding: 18 }}>
                <p><b>Free monthly Sessions</b> on one practical topic, in Canberra.</p>
              </li>
              <li className="site-card" style={{ padding: 18 }}>
                <p><b>Build Labs</b>, where owners build and publish their website in a morning.</p>
              </li>
              <li className="site-card" style={{ padding: 18 }}>
                <p><b>Growth Hub Sites</b>: websites small businesses can run themselves.</p>
              </li>
            </ul>
          </div>
        </div>
      </section>

      <section className="site-sec site-sec--white">
        <div className="wrap values">
          {VALUES.map((v) => (
            <div key={v.w}>
              <span className="w">{v.w}</span>
              <p>{v.p}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="site-sec">
        <div className="wrap site-split">
          <div>
            <span className="section-label">The people</span>
            <h2 className="section-h2">Who you&apos;ll meet</h2>
            <p className="section-lead">
              Sessions are hosted by the Growth Hub team, with presenters from our
              partner organisations and helpers at every table.
            </p>
          </div>
          <div className="site-card">
            <div className="site-person">
              <span className="site-avatar" aria-hidden="true">WJ</span>
              <div>
                <h3>Waheed Jayhoon</h3>
                <p className="site-fine">Founder, Himayat. Hosts Growth Hub Sessions.</p>
              </div>
            </div>
            <p className="site-fine" style={{ marginTop: 8 }}>
              Growth Hub is run by Himayat, a Canberra social enterprise.
            </p>
          </div>
        </div>
      </section>

      <Contact />

      <section className="site-sec">
        <div className="wrap">
          <p className="site-ack">
            We acknowledge the Ngunnawal people, traditional custodians of the land where
            we live and work, and pay our respects to Elders past and present.
          </p>
        </div>
      </section>
    </main>
  );
}
