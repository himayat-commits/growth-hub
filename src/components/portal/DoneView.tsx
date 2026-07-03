"use client";

import * as React from "react";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
  Pill,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { InlineNotice } from "@/components/ui/notice";
import { CodeBlock } from "@/components/ui/code-block";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { Check, ExternalLink } from "lucide-react";
import { cn } from "@/lib/cn";
import { PACKAGES, type PackageId } from "@/lib/wizard/packages";
import { buildWebchatEmbedSnippet } from "@/lib/birdeye/payloads";
import type { WizardState } from "@/lib/wizard/state";

export function DoneView({
  onboardingId,
  packageId,
  serverState,
  dashboardUrl = "https://app.birdeye.com",
}: {
  onboardingId: string;
  packageId: PackageId;
  /** Server-authoritative wizard state. When present it wins over the
   *  localStorage fallback (reliable cross-device + after a resume). */
  serverState?: WizardState;
  /** Resolved Birdeye dashboard deep-link. */
  dashboardUrl?: string;
}) {
  const [state, setState] = React.useState<WizardState | null>(serverState ?? null);
  React.useEffect(() => {
    if (serverState) return; // server data wins — skip localStorage
    try {
      const raw = localStorage.getItem(`gh_wizard_${onboardingId}`);
      if (raw) {
        const parsed = JSON.parse(raw) as WizardState;
        if (parsed.onboardingId === onboardingId) setState(parsed);
      }
    } catch {
      /* ignore */
    }
  }, [onboardingId, serverState]);

  const pkg = PACKAGES[packageId];
  const businessNumber = state?.provisioning.businessNumber ?? "—";
  const adminEmail = state?.adminUser.email ?? "";
  const invitedUsers = state?.provisioning.invitedUsers ?? [];
  const mediaCount = state?.provisioning.mediaIds.length ?? 0;
  const faqCount = state?.faqs.length ?? 0;
  const contactCount = state?.contacts.length ?? 0;
  const businessName = state?.business.name;

  // On a partial run, mark the steps that actually failed as not-ok.
  const failedKinds = new Set((state?.provisioning.failedSteps ?? []).map((f) => f.kind));
  const isPartial = state?.provisioning.runStatus === "partial";
  // Past the retry ceiling ops owns the remaining steps — no retry ask.
  const isEscalated = isPartial && Boolean(state?.provisioning.escalatedAt);

  const checklist: { label: string; ok: boolean; detail?: string }[] = [
    {
      label: "Business created",
      ok: !!state?.provisioning.businessNumber,
      detail: businessNumber,
    },
    { label: "Admin invite sent", ok: true, detail: adminEmail },
    {
      label: "Additional users invited",
      ok: invitedUsers.length > 0 && !failedKinds.has("create_user"),
      detail: invitedUsers.join(", ") || "none",
    },
    {
      label: "Listings populated",
      ok: !failedKinds.has("update_business"),
      detail: "Google + Facebook + Microsite",
    },
    {
      label: "Media uploaded",
      ok: mediaCount > 0 && !failedKinds.has("add_media"),
      detail: `${mediaCount} items`,
    },
    {
      label: "FAQs loaded",
      ok: true,
      detail: `6 default + ${faqCount} custom`,
    },
    {
      label: "Default review sources set",
      ok: !failedKinds.has("default_review_sources"),
      detail: "Google · Facebook",
    },
    {
      label: "Initial contacts uploaded",
      ok: contactCount > 0 && !failedKinds.has("save_contact"),
      detail: `${contactCount} contacts`,
    },
    ...(pkg.id === "accelerate"
      ? [{ label: "Webchat embed ready", ok: true, detail: "Snippet below" }]
      : []),
    {
      label: "Modules activated",
      ok: true,
      detail: `${pkg.modules.join(", ")} (your partner activates these in billing)`,
    },
  ];

  const qrHref = businessName
    ? `/api/review-qr-pdf?title=${encodeURIComponent(businessName)}`
    : "/api/review-qr-pdf";

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-6 px-4 pt-2 pb-12 md:px-6 md:pt-4">
      <PageHeader
        kicker="You're live"
        title={businessName ? `${businessName} is on Birdeye` : "Your Birdeye account is live"}
        sub="Your account is provisioned. Here's what we set up, and what to do next."
        actions={
          isEscalated ? (
            <Pill tone="teal">We&apos;re on it</Pill>
          ) : isPartial ? (
            <Pill tone="red">Action needed</Pill>
          ) : (
            <Pill tone="lime">Provisioned</Pill>
          )
        }
      />

      {isEscalated ? (
        <InlineNotice tone="info" title="Our team is finishing your setup.">
          Your account is live; we&apos;re completing the last{" "}
          {state?.provisioning.failedSteps?.length ?? "few"} setup step
          {(state?.provisioning.failedSteps?.length ?? 2) === 1 ? "" : "s"} for
          you — no action needed. We&apos;ll notify you when it&apos;s done, or
          email{" "}
          <a href="mailto:hello@himayat.com.au" className="underline underline-offset-2">
            hello@himayat.com.au
          </a>{" "}
          with questions.
        </InlineNotice>
      ) : isPartial ? (
        <InlineNotice tone="warning" title="A few steps didn't finish.">
          Your account is live, but the steps marked below need a retry. Head to{" "}
          <Link href="/services" className="underline underline-offset-2">
            Services
          </Link>{" "}
          and click <em className="not-italic font-semibold">Resume / retry</em>, or email{" "}
          <a href="mailto:hello@himayat.com.au" className="underline underline-offset-2">
            hello@himayat.com.au
          </a>
          .
        </InlineNotice>
      ) : null}

      <div className="grid gap-5 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Provisioning checklist</CardTitle>
          </CardHeader>
          <CardContent className="pt-2">
            {checklist.map((c) => (
              <div
                key={c.label}
                className="grid grid-cols-[24px_1fr] items-start gap-3 border-t border-line py-3 first:border-0"
              >
                <span
                  className={cn(
                    "mt-0.5 flex h-[22px] w-[22px] items-center justify-center rounded-full border-[1.5px]",
                    c.ok
                      ? "border-teal bg-teal text-white"
                      : "border-ink-muted/30 bg-white"
                  )}
                >
                  {c.ok ? <Check className="h-3 w-3" /> : null}
                </span>
                <div>
                  <div className="font-sans text-sm font-medium text-ink">
                    {c.label}
                  </div>
                  {c.detail ? (
                    <div className="mt-0.5 font-sans text-xs text-ink-muted">
                      {c.detail}
                    </div>
                  ) : null}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="self-start">
          <CardHeader>
            <CardTitle className="text-base">What to do next</CardTitle>
          </CardHeader>
          <CardContent>
            <ol className="list-decimal space-y-3 pl-4 text-sm leading-relaxed">
              <li>
                <strong>Check your email.</strong> We&apos;ve sent a Birdeye
                admin invite to {adminEmail}. Click through to set your password.
              </li>
              <li>
                <strong>Open your Birdeye dashboard</strong> using the button
                below. Your business number is{" "}
                <code className="rounded bg-eggshell-warm px-1.5 py-0.5 font-sans text-xs text-teal">
                  {businessNumber}
                </code>
                .
              </li>
              {pkg.id !== "foundations" ? (
                <li>
                  <strong>Print your review QR kit.</strong> Pop it on the
                  counter, in your invoice footer, or hand it to customers
                  post-service.
                </li>
              ) : null}
              {pkg.id === "accelerate" ? (
                <li>
                  <strong>Paste the webchat snippet</strong> into your
                  website&apos;s <code className="font-sans text-xs">&lt;head&gt;</code>.
                </li>
              ) : null}
              <li>
                <Link
                  href="/onboarding/update-later"
                  className="text-plum underline-offset-4 hover:underline"
                >
                  Need to update something later?
                </Link>
              </li>
            </ol>
          </CardContent>
          <CardFooter className="flex-wrap pt-5">
            <Link href={dashboardUrl} target="_blank">
              <Button variant="lime">
                <ExternalLink className="h-4 w-4" />
                Open Birdeye dashboard
              </Button>
            </Link>
            {pkg.id !== "foundations" ? (
              <Link href={qrHref} target="_blank">
                <Button variant="outline">Download review QR PDF</Button>
              </Link>
            ) : null}
            <Link href="/dashboard">
              <Button variant="ghost">Back to dashboard</Button>
            </Link>
          </CardFooter>
        </Card>
      </div>

      {pkg.id === "accelerate" ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Webchat embed snippet</CardTitle>
            <p className="mt-2 text-sm leading-relaxed text-ink-muted">
              Add this to the <code className="font-sans text-xs">&lt;head&gt;</code> of
              every page where the chat should appear. Your partner will activate
              the Webchat AI module in billing — once that&apos;s done, this snippet
              starts working automatically.
            </p>
          </CardHeader>
          <CardContent>
            <CodeBlock>{buildWebchatEmbedSnippet(businessNumber)}</CodeBlock>
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
