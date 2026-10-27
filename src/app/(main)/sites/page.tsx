import type { Metadata } from 'next';
import Link from 'next/link';
import BrowserMock from '@/components/sections/site/BrowserMock';
import Questions from '@/components/sections/site/Questions';
import { CONTACT, SITES, SITES_TRIALS_OPEN } from '@/lib/site';
import { SESSION_FORMAT } from '@/lib/sessions';

export const metadata: Metadata = {
  title: 'Growth Hub Sites — a website you can run yourself',
  description:
    'Templates made for local businesses, an AI builder that drafts from your answers, and real people to check it with you. From A$39 a month.',
  alternates: { canonical: '/sites' },
};

const FEATURES = [
  { h: 'Your own domain', p: 'Use the one you have or buy one. The padlock is set up for you.' },
  { h: 'Bookings and enquiries', p: 'People book a time or send a message, and it lands in your inbox.' },
  { h: 'A simple shop', p: 'Sell a few products or gift vouchers without a separate store.' },
  { h: 'Made for phones', p: 'Every template reads and books easily on a phone, where most of your customers are.' },
  { h: 'A chat assistant', p: "Answers common questions on your site, using what you've told it." },
  { h: 'Help from a person', p: "Step-by-step guides, and a real person when you're stuck." },
];

const TEMPLATES = [
  { name: 'Café and food', note: 'Menu, hours, bookings', bg: '#E9D9C4' },
  { name: 'Trades and services', note: 'Services, quotes, service area', bg: '#6FA0A8' },
  { name: 'Health and wellbeing', note: 'Practitioners, appointments', bg: '#D5E2E5' },
  { name: 'Community and care', note: 'Programs, referrals, contact', bg: '#ECDDE5' },
];

export default function SitesPage() {
  return (
    <main>
      <section className="site-hero">
        <div className="wrap site-split">
          <div>
            <span className="section-label">Growth Hub Sites</span>
            <h1 className="hero-h1">A website you can run yourself. Live in a morning.</h1>
            <p className="site-lede">
              Templates made for your kind of business, an AI builder that drafts from
              your answers, and real people to check it with you before it goes live.
            </p>
            <div className="site-ctas" style={{ marginBottom: 20 }}>
              {SITES_TRIALS_OPEN ? (
                <a className="btn btn-primary" href={SITES.trialMonthly}>Start a 14-day free trial</a>
              ) : (
                <Link className="btn btn-primary" href="/about#contact">Talk to us</Link>
              )}
              <Link className="btn btn-secondary" href="/events#build-lab">Build it with us at a Lab</Link>
            </div>
            <p className="site-fine">
              {SITES_TRIALS_OPEN
                ? 'No card for the trial · Prices in AUD, including GST · Cancel any time'
                : 'Self-serve sign-up opens soon · Prices in AUD, including GST'}
            </p>
          </div>
          <BrowserMock address="yourtrade.com.au" name="Your trade" headline="Licensed, local and on time" action="Get a quote" />
        </div>
      </section>

      <section className="site-sec site-sec--white">
        <div className="wrap">
          <div className="site-head">
            <h2 className="section-h2">Everything a small business site needs. Nothing you&apos;ll pay for and never use.</h2>
          </div>
          <div className="feature-grid">
            {FEATURES.map((f) => (
              <div key={f.h}>
                <h3>{f.h}</h3>
                <p>{f.p}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="site-sec">
        <div className="wrap">
          <div className="site-head site-head--row">
            <div>
              <span className="section-label">Templates</span>
              <h2 className="section-h2">Start from one made for your trade</h2>
            </div>
            <p className="site-fine">Or let the AI builder draft one from your answers.</p>
          </div>
          <div className="site-grid site-grid--small">
            {TEMPLATES.map((t) => (
              <div className="template-card" key={t.name}>
                <div className="template-thumb" style={{ background: t.bg }} aria-hidden="true">
                  <i />
                  <i />
                  <i />
                  <i />
                </div>
                <h3>{t.name}</h3>
                <p>{t.note}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="site-sec site-sec--teal" id="plans">
        <div className="wrap">
          <div className="site-head">
            <span className="section-label">Plans</span>
            <h2 className="section-h2">Three ways to get your site live</h2>
          </div>
          <div className="plans">
            <div className="plan">
              <span className="site-kicker" style={{ color: 'var(--lime)' }}>Learn and build</span>
              <h3>Starter</h3>
              <div className="plan-price">
                <b>Free</b>
                <span className="site-fine">with a Build Lab or program code</span>
              </div>
              <ul>
                <li>One site, up to five pages</li>
                <li>On a Growth Hub web address</li>
                <li>Templates and the AI builder</li>
                <li>Help articles</li>
              </ul>
              <Link className="btn btn-secondary" href="/events#build-lab">Book a Build Lab ({SESSION_FORMAT.lab.price})</Link>
            </div>

            <div className="plan plan--featured">
              <span className="site-tag site-tag--free">Most owners choose this</span>
              <h3>Storefront</h3>
              <div className="plan-price">
                <b>A$39<small> a month</small></b>
                <span className="site-fine" style={{ textAlign: 'left' }}>
                  or {SITES_TRIALS_OPEN ? <a href={SITES.trialAnnual} style={{ textDecoration: 'underline' }}>A$390 a year</a> : 'A$390 a year'} (two months free)
                </span>
              </div>
              <ul>
                <li>Everything in Starter</li>
                <li>Your own domain</li>
                <li>Bookings, a shop and the chat assistant</li>
                <li>The app version of your site</li>
                <li>Support from a person</li>
              </ul>
              {SITES_TRIALS_OPEN ? (
                <a className="btn btn-primary" href={SITES.trialMonthly}>Start 14-day free trial</a>
              ) : (
                <Link className="btn btn-primary" href="/about#contact">Talk to us</Link>
              )}
              <span className="site-fine">
                {SITES_TRIALS_OPEN ? 'No card needed to start' : '14-day free trial when self-serve sign-up opens'}
              </span>
            </div>

            <div className="plan">
              <span className="site-kicker" style={{ color: 'var(--lime)' }}>Done with you</span>
              <h3>Launch</h3>
              <div className="plan-price">
                <b>A$450–750</b>
                <span className="site-fine">one-off, includes 3 months of Storefront</span>
              </div>
              <ul>
                <li>A 30-minute interview about your business</li>
                <li>We build it and check it</li>
                <li>One round of changes</li>
                <li>Your domain connected</li>
              </ul>
              <Link className="btn btn-secondary" href="/about#contact">Talk to us about Launch</Link>
            </div>
          </div>
          <p className="site-fine" style={{ marginTop: 20 }}>
            Prices in AUD, including GST. Free Build Lab seats for hardship and partner referrals.
          </p>
        </div>
      </section>

      <section className="site-sec">
        <div className="wrap site-split" style={{ alignItems: 'start' }}>
          <div>
            <h2 className="section-h2">Straight answers</h2>
            <p className="section-lead">
              Something else? Email <a href={`mailto:${CONTACT.email}`} style={{ textDecoration: 'underline' }}>{CONTACT.email}</a> and
              a person will reply.
            </p>
          </div>
          <Questions
            items={[
              {
                q: 'Can I use a domain I already have?',
                a: 'Yes. On Storefront you can connect a domain you already own, or buy a new one. We set up the padlock (the security certificate) for you.',
              },
              {
                q: 'The AI writes my content. Is it accurate?',
                a: 'It drafts from your answers, and it can get things wrong. You check every page before it goes live, and in a Build Lab or Launch we check it with you.',
              },
              {
                q: 'Where is my data kept?',
                a: 'Sites are hosted in Sydney. Images you upload are stored in the United States. The Growth Hub Sites privacy policy, shown when you sign up, has the details.',
              },
              SITES_TRIALS_OPEN
                ? {
                    q: 'What happens when the trial ends?',
                    a: 'Nothing is charged during the 14-day trial and no card is needed to start. To keep your site live on Storefront afterwards, choose monthly or yearly billing.',
                  }
                : {
                    q: 'Is there a free trial?',
                    a: "Yes: 14 days, with no card needed. Self-serve sign-up opens soon. Until then, talk to us and we'll let you know as soon as it's ready.",
                  },
              {
                q: 'Do I need to come to a Build Lab?',
                a: "No. You can build it yourself; the help articles walk you through it. A Build Lab is for people who'd rather do it with someone beside them.",
              },
            ]}
          />
        </div>
      </section>

      <section className="site-sec site-sec--tight">
        <div className="wrap">
          <div className="site-panel site-panel--lime">
            <h2 className="section-h2">Not sure where to start? Come to a free Session first.</h2>
            <div>
              <Link className="btn btn-primary" href="/events#whats-on">See Session dates</Link>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
