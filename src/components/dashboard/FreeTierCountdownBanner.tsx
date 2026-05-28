import Link from 'next/link';
import TrackOnMount from '@/components/TrackOnMount';
import { FREE_TIER_DAYS } from '@/lib/subscription';

/**
 * Dashboard banner for Free Members showing where they are in the 120-day
 * free run. Three states by day count:
 *   • <90:    "explore" — friendly, no urgency
 *   • 90-119: "30 days left" — urgency, both CTAs
 *   • ≥120:   "wrapped" — honest copy, no hard gate (no access removed)
 *
 * Day count is computed server-side from `user_profiles.createdAt` via
 * getFreeMemberDayCount(). The banner is mounted only when the user's
 * effective plan is 'free' — paid users never see it.
 *
 * Fires `free_tier_countdown_view` on mount with a daysIn bucket so we
 * can measure conversion against banner exposure without leaking exact
 * day counts into PostHog. Buckets match the visual states.
 */
export interface FreeTierCountdownBannerProps {
  daysIn: number;
}

type Stage = 'explore' | 'warn' | 'wrapped';

function stageFor(daysIn: number): Stage {
  if (daysIn >= FREE_TIER_DAYS) return 'wrapped';
  if (daysIn >= FREE_TIER_DAYS - 30) return 'warn';
  return 'explore';
}

export default function FreeTierCountdownBanner({ daysIn }: FreeTierCountdownBannerProps) {
  const stage = stageFor(daysIn);
  const daysLeft = Math.max(0, FREE_TIER_DAYS - daysIn);

  let kicker: string;
  let body: string;
  if (stage === 'explore') {
    kicker = `Day ${daysIn} of ${FREE_TIER_DAYS}`;
    body = "Explore, attend events, and work through the 12-week course. You've got time.";
  } else if (stage === 'warn') {
    kicker = `${daysLeft} day${daysLeft === 1 ? '' : 's'} left in your free run`;
    body = "Upgrade any time, or reply to your strategist about sponsorship — whichever fits.";
  } else {
    kicker = 'Your free run has wrapped';
    body = 'Choose a plan, or reply to your strategist about sponsorship — your access continues either way.';
  }

  return (
    <>
      <TrackOnMount event="free_tier_countdown_view" properties={{ stage, daysIn }} />
      <div className={`gh-free-countdown is-${stage}`} role="region" aria-label="Free Member countdown">
        <div className="gh-free-countdown-copy">
          <span className="gh-free-countdown-kicker">{kicker}</span>
          <p className="gh-free-countdown-p">{body}</p>
        </div>
        <div className="gh-free-countdown-ctas">
          <Link href="/pricing" className="gh-btn lime">
            See plans
          </Link>
          <a href="/messages" className="gh-btn ghost">
            Talk about sponsorship
          </a>
        </div>
      </div>
    </>
  );
}
