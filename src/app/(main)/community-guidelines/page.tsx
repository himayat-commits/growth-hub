import type { Metadata } from 'next';
import Link from 'next/link';

// Community guidelines + member-to-member services disclaimer for the public
// site. Linked from the footer, the Community section on the home page, and
// the partner profile / micro-site pages.
//
// NOTE: Plain-English baseline written for launch (GTM review F6.11). Have the
// disclaimer wording checked by someone qualified before relying on it — it is
// not legal advice. Update LAST_UPDATED whenever the content changes.

const LAST_UPDATED = '9 September 2026';

export const metadata: Metadata = {
  title: 'Community guidelines — Growth Hub by Himayat',
  description:
    'How the Growth Hub community works: what we expect of members, how referrals work, and what we do and don’t vouch for.',
  alternates: { canonical: '/community-guidelines' },
  robots: { index: true, follow: true },
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
            Plain English: what the community is for, what we ask of you, how referrals work, and
            what Growth Hub does and doesn&rsquo;t vouch for.
          </p>
        </div>
      </section>

      <section style={{ paddingBottom: 64 }}>
        <div className="wrap" style={{ maxWidth: 780 }}>
          <P>
            <strong>Last updated:</strong> {LAST_UPDATED}
          </P>

          <H2>What the community is for</H2>
          <P>
            Growth Hub is a network of Canberra freelancers, tradies, consultants and small service
            providers who back each other. People join to learn, to get unstuck, and to be referred
            to the kind of customers they want. It works because members give first and sell second.
            The Slack, Facebook and WhatsApp groups, the weekly webinar and our in-person events are
            all part of the same community, and the same rules apply in every one of them.
          </P>

          <H2>The rules</H2>
          <ul style={{ margin: '0 0 14px', paddingLeft: 22 }}>
            <Rule title="Add value">
              answer questions, share what actually worked for you, welcome new members. If you
              only ever post when you have something to sell, you&rsquo;ll be asked to stop.
            </Rule>
            <Rule title="No pitching, no cold DMs">
              don&rsquo;t drop offers into the groups or message members to sell to them. If
              someone asks for a recommendation, answer the question; if they want to talk business,
              they&rsquo;ll ask.
            </Rule>
            <Rule title="Say so when it&rsquo;s you">
              recommending your own service, or a mate&rsquo;s, is fine as long as you say so.
              Undisclosed self-promotion isn&rsquo;t.
            </Rule>
            <Rule title="Keep it respectful">
              disagree with the idea, not the person. No harassment, discrimination or public
              call-outs of other members or their businesses.
            </Rule>
            <Rule title="Keep it confidential">
              what members share about their numbers, clients and struggles stays in the room. Ask
              before you screenshot, quote or repost.
            </Rule>
          </ul>

          <H2>Webinars are where trust is built</H2>
          <P>
            The weekly live webinar is open to every member, including the Free tier, and so are the
            recordings. Turn up, ask your questions, share a win. The people who get referred most
            are the ones the rest of the room has actually heard from.
          </P>

          <H2>How referrals work</H2>
          <P>
            Every member has a referral link. When someone you invite joins Growth Hub and completes
            their first Growth Call, you both receive an A$50 credit on your Growth Hub account. The
            credit is applied automatically, once per referral, and can&rsquo;t be exchanged for
            cash. We may pause credits where we see referrals being gamed.
          </P>

          <H2>What Growth Hub doesn&rsquo;t vouch for</H2>
          <P>
            <strong>
              Growth Hub introduces members and partners to each other but doesn&rsquo;t vet,
              supervise or endorse the services they provide to one another.
            </strong>{' '}
            A member being in the community, or a partner being listed on our site, is not a
            recommendation from us. Before you hire or work with anyone you meet here, check their
            credentials, licences, insurance and references yourself, agree the scope and price up
            front, and put it in writing. Any agreement is between you and them, not with Growth Hub
            or Himayat.
          </P>

          <H2>Reporting a problem</H2>
          <P>
            If something in the community doesn&rsquo;t feel right — a pushy pitch, a dispute over
            work, a post that crosses a line — email{' '}
            <a href="mailto:hello@himayat.com.au" style={LINK}>
              hello@himayat.com.au
            </a>{' '}
            and a person on the Himayat team will read it. We&rsquo;ll keep your report confidential
            wherever we can.
          </P>

          <H2>If the rules are broken</H2>
          <P>
            We&rsquo;ll usually start with a quiet word. Where a member keeps breaching these
            guidelines, or does something serious, we may remove them from the groups, the events
            and the platform.
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
