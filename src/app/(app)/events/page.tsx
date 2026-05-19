import type { Metadata } from 'next'
import { PageHeader } from '@/components/dashboard/PageHeader'

export const metadata: Metadata = {
  title: 'Events & Webinars — Growth Hub',
}

// v0 stub. Real events feed (featured hero, upcoming list, past recordings)
// from a Payload Events collection lands in Phase 3.
export default function EventsPage() {
  return (
    <>
      <PageHeader
        kicker="What's on"
        title="Events & Webinars"
        sub="Free for all members. Online sessions get recorded — in-person ones come with chai."
      />
      <div className="gh-empty">
        <div className="gh-empty-h">Events coming soon</div>
        <p className="gh-empty-p">Editorial events feed (Payload-driven) lands in Phase 3.</p>
      </div>
    </>
  )
}
