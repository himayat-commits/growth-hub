import type { Metadata } from 'next';
import { ogBase, twitterBase } from '../shared-metadata';
import Link from 'next/link';
import { CONTACT } from '@/lib/site';

// Community guidelines + "what we don't vouch for" disclaimer for the public
// site. Linked from the footer.
//
// DRAFT (27 Oct 2026) for counsel review: rewritten for Growth Hub Sessions,
// Growth Labs and Growth Hub Sites after the member portal (groups, webinars,
// referral credits) was removed. It is not legal advice. Update LAST_UPDATED to
// the date it takes effect.

const LAST_UPDATED = '27 October 2026';

const TITLE = 'Community guidelines — Growth Hub by Himayat';
const DESCRIPTION =
  'What we ask of everyone at Growth Hub Sessions and Growth Labs, how we keep them pitch-free, and what Growth Hub does and doesn’t vouch for.';

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: '/community-guidelines' },
  robots: { index: true, follow: true },
  openGraph: { ...ogBase, title: TITLE, description: DESCRIPTION, url: '/community-guidelines' },
  twitter: { ...twitterBase, title: TITLE, description: DESCRIPTION },
};

// Same presentational helpers as /privacy so the two policy pages read alike.
function H2({ children }: { children: React.ReactNode }) {
  return (
    <h2 style={{ fontSize: 22, marginTop: 40, marginBottom: 12, color: 'var(--plum, #5f304b)' }}>
      {children}
    </h2>
  );
}
function P({ children }: { children: React.ReactNode }) {
  return <p style={{ margin: '0 0 14px', lineHeight: 1.7 }}>{children}</p>;
}
function Rule({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <li style={{ margin: '0 0 12px', lineHeight: 1.7 }}>
      <strong>{title}</strong> — {children}
    </li>
  );
}

const LINK = { color: 'var(--plum, #5f304b)' } as const;

export default function CommunityGuidelinesPage() {
  return (
    <main>
      <section className="hero">
        <div className="wrap">
          <div className="hero-eyebrow">
            <span className="dot" />
            Community
          </div>
          <h1 className="hero-h1">How we look after each other.</h1>
          <p className="hero-sub">
            Plain English: what we ask of everyone in the room, how we keep Sessions pitch-free,
            and what Growth Hub does and doesn&rsquo;t vouch for.
          </p>
        </div>
      </section>

      <section style={{ paddingBottom: 64 }}>
        <div className="wrap" style={{ maxWidth: 780 }}>
          <P>
            <strong>Last updated:</strong> {LAST_UPDATED}
          </P>

          <H2>What Growth Hub is</H2>
          <P>
            Growth Hub brings Canberra small business owners and sole traders together: free
            monthly Growth Hub Sessions on one practical topic, hands-on Growth Labs where owners
            build and publish their website, and Growth Hub Sites, the website builder people
            keep using afterwards. The same guidelines apply at every Session and Growth Lab, and
            to presenters, co-hosts, helpers and attendees alike.
          </P>

          <H2>In the room</H2>
          <ul style={{ margin: '0 0 14px', paddingLeft: 22 }}>
            <Rule title="Add value">
              share what actually worked for you, help the person next to you, and ask the
              question everyone else is thinking.
            </Rule>
            <Rule title="No pitching">
              Sessions are for learning, not selling. Presenters teach one practical move with no
              product pitch, and attendees don&rsquo;t sell to each other at the table. If someone
              wants to talk business, they&rsquo;ll ask you afterwards.
            </Rule>
            <Rule title="Say so when it&rsquo;s you">
              recommending your own service, or a friend&rsquo;s, is fine as long as you say so.
            </Rule>
            <Rule title="Keep it respectful">
              disagree with the idea, not the person. No harassment, discrimination or public
              call-outs of other people or their businesses.
            </Rule>
            <Rule title="Keep it confidential">
              what owners share at the table about their numbers, customers and struggles stays at
              the table. Ask before you take a photo of anyone, or share what they said.
            </Rule>
          </ul>

          <H2>Our own interests, plainly</H2>
          <P>
            Sessions are free. Growth Hub charges for Growth Lab seats, Growth Hub Sites
            subscriptions and done-with-you website builds, and we&rsquo;ll always tell you
            plainly when something costs money. We won&rsquo;t pitch them during the teaching
            part of a Session.
          </P>
          <P>
            CBR Innovation Network&rsquo;s Digital Solutions program is separate from Growth Hub.
            At each Session we explain how to get free one-on-one advice through it. If you&rsquo;d
            like a referral, we pass your details to CBRIN only with your consent, and CBRIN
            chooses your advisor.
          </P>

          <H2>At a Growth Lab</H2>
          <ul style={{ margin: '0 0 14px', paddingLeft: 22 }}>
            <Rule title="Your site is yours">
              you own your business information and the content you put on your site.
            </Rule>
            <Rule title="Check every claim">
              the AI builder drafts from your answers and can get things wrong. Before you publish,
              make sure your details, prices and claims are true. We check them with you, but
              you&rsquo;re responsible for what your site says.
            </Rule>
            <Rule title="Use photos you have the right to use">
              your own photos, or ones you have permission for.
            </Rule>
          </ul>

          <H2>What Growth Hub doesn&rsquo;t vouch for</H2>
          <P>
            <strong>
              Growth Hub introduces people to presenters, co-hosts and partner organisations, but
              doesn&rsquo;t vet, supervise or endorse the services they provide.
            </strong>{' '}
            An organisation presenting at a Session or being listed on our site is not a
            recommendation from us. Before you hire or work with anyone you meet through Growth
            Hub, check their credentials, licences, insurance and references yourself, agree the
            scope and price up front, and put it in writing. Any agreement is between you and
            them, not with Growth Hub or Himayat.
          </P>

          <H2>Reporting a problem</H2>
          <P>
            If something doesn&rsquo;t feel right (a pushy pitch, a dispute, behaviour that crosses
            a line), tell a host on the day or email{' '}
            <a href={`mailto:${CONTACT.email}`} style={LINK}>
              {CONTACT.email}
            </a>
            , and a person on the Growth Hub team will read it. We&rsquo;ll keep your report
            confidential wherever we can.
          </P>

          <H2>If the guidelines are broken</H2>
          <P>
            We&rsquo;ll usually start with a quiet word. If someone keeps breaching these
            guidelines, or does something serious, we may ask them to leave a Session or Growth Lab
            and not to come back.
          </P>

          <H2>Changes to these guidelines</H2>
          <P>
            We may update these guidelines from time to time. The &ldquo;last updated&rdquo; date
            above shows when they last changed. Our{' '}
            <Link href="/privacy" style={LINK}>
              privacy policy
            </Link>{' '}
            explains how we handle your personal information.
          </P>

          <p style={{ margin: '32px 0 0', lineHeight: 1.7 }}>
            <Link href="/" style={LINK}>
              ← Back to home
            </Link>
          </p>
        </div>
      </section>
    </main>
  );
}
