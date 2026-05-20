// The new post-signup shell. Replaces the marketing-style Navbar with a
// dashboard sidebar + topbar. Wraps every authenticated page that isn't a
// full-screen takeover (the Birdeye wizard will move under here in Phase 6).
//
// Auth gating: a single withAuth() at the top redirects unauthenticated
// visitors to /sign-in. Pages inside this layout can assume a signed-in user.
// We DON'T use ensureSignedIn: true here because that helper writes a PKCE
// cookie, which Server Components can't do — same pattern as /portal today.

import { redirect } from 'next/navigation'
import { withAuth } from '@workos-inc/authkit-nextjs'
import { getSubscription, getEffectivePlan } from '@/lib/subscription'
import { PLANS } from '@/lib/plans'
import { getUnreadNotificationCount } from '@/lib/db/notifications'
import { Sidebar } from '@/components/dashboard/Sidebar'
import { Topbar } from '@/components/dashboard/Topbar'
import type { TopbarUser } from '@/components/dashboard/Topbar'
import '@/styles/dashboard.css'

function makeInitials(name: string | null | undefined, email: string | null | undefined) {
  if (name) {
    const parts = name.split(/\s+/).filter(Boolean)
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
  }
  return (email?.[0] ?? '?').toUpperCase()
}

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const { user } = await withAuth()
  if (!user) {
    redirect('/sign-in?redirect_url=/dashboard')
  }

  const [sub, unreadCount] = await Promise.all([
    getSubscription(),
    getUnreadNotificationCount(user.id).catch(() => 0),
  ])
  const tier = getEffectivePlan(sub) // 'free' | 'foundations' | 'growth' | 'accelerate'

  const fullName = [user.firstName, user.lastName].filter(Boolean).join(' ') || user.email || ''
  const topbarUser: TopbarUser = {
    name: fullName,
    initials: makeInitials(fullName, user.email),
    planLabel: PLANS[tier].name,
  }

  return (
    <div className="gh-frame" style={{ width: '100vw', height: '100vh', minHeight: 720 }}>
      <Sidebar />
      <div className="gh-main">
        <Topbar user={topbarUser} initialUnreadCount={unreadCount} />
        <div className="gh-content">{children}</div>
      </div>
    </div>
  )
}
