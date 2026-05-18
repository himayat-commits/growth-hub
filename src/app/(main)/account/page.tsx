import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { withAuth } from "@workos-inc/authkit-nextjs";
import { getSubscription, isActive } from "@/lib/subscription";
import { PLANS, type PlanTier } from "@/lib/plans";
import SignOutButton from "@/components/SignOutButton";
import { ManageBillingButton } from "../dashboard/manage-billing-button";

export const metadata: Metadata = {
  title: "Account — Growth Hub",
  description: "Manage your Growth Hub account, subscription, and session.",
};

// Single-screen account hub. Backed by WorkOS for identity and Drizzle/Neon
// for subscription detail. Avoids duplicating the existing /dashboard surface —
// shows the same data more compactly with quick links to deeper actions.

export default async function AccountPage() {
  const { user } = await withAuth();
  if (!user) {
    redirect("/sign-in?redirect_url=" + encodeURIComponent("/account"));
  }

  const sub = await getSubscription();
  const hasActiveSub = isActive(sub);
  const planTier = (sub?.planTier as PlanTier | null) ?? null;
  const plan = planTier ? PLANS[planTier] : null;
  const renewLabel = sub?.currentPeriodEnd
    ? new Intl.DateTimeFormat("en-AU", { dateStyle: "long" }).format(sub.currentPeriodEnd)
    : null;

  const fullName = [user.firstName, user.lastName].filter(Boolean).join(" ") || null;

  return (
    <main className="account-main">
      <div className="wrap">
        <Link className="signup-back" href="/portal">
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" aria-hidden="true">
            <path d="M11 7H3M7 3 3 7l4 4" />
          </svg>
          Back to portal
        </Link>

        <header className="account-head">
          <span className="section-label">Account</span>
          <h1 className="account-h1">{fullName ?? user.email ?? "Your account"}</h1>
          {fullName && user.email && <p className="account-email">{user.email}</p>}
        </header>

        <section className="account-card">
          <h2 className="account-card-title">Profile</h2>
          <dl className="account-dl">
            <div>
              <dt>Name</dt>
              <dd>{fullName ?? "—"}</dd>
            </div>
            <div>
              <dt>Email</dt>
              <dd>{user.email ?? "—"}</dd>
            </div>
            <div>
              <dt>User ID</dt>
              <dd className="account-mono">{user.id}</dd>
            </div>
          </dl>
          <p className="account-note">
            Profile details are managed through your WorkOS sign-in.{" "}
            <a href="https://workos.com/account" target="_blank" rel="noopener noreferrer">
              Update on WorkOS →
            </a>
          </p>
        </section>

        <section className="account-card">
          <h2 className="account-card-title">Subscription</h2>
          {hasActiveSub && plan ? (
            <>
              <dl className="account-dl">
                <div>
                  <dt>Plan</dt>
                  <dd>{plan.name}</dd>
                </div>
                <div>
                  <dt>Billing</dt>
                  <dd>{sub?.billingInterval === "year" ? "Annual" : "Monthly"}</dd>
                </div>
                <div>
                  <dt>Status</dt>
                  <dd className="account-status">{sub?.subscriptionStatus ?? "active"}</dd>
                </div>
                {renewLabel && (
                  <div>
                    <dt>{sub?.cancelAtPeriodEnd ? "Cancels on" : "Renews on"}</dt>
                    <dd>{renewLabel}</dd>
                  </div>
                )}
                {sub && sub.addOnPriceIds.length > 0 && (
                  <div>
                    <dt>Add-ons</dt>
                    <dd>{sub.addOnPriceIds.length} active</dd>
                  </div>
                )}
              </dl>
              <div className="account-actions">
                <ManageBillingButton />
                <Link href="/dashboard" className="btn btn-outline">
                  Detailed billing
                </Link>
              </div>
            </>
          ) : (
            <>
              <p className="account-empty">
                No active subscription. Pick a plan to unlock the full Growth Hub.
              </p>
              <div className="account-actions">
                <Link href="/pricing" className="btn btn-primary">
                  Choose a plan
                </Link>
                <Link href="/portal" className="btn btn-outline">
                  Explore the portal
                </Link>
              </div>
            </>
          )}
        </section>

        <section className="account-card">
          <h2 className="account-card-title">Session</h2>
          <p className="account-note">
            Signing out clears your session cookie. You can sign back in any time —
            your data stays put.
          </p>
          <div className="account-actions">
            <SignOutButton className="btn btn-outline" />
          </div>
        </section>
      </div>
    </main>
  );
}
