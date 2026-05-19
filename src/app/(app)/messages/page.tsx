import type { Metadata } from 'next'
import { PageHeader } from '@/components/dashboard/PageHeader'

export const metadata: Metadata = {
  title: 'Messages — Growth Hub',
}

// v0 stub. Real inbox + message thread lands in Phase 5.
export default function MessagesPage() {
  return (
    <>
      <PageHeader
        kicker="Inbox"
        title="Messages"
        sub="Talk to the Growth Hub team. We reply within 1 business day."
      />
      <div className="gh-empty">
        <div className="gh-empty-h">Messages coming soon</div>
        <p className="gh-empty-p">Real messaging (Growth Hub Team thread) lands in Phase 5.</p>
      </div>
    </>
  )
}
