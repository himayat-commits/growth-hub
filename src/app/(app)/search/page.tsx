import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { withAuth } from '@/lib/auth/with-auth';
import { PageHeader } from '@/components/dashboard/PageHeader';
import { getUpcomingEvents, getResources, getServices } from '@/lib/cms';

export const metadata: Metadata = {
  title: 'Search — Growth Hub',
};

interface SearchPageProps {
  searchParams: Promise<{ q?: string }>;
}

function matches(haystack: string | null | undefined, q: string): boolean {
  if (!haystack) return false;
  return haystack.toLowerCase().includes(q);
}

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const { user } = await withAuth();
  if (!user) redirect('/sign-in?redirect_url=/search');

  const { q: rawQ } = await searchParams;
  const q = (rawQ ?? '').trim().toLowerCase();

  const [events, resources, services] = await Promise.all([
    q ? getUpcomingEvents(200) : Promise.resolve([]),
    q ? getResources(200) : Promise.resolve([]),
    q ? getServices() : Promise.resolve([]),
  ]);

  const eventHits = q
    ? events.filter((e) => matches(e.title as string, q) || matches((e as { description?: string }).description, q))
    : [];
  const resourceHits = q
    ? resources.filter((r) => matches(r.title as string, q) || matches(r.tag as string, q))
    : [];
  const serviceHits = q
    ? services.filter((s) => matches(s.title as string, q) || matches((s as { description?: string }).description, q))
    : [];

  const totalHits = eventHits.length + resourceHits.length + serviceHits.length;

  return (
    <>
      <PageHeader
        kicker="Search"
        title={q ? `Results for "${rawQ}"` : 'Search the Growth Hub'}
        sub={
          q
            ? `${totalHits} match${totalHits === 1 ? '' : 'es'} across events, resources and services.`
            : 'Try the search bar above to find events, resources, or services.'
        }
      />

      {q && totalHits === 0 && (
        <div className="gh-empty">
          <div className="gh-empty-h">No matches</div>
          <p className="gh-empty-p">
            Try a shorter query or browse{' '}
            <Link href="/resources">resources</Link>,{' '}
            <Link href="/my-events">events</Link>, or{' '}
            <Link href="/services">services</Link>.
          </p>
        </div>
      )}

      {eventHits.length > 0 && (
        <section className="gh-card" style={{ marginBottom: 16 }}>
          <div className="gh-card-hd">
            <div className="gh-card-h">Events ({eventHits.length})</div>
            <Link href="/my-events" className="gh-card-link">View all →</Link>
          </div>
          <ul className="gh-list">
            {eventHits.slice(0, 8).map((e) => {
              const slug = (e as { slug?: string }).slug;
              const href = slug ? `/events/${slug}` : '/my-events';
              return (
                <li key={String(e.id)}>
                  <div className="gh-list-body">
                    <div className="gh-list-h">{e.title as string}</div>
                    {(e as { date?: string }).date && (
                      <p className="gh-list-p">
                        {new Intl.DateTimeFormat('en-AU', { dateStyle: 'medium' }).format(
                          new Date((e as { date: string }).date),
                        )}
                      </p>
                    )}
                  </div>
                  <Link href={href} className="gh-card-link">Open →</Link>
                </li>
              );
            })}
          </ul>
        </section>
      )}

      {resourceHits.length > 0 && (
        <section className="gh-card" style={{ marginBottom: 16 }}>
          <div className="gh-card-hd">
            <div className="gh-card-h">Resources ({resourceHits.length})</div>
            <Link href="/resources" className="gh-card-link">View all →</Link>
          </div>
          <ul className="gh-list">
            {resourceHits.slice(0, 8).map((r) => {
              const url = (r as { url?: string }).url;
              const isExternal = !!url && /^https?:/.test(url);
              const href = url ?? '/resources';
              return (
                <li key={String(r.id)}>
                  <div className="gh-list-body">
                    <div className="gh-list-h">{r.title as string}</div>
                    <p className="gh-list-p">
                      {(r.tag as string) ?? 'Resource'}
                      {(r as { free?: boolean }).free === false ? ' · Member' : ' · Free'}
                    </p>
                  </div>
                  {isExternal ? (
                    <a href={href} target="_blank" rel="noopener noreferrer" className="gh-card-link">
                      Open →
                    </a>
                  ) : (
                    <Link href={href} className="gh-card-link">Open →</Link>
                  )}
                </li>
              );
            })}
          </ul>
        </section>
      )}

      {serviceHits.length > 0 && (
        <section className="gh-card" style={{ marginBottom: 16 }}>
          <div className="gh-card-hd">
            <div className="gh-card-h">Services ({serviceHits.length})</div>
            <Link href="/services" className="gh-card-link">View all →</Link>
          </div>
          <ul className="gh-list">
            {serviceHits.slice(0, 8).map((s) => (
              <li key={String(s.id)}>
                <div className="gh-list-body">
                  <div className="gh-list-h">{s.title as string}</div>
                  <p className="gh-list-p">{(s as { description?: string }).description ?? ''}</p>
                </div>
                <Link href={`/services/${s.slug as string}`} className="gh-card-link">Open →</Link>
              </li>
            ))}
          </ul>
        </section>
      )}
    </>
  );
}
