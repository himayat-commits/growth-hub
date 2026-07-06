import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { withAuth } from '@/lib/auth/with-auth';
import { PageHeader } from '@/components/dashboard/PageHeader';
import { IcoCal } from '@/components/dashboard/Icons';
import { getSubscription, getEffectivePlan } from '@/lib/subscription';
import { ADDONS, getAddOnPriceId, type AddOnId, type PlanTier } from '@/lib/plans';
import { wizardProgress } from '@/lib/wizard/initial-state';
import { loadOnboardingRow, isStaleRunning } from '@/lib/wizard/provisioning-store';
import type { PackageId } from '@/lib/wizard/packages';
import { getBirdeyeDashboardUrl } from '@/lib/birdeye/dashboard-url';
import PortalModuleGrid from '@/components/portal/PortalModuleGrid';
import {
  BirdeyeStatusBanner,
  type BirdeyeBannerState,
} from '@/components/portal/BirdeyeStatusBanner';
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
      <div style={{ marginBottom: 24 }}>
        <BirdeyeStatusBanner
          state={((): BirdeyeBannerState => {
            if (provisioned) {
              return { kind: 'ready', businessName, businessNumber: businessNumber!, dashboardUrl };
            }
            if (isRunning && hasActivePaidSub) return { kind: 'running' };
            if (isEscalated && hasActivePaidSub) {
              return { kind: 'escalated', businessName, failedCount: failedSteps.length };
            }
            if (isPartial && hasActivePaidSub) {
              return {
                kind: 'partial',
                businessName,
                businessNumber: businessNumber ?? '—',
                failedCount: failedSteps.length,
              };
            }
            if (hasActivePaidSub) {
              return {
                kind: 'setup',
                phase:
                  runStatus === 'failed'
                    ? 'failed'
                    : setupProgress && setupProgress.done > 0
                      ? 'resume'
                      : 'start',
                done: setupProgress?.done ?? 0,
                total: setupProgress?.total ?? 0,
                setupHref,
              };
            }
            return { kind: 'free', reportComplete };
          })()}
        />
      </div>

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
