import type { Metadata } from 'next'
import { PageHeader } from '@/components/dashboard/PageHeader'

export const metadata: Metadata = {
  title: 'Profile & settings — Growth Hub',
}

// v0 stub. Real profile editor (personal info, business info, notifications,
// security) lands in Phase 2.
export default function ProfilePage() {
  return (
    <>
      <PageHeader
        kicker="Account"
        title="Profile & settings"
        sub="Tell us a little more about you and how you want to hear from us."
      />
      <div className="gh-empty">
        <div className="gh-empty-h">Profile editor coming soon</div>
        <p className="gh-empty-p">Full profile + settings form lands in Phase 2.</p>
      </div>
    </>
  )
}
