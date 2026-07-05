'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import {
  IcoHome, IcoPlanNav, IcoServicesNav, IcoResourcesNav,
  IcoEventsNav, IcoMsgNav, IcoBenefitsNav, IcoProfileNav,
} from './Icons'

const MARKETING_SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ?? 'https://thegrowthhub.com.au'

const NAV = [
  { id: 'dashboard', href: '/dashboard', label: 'Dashboard',        Icon: IcoHome },
  { id: 'plan',      href: '/plan',      label: 'My Plan',          Icon: IcoPlanNav },
  { id: 'services',  href: '/services',  label: 'Services',         Icon: IcoServicesNav },
  { id: 'resources', href: '/resources', label: 'Resources',        Icon: IcoResourcesNav },
  { id: 'events',    href: '/my-events', label: 'Events & Webinars', Icon: IcoEventsNav },
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
      <a
        className="gh-side-brand"
        href={MARKETING_SITE_URL}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="The Growth Hub by Himayat — open the main site"
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          className="gh-side-brand-logo"
          src="/brand/growth-hub-lockup.svg"
          alt="The Growth Hub by Himayat"
          width={810}
          height={239}
        />
      </a>

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
