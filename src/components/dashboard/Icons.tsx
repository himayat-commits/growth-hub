import React from 'react'

const base = {
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.7,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
}

export function Icon({ children, className, style }: { children: React.ReactNode; className?: string; style?: React.CSSProperties }) {
  return <svg {...base} className={className} style={style}>{children}</svg>
}

export const IcoSearch     = () => <Icon><path d="M21 21l-4.3-4.3M10.5 18a7.5 7.5 0 1 1 0-15 7.5 7.5 0 0 1 0 15z" /></Icon>
export const IcoBell       = () => <Icon><path d="M6 8a6 6 0 1 1 12 0c0 5 2 7 2 7H4s2-2 2-7z" /><path d="M10 19a2 2 0 0 0 4 0" /></Icon>
export const IcoHelp       = () => <Icon><circle cx="12" cy="12" r="9" /><path d="M9.5 9.5a2.5 2.5 0 1 1 3.5 2.3c-.8.4-1 1-1 1.7M12 17h.01" /></Icon>
export const IcoCaret      = () => <Icon><path d="M6 9l6 6 6-6" /></Icon>
export const IcoCheck      = () => <Icon><path d="M5 12l4 4 10-10" /></Icon>
export const IcoArrow      = () => <Icon><path d="M5 12h14M13 6l6 6-6 6" /></Icon>
export const IcoBriefcase  = () => <Icon><rect x="3" y="7" width="18" height="13" rx="2" /><path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /></Icon>
export const IcoCal        = () => <Icon><rect x="3" y="5" width="18" height="16" rx="2" /><path d="M16 3v4M8 3v4M3 10h18" /></Icon>
export const IcoMsg        = () => <Icon><path d="M21 12a8 8 0 1 1-3.6-6.7L21 4l-1.3 3.6A8 8 0 0 1 21 12z" /></Icon>
export const IcoSpark      = () => <Icon><path d="M12 3v4M12 17v4M3 12h4M17 12h4M5.6 5.6l2.8 2.8M15.6 15.6l2.8 2.8M5.6 18.4l2.8-2.8M15.6 8.4l2.8-2.8" /></Icon>
export const IcoGift       = () => <Icon><path d="M20 12v9H4v-9M2 7h20v5H2zM12 22V7" /><path d="M12 7s-1-4-4-4-3 4-1 4 5 0 5 0zM12 7s1-4 4-4 3 4 1 4-5 0-5 0z" /></Icon>
export const IcoGlobe      = () => <Icon><circle cx="12" cy="12" r="9" /><path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18" /></Icon>
export const IcoMegaphone  = () => <Icon><path d="M3 11v2a2 2 0 0 0 2 2h2l9 4V5L7 9H5a2 2 0 0 0-2 2z" /><path d="M14 8a4 4 0 0 1 0 8" /></Icon>
export const IcoType       = () => <Icon><path d="M4 7V5h16v2M9 5v14M15 5v14M7 19h10" /></Icon>
export const IcoTrend      = () => <Icon><path d="M3 17l6-6 4 4 8-8M21 7v6M21 7h-6" /></Icon>
export const IcoShare      = () => <Icon><circle cx="6" cy="12" r="3" /><circle cx="18" cy="6" r="3" /><circle cx="18" cy="18" r="3" /><path d="M8.5 10.5l7-3M8.5 13.5l7 3" /></Icon>
export const IcoCog        = () => <Icon><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 0 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3h.1a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8v.1a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z" /></Icon>
export const IcoDownload   = () => <Icon><path d="M12 3v13M6 11l6 6 6-6M5 21h14" /></Icon>
export const IcoPlay       = () => <Icon><path d="M6 4l14 8L6 20z" /></Icon>
export const IcoBook       = () => <Icon><path d="M4 19V5a2 2 0 0 1 2-2h11v18H6a2 2 0 0 1-2-2z" /><path d="M8 7h6M8 11h6M8 15h4" /></Icon>
export const IcoPeople     = () => <Icon><circle cx="9" cy="8" r="4" /><path d="M2 21a7 7 0 0 1 14 0M17 11a4 4 0 0 0 0-8M22 21a6 6 0 0 0-4-5.7" /></Icon>
export const IcoShield     = () => <Icon><path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z" /></Icon>
export const IcoDoc        = () => <Icon><path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z" /><path d="M14 3v6h6M8 13h8M8 17h5" /></Icon>
export const IcoStar       = () => <Icon><path d="M12 2l2.5 5 5.5.8-4 3.9.9 5.5L12 14.8 7.1 17.2 8 11.7 4 7.8l5.5-.8z" /></Icon>
export const IcoClock      = () => <Icon><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></Icon>
export const IcoUser       = () => <Icon><circle cx="12" cy="8" r="4" /><path d="M4 21a8 8 0 0 1 16 0" /></Icon>
export const IcoSend       = () => <Icon><path d="M3 12L21 4l-7 18-3-8-8-2z" /></Icon>
export const IcoHome       = () => <Icon><path d="M3 11l9-7 9 7M5 10v10h4v-6h6v6h4V10" /></Icon>
export const IcoServicesNav = () => <Icon><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 0 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3h.1a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8v.1a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z" /></Icon>
export const IcoResourcesNav = () => <Icon><path d="M4 19V5a2 2 0 0 1 2-2h11v18H6a2 2 0 0 1-2-2z" /><path d="M8 7h6M8 11h6M8 15h4" /></Icon>
export const IcoEventsNav   = () => <Icon><rect x="3" y="5" width="18" height="16" rx="2" /><path d="M16 3v4M8 3v4M3 10h18" /></Icon>
export const IcoMsgNav      = () => <Icon><path d="M21 12a8 8 0 1 1-3.6-6.7L21 4l-1.3 3.6A8 8 0 0 1 21 12z" /></Icon>
export const IcoBenefitsNav = () => <Icon><path d="M12 2l2.5 5 5.5.8-4 3.9.9 5.5L12 14.8 7.1 17.2 8 11.7 4 7.8l5.5-.8z" /></Icon>
export const IcoProfileNav  = () => <Icon><circle cx="12" cy="8" r="4" /><path d="M4 21a8 8 0 0 1 16 0" /></Icon>
export const IcoPlanNav     = () => <Icon><path d="M5 4h11l3 3v13H5z" /><path d="M9 9h6M9 13h6M9 17h4" /></Icon>
