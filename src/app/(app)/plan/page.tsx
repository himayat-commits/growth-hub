import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { withAuth } from '@workos-inc/authkit-nextjs';
import { PageHeader } from '@/components/dashboard/PageHeader';
import { getSubscription, getEffectivePlan } from '@/lib/subscription';
import { PLANS, type PlanTier, type PaidPlanTier } from '@/lib/plans';
import { ManageBillingButton } from '@/components/billing/ManageBillingButton';
import { IcoShield } from '@/components/dashboard/Icons';
import PlanCheckoutButton from './PlanCheckoutButton';

export const metadata: Metadata = {
  title: 'My plan — Growth Hub',
};

// Display order on the comparison grid. We want Free first as the entry
// point, then ascending price.
const COMPARE_ORDER: PlanTier[] = ['free', 'foundations', 'growth', 'accelerate'];

// Marketing copy per tier — focused, fits the comparison card cleanly.
const PLAN_TAGLINES: Record<PlanTier, string> = {
  free: 'Get started, no commitment.',
  foundations: 'For new businesses building presence.',
  growth: 'For operators ready to scale visibility.',
  accelerate: 'Full conversion engine for revenue growth.',
};

export default async function PlanPage() {
  const { user } = await withAuth();
  if (!user) redirect('/sign-in?redirect_url=/plan');

  const sub = await getSubscription();
  const currentTier = getEffectivePlan(sub); // 'free' | paid tier
  const currentPlan = PLANS[currentTier];

  const billingInterval = sub?.billingInterval ?? null;
  const periodEnd = sub?.currentPeriodEnd
    ? new Intl.DateTimeFormat('en-AU', { dateStyle: 'long' }).format(sub.currentPeriodEnd)
    : null;

  const upgradeTarget: PaidPlanTier =
    currentTier === 'free' || currentTier === 'foundations' ? 'growth' : 'accelerate';

  return (
    <>
      <PageHeader
        kicker="Your membership"
        title="My plan"
        sub={
          currentTier === 'free'
            ? "You’re on the Free Member plan. Upgrade any time to unlock the Birdeye platform, monthly 1:1s, and service credits."
            : `You’re on the ${currentPlan.name} plan. Manage billing or upgrade below.`
        }
        actions={
          <>
            <Link href="/benefits">
              <button className="gh-btn ghost" type="button">
                See benefits
              </button>
            </Link>
            {currentTier !== 'accelerate' && (
              <PlanCheckoutButton
                tier={upgradeTarget}
                label={`Upgrade to ${PLANS[upgradeTarget].name}`}
                className="gh-btn"
              />
            )}
          </>
        }
      />

      <div className="gh-section-h">Current plan</div>

      <div className="gh-card" style={{ flexDirection: 'row', alignItems: 'center', gap: 28 }}>
        <div style={{ flex: 1 }}>
          <div className="gh-plan-name">{currentPlan.name}</div>
          <div className="gh-plan-price" style={{ marginTop: 8 }}>
            {currentPlan.monthlyPrice === 0 ? (
              <>
                A$0<small>/ forever</small>
              </>
            ) : (
              <>
                A${currentPlan.monthlyPrice}
                <small>/ {billingInterval === 'year' ? 'mo (billed annually)' : 'mo'}</small>
              </>
            )}
          </div>
          <p className="gh-plan-tagline" style={{ marginTop: 8 }}>
            {currentPlan.description}
          </p>
          <div
            style={{
              display: 'flex',
              gap: 14,
              marginTop: 14,
              fontSize: 12.5,
              color: 'var(--ink-50)',
              letterSpacing: '0.02em',
              flexWrap: 'wrap',
            }}
          >
            {currentTier === 'free' ? (
              <>
                <span>Activated on sign-up</span>
                <span>·</span>
                <span>Renews automatically</span>
                <span>·</span>
                <span>No card on file</span>
              </>
            ) : (
              <>
                <span>{billingInterval === 'year' ? 'Annual billing' : 'Monthly billing'}</span>
                <span>·</span>
                <span>
                  {sub?.cancelAtPeriodEnd ? 'Cancels on' : 'Renews on'} {periodEnd ?? '—'}
                </span>
                <span>·</span>
                <span>Status: {sub?.subscriptionStatus ?? 'active'}</span>
              </>
            )}
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, alignItems: 'stretch' }}>
          {currentTier !== 'accelerate' && (
            <PlanCheckoutButton
              tier={upgradeTarget}
              label={`Upgrade to ${PLANS[upgradeTarget].name}`}
              className="gh-btn lime"
            />
          )}
          {currentTier !== 'free' && <ManageBillingButton />}
        </div>
      </div>

      <div className="gh-section-h">Compare plans</div>

      <div className="gh-grid-3" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))' }}>
        {COMPARE_ORDER.map((t) => {
          const plan = PLANS[t];
          const isCurrent = t === currentTier;
          const isFeatured = t === 'growth';
          return (
            <div
              key={t}
              className={`gh-plan-card ${isCurrent ? 'is-current' : ''} ${isFeatured ? 'is-featured' : ''}`}
            >
              {isCurrent && (
                <div
                  className="gh-plan-badge"
                  style={{ background: 'var(--teal)', color: 'var(--cream)' }}
                >
                  Current
                </div>
              )}
              {!isCurrent && isFeatured && (
                <div className="gh-plan-badge">Recommended</div>
              )}
              <div className="gh-plan-name">{plan.name}</div>
              <div className="gh-plan-price">
                {plan.monthlyPrice === 0 ? (
                  <>
                    A$0<small>/ forever</small>
                  </>
                ) : (
                  <>
                    A${plan.monthlyPrice}
                    <small>/ mo</small>
                  </>
                )}
              </div>
              <p className="gh-plan-tagline">{PLAN_TAGLINES[t]}</p>
              <ul className="gh-plan-list">
                {plan.features.map((f) => (
                  <li key={f}>{f}</li>
                ))}
              </ul>
              {isCurrent ? (
                <button
                  className="gh-btn ghost"
                  style={{ alignSelf: 'flex-start' }}
                  disabled
                  type="button"
                >
                  Your current plan
                </button>
              ) : t === 'free' ? (
                <Link href="/dashboard">
                  <button className="gh-btn ghost" type="button">
                    Stay on Free
                  </button>
                </Link>
              ) : (
                <PlanCheckoutButton
                  tier={t as PaidPlanTier}
                  label={`Upgrade — A$${plan.monthlyPrice}/mo`}
                  className={isFeatured ? 'gh-btn lime' : 'gh-btn'}
                />
              )}
            </div>
          );
        })}
      </div>

      <div className="gh-card" style={{ background: 'var(--lavender)', borderColor: 'rgba(95,48,75,0.2)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
          <div className="gh-benefit-ic plum">
            <IcoShield />
          </div>
          <div style={{ flex: 1 }}>
            <div
              style={{
                fontFamily: 'var(--font-serif)',
                fontSize: 18,
                color: 'var(--plum)',
                letterSpacing: '-0.01em',
              }}
            >
              Not sure which plan fits?
            </div>
            <div style={{ fontSize: 13, color: 'rgba(95,48,75,0.78)', marginTop: 4 }}>
              Use your free Growth Call to talk it through — no upsell, just honest advice on where
              your time goes furthest.
            </div>
          </div>
          <Link href="/services">
            <button className="gh-btn" type="button">
              Book Growth Call
            </button>
          </Link>
        </div>
      </div>
    </>
  );
}
