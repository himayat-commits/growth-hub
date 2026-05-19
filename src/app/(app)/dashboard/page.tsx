import type { Metadata } from 'next'
import { PageHeader } from '@/components/dashboard/PageHeader'

export const metadata: Metadata = {
  title: 'Dashboard — Growth Hub',
}

// v0 stub. Real content (welcome block, onboarding checklist, notifications,
// suggested resources) lands in Phase 2.
export default function DashboardPage() {
  return (
    <>
      <PageHeader
        kicker="Welcome"
        title="Your Growth Hub"
        sub="Your home for everything happening with your account."
      />
      <div className="gh-empty">
        <div className="gh-empty-h">Dashboard content coming soon</div>
        <p className="gh-empty-p">The full home view with checklist, notifications, and suggested resources is in Phase 2.</p>
      </div>
    </>
  )
}
