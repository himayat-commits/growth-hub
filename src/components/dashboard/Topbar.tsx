'use client'

import Link from 'next/link'
import { IcoSearch, IcoBell, IcoHelp } from './Icons'

export interface TopbarUser {
  name: string
  initials: string
  planLabel: string
}

interface TopbarProps {
  user: TopbarUser
  unreadCount?: number
}

export function Topbar({ user, unreadCount = 0 }: TopbarProps) {
  return (
    <div className="gh-top">
      <div className="gh-search">
        <IcoSearch />
        <input placeholder="Search services, resources, events…" />
      </div>
      <div className="gh-top-spacer" />
      <div className="gh-top-actions">
        <button className="gh-icon-btn" aria-label="Help">
          <IcoHelp />
        </button>
        <button
          className="gh-icon-btn"
          aria-label={
            unreadCount > 0 ? `Notifications, ${unreadCount} unread` : 'Notifications'
          }
        >
          <IcoBell />
          {unreadCount > 0 && <span className="gh-dot" />}
        </button>
      </div>
      <Link
        href="/profile"
        className="gh-profile-chip"
        style={{ color: 'inherit', textDecoration: 'none' }}
      >
        <div className="gh-avatar">{user.initials}</div>
        <div>
          <div className="gh-profile-name">{user.name}</div>
          <div className="gh-profile-role">{user.planLabel}</div>
        </div>
        <svg
          className="caret"
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M6 9l6 6 6-6" />
        </svg>
      </Link>
    </div>
  )
}
