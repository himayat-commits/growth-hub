import NotFoundPanel from '@/components/sections/site/NotFoundPanel';

// Rendered when a marketing page calls notFound() (an unknown /events/<slug>,
// a removed shop product), inside the (main) layout so the navbar and footer
// stay. URLs that match no route at all get app/global-not-found.tsx instead.
export default function NotFound() {
  return (
    <main>
      <NotFoundPanel />
    </main>
  );
}
