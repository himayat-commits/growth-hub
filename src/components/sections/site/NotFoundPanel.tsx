import Link from 'next/link';
import { CONTACT } from '@/lib/site';

/** Body of the 404 page. Shared by app/global-not-found.tsx (URLs that match
 *  no route) and app/(main)/not-found.tsx (notFound() inside a marketing page,
 *  e.g. an unknown /events/<slug>), so both point people to the same places. */
export default function NotFoundPanel() {
  return (
    <section className="site-sec nf">
      <div className="wrap">
        <span className="section-label">Page not found</span>
        <h1 className="hero-h1">That page isn&apos;t here.</h1>
        <p className="site-lede">
          It may have moved when we refreshed the site. Most people are looking for one
          of these.
        </p>
        <div className="site-grid nf-grid">
          <div className="site-card">
            <h2>Growth Hub Sessions</h2>
            <p>
              Free monthly Sessions: ninety minutes, one topic, one change to make this
              week. Plus hands-on Build Labs.
            </p>
            <Link className="site-link" href="/events">See Session dates</Link>
          </div>
          <div className="site-card">
            <h2>Growth Hub Sites</h2>
            <p>A website you can run yourself. Live in a morning.</p>
            <Link className="site-link" href="/sites">About Growth Hub Sites</Link>
          </div>
        </div>
        <p className="site-fine">
          Or go to the <Link href="/">home page</Link>, or email{' '}
          <a href={`mailto:${CONTACT.email}`}>{CONTACT.email}</a>.
        </p>
      </div>
    </section>
  );
}
