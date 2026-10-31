import type { Metadata } from 'next';
import { ogBase, twitterBase } from '../shared-metadata';
import Link from 'next/link';
import { CONTACT, SITES } from '@/lib/site';

// Privacy policy for the public site. The cookie-consent banner
// (components/analytics/ConsentBanner) and the contact form link here.
//
// DRAFT (27 Oct 2026) for counsel / Amplify 11 review: rewritten for the site as it
// is after the member portal, shop and Stripe billing were removed. Every processor
// named below is one the code or the business actually uses. It is not legal advice.
// Update LAST_UPDATED to the date it takes effect.

const LAST_UPDATED = '27 October 2026';
const PRIVACY_EMAIL = 'privacy@thegrowthhub.com.au';
const SITES_PRIVACY_URL = `${SITES.signIn}/site/legal?what=privacy`;

const TITLE = 'Privacy policy — Growth Hub by Himayat';
const DESCRIPTION =
  'How Growth Hub handles your personal information when you use this website, register for a Session or Growth Lab, or contact us.';

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: '/privacy' },
  robots: { index: true, follow: true },
  openGraph: { ...ogBase, title: TITLE, description: DESCRIPTION, url: '/privacy' },
  twitter: { ...twitterBase, title: TITLE, description: DESCRIPTION },
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

const LINK = { color: 'var(--plum, #5f304b)' } as const;

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
            Growth Hub is operated by The Trustee for Himayat Trust (ABN 40 169 711 734), a
            Canberra-based social enterprise (&ldquo;Growth Hub&rdquo;, &ldquo;we&rdquo;,
            &ldquo;us&rdquo;). This policy explains how we handle personal information on this
            website and at our events, in line with the Australian Privacy Principles under the
            Privacy Act 1988 (Cth).
          </P>
          <P>
            <strong>Growth Hub Sites</strong>, our website builder at{' '}
            <a href={SITES.signIn} style={LINK}>
              app.thegrowthhub.com.au
            </a>
            , has its own{' '}
            <a href={SITES_PRIVACY_URL} style={LINK}>
              privacy policy
            </a>
            , which covers your account, your sites and billing on that platform.
          </P>

          <H2>Information we collect</H2>
          <P>
            <strong>When you contact us</strong>: your name, email, business name (optional), the
            topics you tick and your message.
          </P>
          <P>
            <strong>When you subscribe to our newsletter</strong>: your email address.
          </P>
          <P>
            <strong>When you register for a Session or Growth Lab</strong>: tickets are booked
            through Eventbrite, which collects your details under its own privacy policy and shares
            your registration with us. That includes your name, email and, for a Growth Lab, the
            answers you give about your business so we can prepare your brief.
          </P>
          <P>
            <strong>At a Session</strong>: if you ask to be referred to CBR Innovation
            Network&rsquo;s Digital Solutions program, we pass your name and contact details to
            CBRIN only with your consent. CBRIN then contacts you and chooses your advisor. We
            don&rsquo;t record or live-stream Sessions.
          </P>
          <P>
            <strong>Information collected automatically</strong>: if you accept analytics cookies,
            basic usage data such as pages viewed, approximate location from your IP address and
            browser type (see &ldquo;Cookies and analytics&rdquo;).
          </P>

          <H2>How we use your information</H2>
          <P>
            To reply to your enquiries; to run Sessions and Growth Labs and follow up afterwards
            with the slides and next steps; to send our newsletter if you subscribe; to make
            consented referrals to CBRIN; to understand and improve how the site is used; to keep
            the site secure; and to meet our legal and reporting obligations as a social enterprise.
          </P>

          <H2>Cookies and analytics</H2>
          <P>
            The site uses essential cookies so it works and remembers your cookie choice. Optional
            analytics (PostHog) and any advertising tags only load after you select
            &ldquo;Accept&rdquo; in the cookie banner. You can change your mind at any time by
            clearing the <code>gh_consent</code> cookie in your browser. We use Sentry to catch
            errors on the site; it doesn&rsquo;t record your session, and we strip your IP address
            and email from error reports.
          </P>

          <H2>Who we share it with</H2>
          <P>
            We do not sell your personal information. We share it only with service providers who
            help us run Growth Hub, and only as needed: HubSpot (our contact and newsletter
            records, and email), Eventbrite (event registration), Google Workspace (our email
            inboxes), Vercel and Neon (website hosting and database), PostHog (analytics, with
            your consent) and Sentry (error monitoring). With your consent, we also share referral
            details with CBR Innovation Network, as described above. We may disclose information
            where the law requires it.
          </P>

          <H2>Overseas storage</H2>
          <P>
            Some of these providers store or process data outside Australia, for example in the
            United States or the European Union. Where that happens, we take reasonable steps to
            ensure your information is handled consistently with the Australian Privacy Principles.
          </P>

          <H2>How we protect it</H2>
          <P>
            We use reputable providers, encryption in transit, access controls and least-privilege
            practices. No system is perfectly secure, but we take reasonable steps to protect your
            information from misuse, loss and unauthorised access.
          </P>

          <H2>How long we keep it</H2>
          <P>
            We keep personal information only as long as we need it for the purposes above or as
            the law requires, then delete or de-identify it.
          </P>
          <P>
            <strong>Our former member portal</strong> closed in October 2026. If you had an account
            on it, we still hold the details you gave us then. You can ask us to give you a copy or
            to delete them at any time.
          </P>

          <H2>Your choices and rights</H2>
          <P>
            You can ask to access or correct the personal information we hold about you,
            unsubscribe from our newsletter at any time, and decline optional cookies. To make a
            request or raise a privacy concern, email{' '}
            <a href={`mailto:${PRIVACY_EMAIL}`} style={LINK}>
              {PRIVACY_EMAIL}
            </a>
            . If you&rsquo;re not satisfied with our response, you can contact the Office of the
            Australian Information Commissioner (OAIC).
          </P>

          <H2>Children</H2>
          <P>
            Growth Hub is for business owners and isn&rsquo;t directed at children under 18.
          </P>

          <H2>Changes to this policy</H2>
          <P>
            We may update this policy from time to time. The &ldquo;last updated&rdquo; date above
            shows when it last changed.
          </P>

          <H2>Contact us</H2>
          <P>
            Growth Hub, operated by The Trustee for Himayat Trust
            <br />
            {CONTACT.address}
            <br />
            <a href={`mailto:${PRIVACY_EMAIL}`} style={LINK}>
              {PRIVACY_EMAIL}
            </a>{' '}
            · {CONTACT.phone}
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
