import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getOpsUser } from '@/lib/auth/ops';

export const metadata: Metadata = {
  title: 'Ops console — Growth Hub',
  // Prevent search engines from indexing the staff surface.
  robots: { index: false, follow: false },
};

// Guard runs once per request, server-side. Non-staff users get
// redirected to /dashboard. The redirect intentionally doesn't include
// a return-to URL — we don't want non-staff to discover ops paths.
export default async function OpsLayout({ children }: { children: React.ReactNode }) {
  const opsUser = await getOpsUser();
  if (!opsUser) redirect('/dashboard');

  return (
    <div className="gh-ops">
      <header className="gh-ops-head">
        <div className="gh-ops-head-l">
          <Link href="/ops" className="gh-ops-brand">
            <strong>Ops</strong>
            <span>Growth Hub internal</span>
          </Link>
          <nav className="gh-ops-nav" aria-label="Ops sections">
            <Link href="/ops">Overview</Link>
            <Link href="/ops/bookings">Bookings</Link>
            <Link href="/ops/referrals">Referrals</Link>
            <Link href="/ops/cancellations">Cancellations</Link>
            <Link href="/ops/signups">Signups</Link>
            <Link href="/ops/inbox">Inbox</Link>
          </nav>
        </div>
        <div className="gh-ops-head-r">
          <span className="gh-ops-user">
            Signed in as <strong>{opsUser.email}</strong>
          </span>
          <Link href="/dashboard" className="gh-btn ghost">
            ← Back to dashboard
          </Link>
        </div>
      </header>
      <main className="gh-ops-main">{children}</main>
    </div>
  );
}
