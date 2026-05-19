import type { Metadata } from 'next'
import { PageHeader } from '@/components/dashboard/PageHeader'

export const metadata: Metadata = {
  title: 'Services — Growth Hub',
}

// v0 stub. Combined "Birdeye modules" + "Services" tabs page lands in Phase 4.
export default function ServicesPage() {
  return (
    <>
      <PageHeader
        kicker="What we offer"
        title="Services"
        sub="Birdeye modules and consultancy services in one place."
      />
      <div className="gh-empty">
        <div className="gh-empty-h">Services content coming soon</div>
        <p className="gh-empty-p">Combined modules + services tabs land in Phase 4.</p>
      </div>
    </>
  )
}
