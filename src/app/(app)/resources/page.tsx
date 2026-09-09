import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { withAuth } from '@/lib/auth/with-auth';
import { PageHeader } from '@/components/dashboard/PageHeader';
import { IcoDownload } from '@/components/dashboard/Icons';
import { getResources } from '@/lib/cms';
import { getEffectivePlan, getSubscription } from '@/lib/subscription';
import ResourcesGrid, { EMPTY_LIBRARY_BODY, EMPTY_LIBRARY_TITLE } from './ResourcesGrid';

export const metadata: Metadata = {
  title: 'Resources — Growth Hub',
};

export default async function ResourcesPage() {
  const { user } = await withAuth();
  if (!user) redirect('/sign-in?redirect_url=/resources');

  // Resolve the plan tier once per page; the client grid only needs the
  // boolean. A lookup failure degrades to Free (locked), never to open.
  const [resources, sub] = await Promise.all([
    getResources(),
    getSubscription(user.id).catch(() => null),
  ]);
  const canOpenMemberResources = getEffectivePlan(sub) !== 'free';

  // Project into the lightweight shape the client grid needs. depth: 1 means
  // `thumbnail` is either null, an id, or a populated Media object.
  const items = resources.map((r) => {
    const thumb = r.thumbnail as { url?: string } | string | null | undefined;
    return {
      id: r.id,
      title: r.title,
      tag: r.tag,
      tone: r.tone ?? null,
      meta: r.meta ?? null,
      url: r.url ?? null,
      free: r.free ?? true,
      thumbnailUrl: typeof thumb === 'object' && thumb?.url ? thumb.url : null,
    };
  });

  return (
    <>
      <PageHeader
        kicker="Library"
        title="Resources, courses & downloads"
        sub={
          items.length === 0
            ? `${EMPTY_LIBRARY_TITLE} — ${EMPTY_LIBRARY_BODY.charAt(0).toLowerCase()}${EMPTY_LIBRARY_BODY.slice(1)}`
            : "Practical, plain-language pieces. Use what's useful, skip what isn't. Bookmark anything for later."
        }
        actions={
          <button className="gh-btn ghost" type="button">
            <IcoDownload />
            My downloads
          </button>
        }
      />

      <ResourcesGrid items={items} canOpenMemberResources={canOpenMemberResources} />
    </>
  );
}
