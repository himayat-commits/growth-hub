import type { Metadata } from 'next';
import { ogBase, twitterBase } from '../shared-metadata';
import Link from 'next/link';
import { CONTACT, FREE_SEATS } from '@/lib/site';
import { SESSION_FORMAT } from '@/lib/sessions';

// The explainer behind every "How to ask" link. Asking has to stay easy and
// private: a message is enough, with no proof and no reasons asked for.

const TITLE = 'Free Growth Lab seats — Growth Hub by Himayat';
const DESCRIPTION =
  'Doing it tough, or referred by a partner? Ask for a free Growth Lab seat with a message. No proof needed.';

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: FREE_SEATS.path },
  openGraph: { ...ogBase, title: TITLE, description: DESCRIPTION, url: FREE_SEATS.path },
  twitter: { ...twitterBase, title: TITLE, description: DESCRIPTION },
};

const STEPS = [
  {
    h: 'Send a message',
    p: (
      <>
        Use <Link href={FREE_SEATS.ask}>the form</Link>{' '}
        and tick &ldquo;A free Growth Lab seat&rdquo;, email{' '}
        <a href={`mailto:${CONTACT.email}?subject=Free%20Build%20Lab%20seat`}>{CONTACT.email}</a>, or
        call <a href={CONTACT.phoneHref}>{CONTACT.phone}</a>. Tell us which date suits you.
      </>
    ),
  },
  { h: 'We reply and book your seat', p: 'Usually within 48 hours.' },
  { h: 'Come along', p: 'Same morning, same helpers and the same Starter site as everyone else.' },
];

export default function FreeSeatsPage() {
  return (
    <main>
      <section className="site-hero">
        <div className="wrap site-split">
          <div>
            <span className="section-label">Free Growth Lab seats</span>
            <h1 className="hero-h1">Ask for a free Growth Lab seat.</h1>
            <p className="site-lede">
              A Growth Lab costs {SESSION_FORMAT.lab.price}. If that&apos;s hard right now, or a
              service has referred you, ask for a free seat. You don&apos;t need to explain why
              or show us anything.
            </p>
            <div className="site-ctas">
              <Link className="btn btn-primary" href={FREE_SEATS.ask}>Ask for a free seat</Link>
              <Link className="btn btn-secondary" href="/events#whats-on">See Growth Lab dates</Link>
            </div>
          </div>
          <div className="site-panel site-panel--lime" style={{ gridTemplateColumns: '1fr' }}>
            <div>
              <span className="section-label">Private</span>
              <h2 className="section-h2">It stays between you and the Growth Hub team.</h2>
            </div>
            <p>Nobody at the table knows how you got your seat.</p>
          </div>
        </div>
      </section>

      <section className="site-sec site-sec--white">
        <div className="wrap">
          <div className="site-head">
            <h2 className="section-h2">How to ask</h2>
          </div>
          <ol className="guide-steps ask-steps">
            {STEPS.map((s, i) => (
              <li className="guide-step" key={s.h}>
                <span className="guide-box" aria-hidden="true">{i + 1}</span>
                <div>
                  <h3>{s.h}</h3>
                  <p>{s.p}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="site-sec">
        <div className="wrap">
          <div className="site-panel site-panel--plum">
            <div>
              <span className="section-label">Referred by a partner?</span>
              <h2 className="section-h2">Mention who referred you, so we can thank them.</h2>
            </div>
            <div>
              <p>A partner can also ask for you, with your OK.</p>
              <Link className="btn btn-lime" href="/partners#referrals">How referrals work</Link>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
