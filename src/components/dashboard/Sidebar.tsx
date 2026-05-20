'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import {
  IcoHome, IcoPlanNav, IcoServicesNav, IcoResourcesNav,
  IcoEventsNav, IcoMsgNav, IcoBenefitsNav, IcoProfileNav,
} from './Icons'

const NAV = [
  { id: 'dashboard', href: '/dashboard', label: 'Dashboard',        Icon: IcoHome },
  { id: 'plan',      href: '/plan',      label: 'My Plan',          Icon: IcoPlanNav },
  { id: 'services',  href: '/services',  label: 'Services',         Icon: IcoServicesNav },
  { id: 'resources', href: '/resources', label: 'Resources',        Icon: IcoResourcesNav },
  { id: 'events',    href: '/events',    label: 'Events & Webinars', Icon: IcoEventsNav },
  { id: 'messages',  href: '/messages',  label: 'Messages',         Icon: IcoMsgNav },
  { id: 'benefits',  href: '/benefits',  label: 'Member Benefits',  Icon: IcoBenefitsNav },
  { id: 'profile',   href: '/profile',   label: 'Profile & Settings', Icon: IcoProfileNav },
]

export function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()

  const isActive = (href: string) => {
    // The Birdeye provisioning wizard at /onboarding/* is conceptually a
    // Services flow — highlight Services in the sidebar while the user is
    // inside the wizard so they always see where they are in the app.
    if (href === '/services' && pathname.startsWith('/onboarding')) return true
    return pathname === href || pathname.startsWith(`${href}/`)
  }

  return (
    <aside className="gh-side">
      <button className="gh-side-brand" onClick={() => router.push('/dashboard')}>
        <div className="gh-side-brand-mark">
          <svg width="22" height="22" viewBox="0 0 100 100" fill="none">
            <circle cx="38" cy="35" r="22" fill="rgb(243,240,231)" opacity="0.9"/>
            <circle cx="62" cy="35" r="22" fill="rgb(243,240,231)" opacity="0.9"/>
            <circle cx="40" cy="65" r="18" fill="rgb(243,240,231)" opacity="0.9"/>
            <circle cx="60" cy="65" r="18" fill="rgb(243,240,231)" opacity="0.9"/>
            <rect x="49" y="15" width="2" height="55" rx="1" fill="rgb(243,240,231)"/>
          </svg>
        </div>
        <div>
          <div className="gh-side-brand-name">The Growth Hub</div>
          <div className="gh-side-brand-sub">By Himayat</div>
        </div>
      </button>

      <nav className="gh-nav">
        {NAV.map(({ id, href, label, Icon }) => (
          <Link
            key={id}
            href={href}
            className={isActive(href) ? 'is-active' : ''}
          >
            <Icon />
            <span>{label}</span>
          </Link>
        ))}
      </nav>

      <div className="gh-side-foot">
        <div className="gh-refer-mini">
          <div className="gh-refer-mini-h">Bring a friend along</div>
          <div className="gh-refer-mini-p">Both of you get a credit toward your next service.</div>
          <button onClick={() => router.push('/benefits')}>Refer &amp; earn</button>
        </div>
      </div>
    </aside>
  )
}
