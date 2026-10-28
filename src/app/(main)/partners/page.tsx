import type { Metadata } from 'next';
import { ogBase, twitterBase } from '../shared-metadata';
import Link from 'next/link';

const TITLE = 'Partners — Growth Hub by Himayat';
const DESCRIPTION =
  'Support Canberra small businesses? Co-host a Growth Hub Session, present at one, or refer owners our way.';

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: '/partners' },
  openGraph: { ...ogBase, title: TITLE, description: DESCRIPTION, url: '/partners' },
  twitter: { ...twitterBase, title: TITLE, description: DESCRIPTION },
};

const WAYS = [
  {
    kicker: 'Co-host',
    title: 'Run a Session with us',
    body: 'Bring the expertise and your community. We bring the room, the format, the promotion and the follow-up.',
  },
  {
    kicker: 'Present',
    title: 'Teach one practical move',
    body: 'Thirty minutes, Canberra examples, no product pitch. Then help out at the table clinic.',
  },
  {
    kicker: 'Refer',
    title: 'Send owners our way',
    body: 'Sessions are free for everyone. Owners you refer can have a free Build Lab seat.',
  },
];

export default function PartnersPage() {
  return (
    <main>
      <section className="site-hero">
        <div className="wrap site-split" style={{ alignItems: 'end' }}>
          <div>
            <span className="section-label">Partners</span>
            <h1 className="hero-h1">We don&apos;t grow alone.</h1>
            <p className="site-lede" style={{ marginBottom: 0 }}>
              If you support Canberra small businesses, as an adviser, an employment
              or settlement service, an industry body or a local specialist, there&apos;s
              a way to work with us.
            </p>
          </div>
          <div className="site-ctas" style={{ flexDirection: 'column', alignItems: 'stretch' }}>
            <Link className="btn btn-primary" href="/about#contact" style={{ justifyContent: 'center' }}>
              Talk to us about partnering
            </Link>
            <Link className="btn btn-secondary" href="/events" style={{ justifyContent: 'center' }}>
              See the Sessions calendar
            </Link>
          </div>
        </div>
      </section>

      <section className="site-sec site-sec--white" id="work-with-us">
        <div className="wrap">
          <div className="site-head">
            <h2 className="section-h2">Ways to work with us</h2>
          </div>
          <div className="site-grid">
            {WAYS.map((w) => (
              <div className="site-card site-card--egg" key={w.title}>
                <span className="site-kicker">{w.kicker}</span>
                <h3>{w.title}</h3>
                <p>{w.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>


      <section className="site-sec site-sec--tight">
        <div className="wrap">
          <div className="site-panel site-panel--plum">
            <div>
              <h2 className="section-h2">Know someone we should meet?</h2>
              <span className="site-script handscript">introductions always welcome</span>
            </div>
            <div>
              <Link className="btn btn-lime" href="/about#contact">Write us a line</Link>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
