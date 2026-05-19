import type { Metadata } from 'next'
import { PageHeader } from '@/components/dashboard/PageHeader'

export const metadata: Metadata = {
  title: 'My plan — Growth Hub',
}

// v0 stub. Real content (current plan card, plan comparison, billing actions)
// lands in Phase 2.
export default function PlanPage() {
  return (
    <>
      <PageHeader
        kicker="Your membership"
        title="My plan"
        sub="Plan summary, billing, and upgrade options."
      />
      <div className="gh-empty">
        <div className="gh-empty-h">Plan content coming soon</div>
        <p className="gh-empty-p">Subscription summary and the plan-comparison grid land in Phase 2.</p>
      </div>
    </>
  )
}
