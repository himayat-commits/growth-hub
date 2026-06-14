'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import SignOutButton from '@/components/SignOutButton'
import { IcoSearch, IcoBell, IcoHelp } from './Icons'

export interface TopbarUser {
  name: string
  initials: string
  planLabel: string
  photoUrl?: string | null
}

interface TopbarProps {
  user: TopbarUser
  initialUnreadCount?: number
}

// Poll /api/notifications/unread-count every 60s so the bell dot stays in
// sync with new notifications without a websocket. Cheap — just a count.
function useUnreadCount(initial: number) {
  const [count, setCount] = useState(initial)
  useEffect(() => {
    let cancelled = false
    const tick = async () => {
      try {
        const res = await fetch('/api/notifications/unread-count', { cache: 'no-store' })
        if (!res.ok) return
        const data: { count?: number } = await res.json()
        if (!cancelled && typeof data.count === 'number') setCount(data.count)
      } catch {
        /* silent — try again next tick */
      }
    }
    const id = window.setInterval(tick, 60_000)
    // Also re-check on focus so coming back from another tab feels fresh.
    const onFocus = () => { void tick() }
    window.addEventListener('focus', onFocus)
    return () => {
      cancelled = true
      window.clearInterval(id)
      window.removeEventListener('focus', onFocus)
    }
  }, [])
  return count
}

export function Topbar({ user, initialUnreadCount = 0 }: TopbarProps) {
  const unreadCount = useUnreadCount(initialUnreadCount)
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  // Close the account menu on outside-click or Escape — the caret promises a
  // menu, so it has to behave like one (the old chip was just a link).
  useEffect(() => {
    if (!menuOpen) return
    const onDown = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false)
      }
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMenuOpen(false)
    }
    document.addEventListener('mousedown', onDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [menuOpen])

  return (
    <div className="gh-top">
      <form className="gh-search" action="/search" method="get" role="search">
        <IcoSearch />
        <input
          type="search"
          name="q"
          placeholder="Search services, resources, events…"
          aria-label="Search"
        />
      </form>
      <div className="gh-top-spacer" />
      <div className="gh-top-actions">
        <button className="gh-icon-btn" aria-label="Help">
          <IcoHelp />
        </button>
        <Link
          href="/dashboard"
          className="gh-icon-btn"
          aria-label={
            unreadCount > 0 ? `Notifications, ${unreadCount} unread` : 'Notifications'
          }
        >
          <IcoBell />
          {unreadCount > 0 && <span className="gh-dot" />}
        </Link>
      </div>
      <div className="gh-account" ref={menuRef}>
        <button
          type="button"
          className="gh-profile-chip"
          aria-label="Account menu"
          aria-haspopup="menu"
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen((v) => !v)}
        >
          <div className="gh-avatar">
            {user.photoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={user.photoUrl}
                alt=""
                style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }}
              />
            ) : (
              user.initials
            )}
          </div>
          <div className="gh-profile-meta">
            <div className="gh-profile-name">{user.name}</div>
            <div className="gh-profile-role">{user.planLabel}</div>
          </div>
          <svg
            className={`caret${menuOpen ? ' is-open' : ''}`}
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M6 9l6 6 6-6" />
          </svg>
        </button>
        {menuOpen && (
          <div className="gh-account-menu" role="menu">
            <Link role="menuitem" href="/profile" onClick={() => setMenuOpen(false)}>
              Profile &amp; settings
            </Link>
            <Link role="menuitem" href="/plan" onClick={() => setMenuOpen(false)}>
              Plan &amp; billing
            </Link>
            <div className="gh-account-divider" />
            <SignOutButton className="gh-account-signout" />
          </div>
        )}
      </div>
    </div>
  )
}
