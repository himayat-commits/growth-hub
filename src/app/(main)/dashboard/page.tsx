import Link from 'next/link';
import { redirect } from 'next/navigation';
import { withAuth } from '@workos-inc/authkit-nextjs';
import { getSubscription } from '@/lib/subscription';
import { PLANS, type PlanTier } from '@/lib/plans';
import { ManageBillingButton } from './manage-billing-button';

export default async function DashboardPage() {
  // Require sign-in but not a subscription — show an empty state for
  // free users so they can navigate to /pricing or /portal from here.
  // Use manual redirect (not `ensureSignedIn: true`) because that helper
  // writes a PKCE cookie, which isn't allowed in Server Component render.
  const { user } = await withAuth();
  if (!user) {
    redirect('/sign-in?redirect_url=' + encodeURIComponent('/dashboard'));
  }
  const sub = await getSubscription();

  if (!sub) {
    return (
      <div className="min-h-screen bg-[#f0ebe0] p-12">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-4xl font-serif text-[#1a3530] mb-2">Dashboard</h1>
          <p className="text-[#1a3530]/70 mb-10">Manage your Himayat subscription</p>

          <div className="bg-white rounded-2xl p-8 shadow-sm border border-[#1a3530]/10">
            <div className="text-xs tracking-[0.2em] uppercase text-[#7a2929] font-medium mb-2">
              No active subscription
            </div>
            <div className="text-3xl font-serif text-[#1a3530] mb-4">
              Choose a plan to unlock the full Growth Hub.
            </div>
            <p className="text-[#1a3530]/70 mb-8">
              You can keep exploring the free modules in your portal in the meantime.
            </p>

            <div className="flex flex-wrap gap-3">
              <Link
                href="/pricing"
                className="inline-flex items-center gap-2 rounded-full bg-[#1a3530] text-white px-6 py-3 text-sm font-medium hover:bg-[#0f2421] transition-colors"
              >
                Choose a plan
              </Link>
              <Link
                href="/portal"
                className="inline-flex items-center gap-2 rounded-full border border-[#1a3530]/20 text-[#1a3530] px-6 py-3 text-sm font-medium hover:bg-[#1a3530]/5 transition-colors"
              >
                Explore what's included
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const planConfig = sub.planTier ? PLANS[sub.planTier as PlanTier] : null;
  const periodEnd = sub.currentPeriodEnd
    ? new Intl.DateTimeFormat('en-AU', { dateStyle: 'long' }).format(sub.currentPeriodEnd)
    : null;

  return (
    <div className="min-h-screen bg-[#f0ebe0] p-12">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-4xl font-serif text-[#1a3530] mb-2">Dashboard</h1>
        <p className="text-[#1a3530]/70 mb-10">Manage your Himayat subscription</p>

        <div className="bg-white rounded-2xl p-8 shadow-sm border border-[#1a3530]/10">
          <div className="text-xs tracking-[0.2em] uppercase text-[#7a2929] font-medium mb-2">
            Current plan
          </div>
          <div className="text-3xl font-serif text-[#1a3530] mb-6">
            {planConfig?.name ?? 'Unknown'}
          </div>

          <dl className="space-y-3 text-sm mb-8">
            <div className="flex justify-between">
              <dt className="text-[#1a3530]/60">Billing</dt>
              <dd className="text-[#1a3530] font-medium">
                {sub.billingInterval === 'year' ? 'Annual' : 'Monthly'}
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-[#1a3530]/60">Status</dt>
              <dd className="text-[#1a3530] font-medium capitalize">
                {sub.subscriptionStatus ?? 'unknown'}
              </dd>
            </div>
            {periodEnd && (
              <div className="flex justify-between">
                <dt className="text-[#1a3530]/60">
                  {sub.cancelAtPeriodEnd ? 'Cancels on' : 'Renews on'}
                </dt>
                <dd className="text-[#1a3530] font-medium">{periodEnd}</dd>
              </div>
            )}
            {sub.addOnPriceIds.length > 0 && (
              <div className="flex justify-between">
                <dt className="text-[#1a3530]/60">Add-ons</dt>
                <dd className="text-[#1a3530] font-medium">
                  {sub.addOnPriceIds.length} active
                </dd>
              </div>
            )}
          </dl>

          <ManageBillingButton />
        </div>
      </div>
    </div>
  );
}
