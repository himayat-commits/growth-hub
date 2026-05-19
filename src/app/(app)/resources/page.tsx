import type { Metadata } from 'next'
import { PageHeader } from '@/components/dashboard/PageHeader'

export const metadata: Metadata = {
  title: 'Resources — Growth Hub',
}

// v0 stub. Resource library (Payload Resources collection) lands in Phase 3.
export default function ResourcesPage() {
  return (
    <>
      <PageHeader
        kicker="Library"
        title="Resources, courses & downloads"
        sub="Practical, plain-language pieces. Use what's useful, skip what isn't."
      />
      <div className="gh-empty">
        <div className="gh-empty-h">Resources coming soon</div>
        <p className="gh-empty-p">Payload-driven resource library lands in Phase 3.</p>
      </div>
    </>
  )
}
