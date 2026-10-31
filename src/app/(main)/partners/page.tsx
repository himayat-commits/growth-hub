import type { Metadata } from 'next';
import { ogBase, twitterBase } from '../shared-metadata';
import Image from 'next/image';
import Link from 'next/link';
import { FREE_SEATS } from '@/lib/site';

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

const PARTNER_TYPES = [
  {
    title: 'Settlement services',
    body: 'Your clients are starting out in a new country. We help with the practical, local side of running a business.',
  },
  {
    title: 'Employment providers',
    body: 'For people moving into self-employment, a free Session and a Growth Lab seat are a practical first step.',
  },
  {
    title: 'Multicultural and community organisations',
    body: 'Bring a group to a Session, or co-host one for your community.',
  },
  {
    title: 'Industry bodies',
    body: 'Teach one practical move to owners in your sector, or point members to the Session that fits.',
  },
];

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
    body: 'Sessions are free for everyone. Owners you refer can have a free Growth Lab seat.',
  },
  {
    kicker: 'Bring a group',
    title: 'A Session or Growth Lab for your clients',
    body: 'A private Session or Growth Lab for your clients, members or staff, with a Starter site for each owner. Talk to us about dates.',
  },
];

const REFERRAL_STEPS = [
  'Tell an owner about Growth Hub, or send us their details with their OK.',
  'They come to a free Session, or straight to a Growth Lab.',
  'Owners you refer get a free Growth Lab seat: the morning, the helpers and a Starter site.',
];

// Partner logos, shown only with each organisation's written OK (see the
// claims register in docs/BRAND.md). Logo files go in public/images/partners/.
// While this is empty the section shows a quiet placeholder, never fake logos.
const PARTNER_LOGOS: Array<{ name: string; src: string; href?: string }> = [];

export default function PartnersPage() {
  return (
    <main>
      <section className="site-hero">
        <div className="wrap site-split" style={{ alignItems: 'end' }}>
          <div>
            <span className="section-label">Partners</span>
            <h1 className="hero-h1">We don&apos;t grow alone.</h1>
            <p className="site-lede" style={{ marginBottom: 0 }}>
              If you work with Canberra small business owners, especially new, migrant and
              refugee founders or people doing it tough, there&apos;s a way to work with us.
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

      <section className="site-sec site-sec--white">
        <div className="wrap">
          <div className="site-head">
            <h2 className="section-h2">Who we want to work with</h2>
          </div>
          <div className="site-grid">
            {PARTNER_TYPES.map((t) => (
              <div className="site-card site-card--egg" key={t.title}>
                <h3>{t.title}</h3>
                <p>{t.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="site-sec" id="work-with-us">
        <div className="wrap">
          <div className="site-head">
            <h2 className="section-h2">Ways to work with us</h2>
          </div>
          <div className="site-grid">
            {WAYS.map((w) => (
              <div className="site-card" key={w.title}>
                <span className="site-kicker">{w.kicker}</span>
                <h3>{w.title}</h3>
                <p>{w.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="site-sec site-sec--teal" id="referrals">
        <div className="wrap site-split" style={{ alignItems: 'start' }}>
          <div>
            <span className="section-label">Referrals</span>
            <h2 className="section-h2">How referrals work</h2>
            <p className="section-lead">
              Owners you refer get a free Growth Lab seat. Asking is easy and private: a
              message is enough, with no proof needed.
            </p>
            <Link className="site-link" href={FREE_SEATS.path}>What owners see when they ask</Link>
          </div>
          <ol className="lab-steps">
            {REFERRAL_STEPS.map((s, i) => (
              <li className="lab-step" key={s}>
                <span className="t">Step {i + 1}</span>
                <span>{s}</span>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="site-sec" id="our-partners">
        <div className="wrap">
          <div className="site-head">
            <h2 className="section-h2">Our partners</h2>
          </div>
          {PARTNER_LOGOS.length > 0 ? (
            <ul className="partner-logos">
              {PARTNER_LOGOS.map((p) => {
                const logo = <Image src={p.src} alt={p.name} fill sizes="200px" style={{ objectFit: 'contain' }} />;
                return (
                  <li className="partner-logo" key={p.name}>
                    {p.href ? <a href={p.href}>{logo}</a> : logo}
                  </li>
                );
              })}
            </ul>
          ) : (
            <div className="partner-empty">
              <p>
                We ask every organisation before we show its name or logo, so this space
                fills as they say yes.
              </p>
              <Link className="site-link" href="/about#contact">Want to be one of the first? Talk to us</Link>
            </div>
          )}
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
