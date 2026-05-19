import type { Metadata } from 'next'
import { PageHeader } from '@/components/dashboard/PageHeader'

export const metadata: Metadata = {
  title: 'Member benefits — Growth Hub',
}

// v0 stub. Real benefits grid + refer-a-friend card lands in Phase 5.
export default function BenefitsPage() {
  return (
    <>
      <PageHeader
        kicker="The perks"
        title="Your member benefits"
        sub="Everything that comes with being part of The Growth Hub."
      />
      <div className="gh-empty">
        <div className="gh-empty-h">Benefits coming soon</div>
        <p className="gh-empty-p">Benefits grid + referral system land in Phases 5 and 8.</p>
      </div>
    </>
  )
}
