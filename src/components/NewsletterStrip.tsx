// Server-side section wrapper around <NewsletterForm>. Renders a
// full-width strip with the standard .wrap container and brand copy
// so individual marketing pages just import once.

import NewsletterForm from './NewsletterForm';

export interface NewsletterStripProps {
  /** Used by /api/newsletter to attribute the signup (e.g. "home", "events"). */
  source: string;
  /** Override the default heading + sub if the page has a stronger angle. */
  heading?: string;
  sub?: string;
}

export default function NewsletterStrip({
  source,
  heading = 'Get the Growth Hub digest.',
  sub = "One monthly email. Three things worth knowing — workshops, member wins, the occasional resource. No drip sequence.",
}: NewsletterStripProps) {
  return (
    <section className="gh-newsletter-strip" aria-label="Newsletter signup">
      <div className="wrap">
        <NewsletterForm source={source} heading={heading} sub={sub} />
      </div>
    </section>
  );
}
