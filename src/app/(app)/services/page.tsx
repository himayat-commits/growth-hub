import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { withAuth } from '@workos-inc/authkit-nextjs';
import { PageHeader } from '@/components/dashboard/PageHeader';
import { IcoCal, IcoArrow } from '@/components/dashboard/Icons';
import { getSubscription, getEffectivePlan } from '@/lib/subscription';
import { ADDONS, getAddOnPriceId, type AddOnId, type PlanTier } from '@/lib/plans';
import { wizardProgress } from '@/lib/wizard/initial-state';
import { loadOnboardingRow, isStaleRunning } from '@/lib/wizard/provisioning-store';
import type { PackageId } from '@/lib/wizard/packages';
import { getBirdeyeDashboardUrl } from '@/lib/birdeye/dashboard-url';
import PortalModuleGrid from '@/components/portal/PortalModuleGrid';
import { getServices } from '@/lib/cms';
import { getActiveBookings, statusLabel } from '@/lib/db/bookings';
import ServicesTabs from './ServicesTabs';
import ServicesCatalog, { type ServiceItem } from './ServicesCatalog';

export const metadata: Metadata = {
  title: 'Services — Growth Hub',
};

/** Resolve which add-ons the user has, comparing stored Stripe price IDs
 *  against env-configured ones. Silently skips any add-on whose env var
 *  isn't set. Lifted from the deleted /(main)/portal/page.tsx. */
function resolveActiveAddOns(priceIds: string[]): AddOnId[] {
  const active: AddOnId[] = [];
  for (const id of Object.keys(ADDONS) as AddOnId[]) {
    try {
      const pid = getAddOnPriceId(id);
      if (priceIds.includes(pid)) active.push(id);
    } catch {
      // env var not set — skip
    }
  }
  return active;
}

export default async function ServicesPage() {
  const { user } = await withAuth();
  if (!user) redirect('/sign-in?redirect_url=/services');

  const [sub, services, activeBookings] = await Promise.all([
    getSubscription(),
    getServices(),
    getActiveBookings(user.id),
  ]);
  const tier: PlanTier = getEffectivePlan(sub);
  const activeAddOns = resolveActiveAddOns(sub?.addOnPriceIds ?? []);

  // Has the user completed the Birdeye provisioning wizard?
  const obRow = await loadOnboardingRow(user.id);
  const wizardState = obRow?.state;
  const businessNumber = wizardState?.provisioning?.businessNumber ?? null;
  const businessName = wizardState?.business?.name ?? null;
  const runStatus = wizardState?.provisioning?.runStatus ?? null;
  const failedSteps = wizardState?.provisioning?.failedSteps ?? [];
  const staleRunning =
    wizardState && obRow ? isStaleRunning(wizardState, obRow.updatedAt) : false;
  // A live run gets a "we're on it now" banner; a stale one (crashed
  // serverless function) falls through to the resume/retry path instead.
  const isRunning = runStatus === 'running' && !staleRunning;
  // A partial run still has a businessNumber (account exists) but some steps
  // need a retry — surface a distinct "attention" banner for it. Once ops
  // has been escalated (3+ failed retries) the retry burden is off the user.
  const isPartial = runStatus === 'partial';
  const isEscalated = isPartial && Boolean(wizardState?.provisioning?.escalatedAt);
  const provisioned = !!businessNumber && !isPartial && runStatus !== 'running';
  const hasActivePaidSub = tier !== 'free';
  const dashboardUrl = getBirdeyeDashboardUrl(businessNumber);

  // Free-tier action-plan progress. Report mode reuses these wizard steps;
  // once they're all filled the banner switches from "Build" to "View".
  const reportComplete = wizardProgress(wizardState, 'report', 'foundations').next === null;

  // For partially-completed wizards, deep-link to the first incomplete step.
  let setupHref = '/onboarding';
  let setupProgress: { done: number; total: number } | null = null;
  if (!provisioned && hasActivePaidSub) {
    const progress = wizardProgress(wizardState, 'provision', tier as PackageId);
    setupProgress = { done: progress.done, total: progress.total };
    // A prior failed attempt (or a fully-filled wizard) resumes at the launch
    // step so the user can retry; otherwise jump to the first gap.
    setupHref =
      runStatus === 'failed' || wizardState?.provisioning?.attempts || !progress.next
        ? '/onboarding/review'
        : `/onboarding/${progress.next.key}`;
  }

  // Project Payload services into the lightweight shape the client tab needs.
  const serviceItems: ServiceItem[] = services.map((s) => ({
    id: s.id,
    slug: s.slug,
    title: s.title,
    description: s.description,
    category: s.category ?? 'strategy',
    tone: s.tone ?? 'teal',
    icon: s.icon ?? 'briefcase',
    price: (s.price ?? null) as string | null,
    priceLabel: (s.priceLabel ?? null) as string | null,
    ctaLabel: s.ctaLabel ?? 'Request',
  }));

  return (
    <>
      <PageHeader
        kicker="What we offer"
        title="Services"
        sub="Birdeye platform modules and consultancy services in one place. Every engagement starts with a free 30-minute Growth Call — no card needed."
        actions={
          <>
            <Link href="/plan">
              <button className="gh-btn ghost" type="button">
                Compare plans
              </button>
            </Link>
            <a
              href="mailto:hello@himayat.com.au?subject=Book%20Growth%20Call"
              className="gh-btn"
            >
              <IcoCal />
              Book Growth Call
            </a>
          </>
        }
      />

      {/* Provisioning banner — only relevant on the modules side, but
          rendered above the tabs so paid users see it on first paint. */}
      {provisioned ? (
        <div className="portal-birdeye-banner portal-birdeye-banner--ready" style={{ marginBottom: 24 }}>
          <div className="portal-birdeye-banner-head">
            <span className="portal-birdeye-pill">✓ Birdeye account ready</span>
            <h2 className="portal-birdeye-title">
              {businessName ? `${businessName} is live on Birdeye.` : 'Your Birdeye account is ready.'}
            </h2>
            <p className="portal-birdeye-sub">
              Business number <code>{businessNumber}</code>
            </p>
          </div>
          <div className="portal-birdeye-banner-cta">
            <a
              href={dashboardUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-lime"
            >
              Open your Birdeye dashboard <IcoArrow />
            </a>
          </div>
        </div>
      ) : isRunning && hasActivePaidSub ? (
        <div className="portal-birdeye-banner portal-birdeye-banner--setup" style={{ marginBottom: 24 }}>
          <div className="portal-birdeye-banner-head">
            <span className="portal-birdeye-pill">Setup in progress</span>
            <h2 className="portal-birdeye-title">Setting up your account now…</h2>
            <p className="portal-birdeye-sub">
              We&apos;re creating your Birdeye account — this takes about a minute.
            </p>
          </div>
          <div className="portal-birdeye-banner-cta">
            <Link href="/onboarding/review" className="btn btn-primary">
              See live progress <IcoArrow />
            </Link>
          </div>
        </div>
      ) : isEscalated && hasActivePaidSub ? (
        <div className="portal-birdeye-banner portal-birdeye-banner--setup" style={{ marginBottom: 24 }}>
          <div className="portal-birdeye-banner-head">
            <span className="portal-birdeye-pill">We&apos;re on it</span>
            <h2 className="portal-birdeye-title">
              {businessName
                ? `${businessName} is live — our team is finishing setup.`
                : 'Your account is live — our team is finishing setup.'}
            </h2>
            <p className="portal-birdeye-sub">
              Your account is live; our team is completing the last {failedSteps.length} setup
              step{failedSteps.length === 1 ? '' : 's'}. We&apos;ll notify you when it&apos;s done.
            </p>
          </div>
          <div className="portal-birdeye-banner-cta">
            <a
              href="mailto:hello@himayat.com.au?subject=Birdeye%20setup"
              className="btn btn-primary"
            >
              Questions? Email us <IcoArrow />
            </a>
          </div>
        </div>
      ) : isPartial && hasActivePaidSub ? (
        <div className="portal-birdeye-banner portal-birdeye-banner--setup" style={{ marginBottom: 24 }}>
          <div className="portal-birdeye-banner-head">
            <span className="portal-birdeye-pill portal-birdeye-pill--amber">Setup needs attention</span>
            <h2 className="portal-birdeye-title">
              {businessName
                ? `${businessName} is live, but setup didn't fully finish.`
                : "Your Birdeye account needs attention."}
            </h2>
            <p className="portal-birdeye-sub">
              Business number <code>{businessNumber}</code> ·{' '}
              {wizardState?.provisioning?.failedSteps?.length ?? 0} step(s) need a retry.
            </p>
          </div>
          <div className="portal-birdeye-banner-cta">
            <Link href="/onboarding/review" className="btn btn-primary">
              Resume / retry <IcoArrow />
            </Link>
          </div>
        </div>
      ) : hasActivePaidSub ? (
        <div className="portal-birdeye-banner portal-birdeye-banner--setup" style={{ marginBottom: 24 }}>
          <div className="portal-birdeye-banner-head">
            <span className="portal-birdeye-pill portal-birdeye-pill--amber">
              {runStatus === 'failed'
                ? "Setup didn't finish"
                : setupProgress && setupProgress.done > 0
                  ? 'Setup in progress'
                  : 'Setup pending'}
            </span>
            <h2 className="portal-birdeye-title">
              {runStatus === 'failed'
                ? "Let's finish setting up your Birdeye account."
                : setupProgress && setupProgress.done > 0
                  ? 'Pick up where you left off.'
                  : 'Set up your Birdeye account.'}
            </h2>
            <p className="portal-birdeye-sub">
              {runStatus === 'failed'
                ? "Your last attempt didn't complete — your answers are saved. Pick up and retry."
                : setupProgress && setupProgress.done > 0
                  ? `${setupProgress.done} of ${setupProgress.total} steps complete · we'll resume right where you left off.`
                  : "15-minute wizard. Save and resume any time — we'll pick up right where you left off."}
            </p>
          </div>
          <div className="portal-birdeye-banner-cta">
            <Link href={setupHref} className="btn btn-primary">
              {runStatus === 'failed'
                ? 'Retry setup'
                : setupProgress && setupProgress.done > 0
                  ? 'Resume setup'
                  : 'Start setup'}{' '}
              <IcoArrow />
            </Link>
          </div>
        </div>
      ) : (
        <div className="portal-birdeye-banner portal-birdeye-banner--setup" style={{ marginBottom: 24 }}>
          <div className="portal-birdeye-banner-head">
            <span className="portal-birdeye-pill portal-birdeye-pill--amber">Free action plan</span>
            <h2 className="portal-birdeye-title">
              {reportComplete
                ? 'Your Birdeye action plan is ready.'
                : 'Get your free Birdeye action plan.'}
            </h2>
            <p className="portal-birdeye-sub">
              {reportComplete
                ? 'A personalised local-growth plan built from your answers — plus what Foundations automates for you.'
                : "Answer a few questions about your business and we'll build a personalised local-growth plan — free, no card needed."}
            </p>
          </div>
          <div className="portal-birdeye-banner-cta">
            <Link
              href={reportComplete ? '/onboarding/action-plan' : '/onboarding'}
              className="btn btn-primary"
            >
              {reportComplete ? 'View your action plan' : 'Build your action plan'} <IcoArrow />
            </Link>
          </div>
        </div>
      )}

      {activeBookings.length > 0 && (
        <div className="gh-card" style={{ marginBottom: 24 }}>
          <div className="gh-card-hd">
            <div className="gh-card-h">Active engagements</div>
            <span className="gh-pill plum">{activeBookings.length} open</span>
          </div>
          <ul className="gh-list">
            {activeBookings.map((b) => (
              <li key={b.id}>
                <div className="gh-list-body">
                  <div className="gh-list-h">{b.serviceTitle}</div>
                  <p className="gh-list-p">
                    {statusLabel(b.status)} · requested{' '}
                    {new Intl.DateTimeFormat('en-AU', { dateStyle: 'medium' }).format(
                      b.requestedAt,
                    )}
                    {b.datePreference ? ` · ${b.datePreference}` : ''}
                  </p>
                </div>
                <Link href={`/services/${b.serviceSlug}`} className="gh-card-link">
                  View →
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}

      <ServicesTabs
        modules={
          <PortalModuleGrid
            tier={tier}
            activeAddOns={activeAddOns}
            dashboardUrl={dashboardUrl}
            provisioned={Boolean(businessNumber)}
            setupHref={setupHref}
          />
        }
        services={<ServicesCatalog services={serviceItems} />}
      />
    </>
  );
}
