import React from 'react'

interface PageHeaderProps {
  kicker?: string
  title: string
  sub?: string
  actions?: React.ReactNode
}

export function PageHeader({ kicker, title, sub, actions }: PageHeaderProps) {
  return (
    <div className="gh-pagehd">
      <div>
        {kicker && (
          <div><span className="gh-pagehd-kicker">{kicker}</span></div>
        )}
        <h1 className="gh-pagehd-title">{title}</h1>
        {sub && <div className="gh-pagehd-sub">{sub}</div>}
      </div>
      {actions && <div className="gh-pagehd-actions">{actions}</div>}
    </div>
  )
}
