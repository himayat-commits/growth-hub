import Link from "next/link";
import { redirect } from "next/navigation";
import type Stripe from "stripe";
import { withAuth } from "@/lib/auth/with-auth";
import { getStripe } from "@/lib/stripe";
import { syncSubscription } from "@/lib/stripe/sync-subscription";
import { getSubscription, isActive } from "@/lib/subscription";
import { loadOnboardingState } from "@/lib/wizard/provisioning-store";
import { wizardProgress } from "@/lib/wizard/initial-state";
import { PACKAGES, type PackageId } from "@/lib/wizard/packages";
import TrackOnMount from "@/components/TrackOnMount";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { InlineNotice } from "@/components/ui/notice";

// Post-checkout bridge. Stripe's success_url lands here with the checkout
// session id, and we sync that session's subscription BEFORE reading any
// subscription state — so the user never flashes as "free" while the
// webhook is still in flight. The sync is idempotent; the webhook rewrites
// the same canonical state whenever it arrives.

export default async function UpgradedPage({
  searchParams,
}: {
  searchParams: Promise<{ session_id?: string }>;
}) {
  const { user } = await withAuth();
  if (!user) {
    redirect("/sign-in?redirect_url=" + encodeURIComponent("/onboarding/upgraded"));
  }

  const { session_id: sessionId } = await searchParams;

  // Stripe failures here must never block the page — the webhook is the
  // safety net. redirect() throws, so ownership checks live outside the try.
  let session: Stripe.Checkout.Session | null = null;
  if (sessionId) {
    try {
      session = await getStripe().checkout.sessions.retrieve(sessionId);
    } catch {
      session = null;
    }
  }
  if (session) {
    if (session.metadata?.userId !== user.id) {
      redirect("/onboarding");
    }
    const subscriptionId =
      typeof session.subscription === "string"
        ? session.subscription
        : (session.subscription?.id ?? null);
    if (subscriptionId) {
      try {
        await syncSubscription(subscriptionId);
      } catch {
        // Webhook retries converge the row.
      }
    }
  }

  const sub = await getSubscription(user.id);
  const state = await loadOnboardingState(user.id);

  if (state?.provisioning.businessNumber && state.provisioning.runStatus === "provisioned") {
    redirect("/onboarding/done");
  }

  const packageId = (sub?.planTier as PackageId | null) ?? "foundations";
  const planDef = sub?.planTier ? PACKAGES[sub.planTier as PackageId] : undefined;

  const { done, total, next, nextIndex, steps } = wizardProgress(state, "provision", packageId);
  const ctaHref = next ? `/onboarding/${next.key}` : "/onboarding/review";
  const ctaLabel = next ? `Continue — step ${nextIndex} of ${steps.length}` : "Review & launch";

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-4 pt-2 pb-12 md:px-6 md:pt-4">
      <TrackOnMount
        event="checkout_success_return"
        properties={{ tier: sub?.planTier ?? "unknown" }}
      />
      <PageHeader
        kicker="Welcome aboard"
        title={`You're on ${planDef?.name ?? "your new plan"}`}
        sub={
          done > 0
            ? `${done} of ${total} setup steps already complete — finish the remaining ${total - done} and we'll set up your Birdeye account.`
            : "A few quick questions, then we set up your Birdeye account for you."
        }
      />

      {!isActive(sub) ? (
        <InlineNotice tone="info" title="Activating your plan…">
          Your payment went through and Stripe is finalising the subscription.
          This usually takes a few seconds — you can start your setup right away.
        </InlineNotice>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">What happens next</CardTitle>
        </CardHeader>
        <CardContent>
          <ol className="list-decimal space-y-3 pl-4 text-sm leading-relaxed">
            <li>
              <strong>Finish the setup steps.</strong> Business details, hours,
              photos — everything Birdeye needs to represent you properly.
            </li>
            <li>
              <strong>Review &amp; launch.</strong> Check it all over on one
              page, then submit.
            </li>
            <li>
              <strong>Your Birdeye account goes live.</strong> We provision it
              for you and email your admin invite.
            </li>
          </ol>
        </CardContent>
        <CardFooter>
          <Link href={ctaHref}>
            <Button variant="lime">{ctaLabel}</Button>
          </Link>
          <Link href="/dashboard">
            <Button variant="ghost">Go to dashboard</Button>
          </Link>
        </CardFooter>
      </Card>
    </div>
  );
}
