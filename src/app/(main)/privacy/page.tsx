import type { Metadata } from 'next';
import Link from 'next/link';

// Privacy policy for the public marketing site. The cookie-consent banner
// (components/analytics/ConsentBanner) links here.
//
// NOTE: This is a plain-English baseline drafted to cover what the site
// actually does (the processors below are the ones wired into this codebase).
// Have it reviewed by someone qualified before relying on it — it is not legal
// advice. Update LAST_UPDATED whenever the content changes.

const LAST_UPDATED = '23 June 2026';

export const metadata: Metadata = {
  title: 'Privacy policy — Growth Hub by Himayat',
  description:
    'How Growth Hub by Himayat collects, uses, and protects your personal information, and the choices you have.',
  alternates: { canonical: '/privacy' },
  robots: { index: true, follow: true },
};

// Small presentational helpers so the prose stays readable without depending
// on classes that may not exist on every (main) stylesheet.
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

export default function PrivacyPage() {
  return (
    <main>
      <section className="hero">
        <div className="wrap">
          <div className="hero-eyebrow">
            <span className="dot" />
            Privacy
          </div>
          <h1 className="hero-h1">Your privacy.</h1>
          <p className="hero-sub">
            Plain English: what we collect, why, who we share it with, and the choices you have.
          </p>
        </div>
      </section>

      <section style={{ paddingBottom: 64 }}>
        <div className="wrap" style={{ maxWidth: 780 }}>
          <P>
            <strong>Last updated:</strong> {LAST_UPDATED}
          </P>
          <P>
            Growth Hub is operated by Himayat (&ldquo;Growth Hub&rdquo;, &ldquo;we&rdquo;,
            &ldquo;us&rdquo;), a Canberra-based social enterprise (ABN 40 169 711 734; NDIS
            provider 4050130469). This policy explains how we handle personal information in line
            with the Australian Privacy Principles under the Privacy Act 1988 (Cth).
          </P>

          <H2>Information we collect</H2>
          <P>
            <strong>Information you give us</strong> — your name, email, phone, business details,
            and anything you write when you contact us, subscribe to our newsletter, apply to take
            part in an event, sign up, or message our team.
          </P>
          <P>
            <strong>Account &amp; subscription information</strong> — when you create an account we
            use WorkOS to authenticate you, and Stripe to process payments. We never see or store
            your full card number; Stripe handles card data directly.
          </P>
          <P>
            <strong>Information collected automatically</strong> — basic usage and device data
            (pages viewed, approximate location from IP, browser type) via analytics tools. On the
            public site, analytics and advertising cookies only load after you accept them in our
            cookie banner (see &ldquo;Cookies and analytics&rdquo; below).
          </P>

          <H2>How we use your information</H2>
          <P>
            To provide and run the platform and your subscription; to respond to enquiries and
            provide support; to send you service and (with your consent) marketing communications;
            to run our events and community; to understand and improve how the site and product are
            used; to keep the service secure; and to meet our legal and reporting obligations as a
            social enterprise.
          </P>

          <H2>Cookies and analytics</H2>
          <P>
            We use essential cookies needed for the site and your account to work. We also use
            optional analytics and advertising cookies (Google Analytics, the Meta Pixel, and the
            LinkedIn Insight Tag) to measure and improve our marketing. On the public site these
            optional cookies do not load until you select &ldquo;Accept&rdquo; in the cookie
            banner, and you can change your mind at any time by clearing the{' '}
            <code>gh_consent</code> cookie in your browser. We also use PostHog for privacy-conscious
            product analytics and Sentry for error monitoring.
          </P>

          <H2>Who we share it with</H2>
          <P>
            We do not sell your personal information. We share it only with service providers who
            help us run Growth Hub, and only as needed to provide the service — including WorkOS
            (authentication), Stripe (payments), Neon and Vercel (hosting and infrastructure),
            Resend (email delivery), HubSpot (newsletter and forms), Birdeye (the marketing platform
            we provision for subscribers), and our analytics/monitoring providers above. We may also
            disclose information where required by law.
          </P>

          <H2>Overseas storage</H2>
          <P>
            Some of these providers store or process data outside Australia (for example in the
            United States or the European Union). Where that happens, we take reasonable steps to
            ensure your information is handled consistently with the Australian Privacy Principles.
          </P>

          <H2>How we protect it</H2>
          <P>
            We use reputable providers, encryption in transit, access controls, and least-privilege
            practices. No system is perfectly secure, but we take reasonable steps to protect your
            information from misuse, loss, and unauthorised access.
          </P>

          <H2>How long we keep it</H2>
          <P>
            We keep personal information only as long as we need it for the purposes above or as
            required by law, then delete or de-identify it.
          </P>

          <H2>Your choices and rights</H2>
          <P>
            You can ask to access or correct the personal information we hold about you, unsubscribe
            from marketing at any time, and decline optional cookies. To make a request or raise a
            privacy concern, email{' '}
            <a href="mailto:hello@himayat.com.au" style={{ color: 'var(--plum, #5f304b)' }}>
              hello@himayat.com.au
            </a>
            . If you&rsquo;re not satisfied with our response, you can contact the Office of the
            Australian Information Commissioner (OAIC).
          </P>

          <H2>Children</H2>
          <P>
            Growth Hub is intended for business owners and is not directed at children under 18.
          </P>

          <H2>Changes to this policy</H2>
          <P>
            We may update this policy from time to time. The &ldquo;last updated&rdquo; date above
            shows when it last changed.
          </P>

          <H2>Contact us</H2>
          <P>
            Himayat — Growth Hub
            <br />
            Level 4, 1 Moore St, Canberra ACT 2601
            <br />
            <a href="mailto:hello@himayat.com.au" style={{ color: 'var(--plum, #5f304b)' }}>
              hello@himayat.com.au
            </a>{' '}
            · 02 5119 0005
          </P>

          <p style={{ margin: '32px 0 0', lineHeight: 1.7 }}>
            <Link href="/" style={{ color: 'var(--plum, #5f304b)' }}>
              ← Back to home
            </Link>
          </p>
        </div>
      </section>
    </main>
  );
}
