"use client";

import * as React from "react";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Pill,
  SectionLabel,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/brand/Logo";
import { CheckCircle2, ExternalLink, Sparkles } from "lucide-react";
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
    <main className="min-h-screen">
      <header className="bg-eggshell/85 border-b border-teal/10 backdrop-blur-md">
        <div className="max-w-4xl mx-auto px-6 py-5 flex items-center justify-between">
          <Logo />
          {isPartial ? (
            <Pill tone="amber">Action needed</Pill>
          ) : (
            <Pill tone="lime">✓ Provisioned</Pill>
          )}
        </div>
      </header>

      <section className="max-w-4xl mx-auto px-6 py-12 md:py-16">
        <SectionLabel>Onboarding complete</SectionLabel>
        <h1 className="font-serif text-section text-teal mt-4 leading-[1.05]">
          You&apos;re{" "}
          <em className="not-italic text-plum font-serif">live.</em>
        </h1>
        <p className="mt-5 text-ink-muted max-w-2xl text-lg leading-relaxed">
          Your Birdeye sub-account is provisioned. Here&apos;s what we did, and
          what to do next.
        </p>

        {isPartial ? (
          <div className="mt-5 rounded-xl border border-plum/30 bg-plum/[0.04] px-4 py-3 text-sm text-plum leading-relaxed max-w-2xl">
            <strong className="font-semibold">A few steps didn&apos;t finish.</strong>{" "}
            Your account is live, but the steps marked below need a retry. Head to{" "}
            <Link href="/services" className="underline underline-offset-2">
              Services
            </Link>{" "}
            and click <em className="not-italic font-semibold">Resume / retry</em>, or email{" "}
            <a href="mailto:hello@himayat.com.au" className="underline underline-offset-2">
              hello@himayat.com.au
            </a>
            .
          </div>
        ) : null}

        <Card className="mt-9">
          <CardHeader>
            <CardTitle className="font-serif text-2xl flex items-center gap-2.5">
              <Sparkles className="h-5 w-5 text-plum" />
              Provisioning checklist
            </CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3.5">
            {checklist.map((c) => (
              <div key={c.label} className="flex items-start gap-3">
                <CheckCircle2
                  className={
                    c.ok
                      ? "h-4 w-4 mt-1 text-teal flex-shrink-0"
                      : "h-4 w-4 mt-1 text-ink-muted/50 flex-shrink-0"
                  }
                />
                <div>
                  <div className="font-sans text-sm font-medium text-teal">
                    {c.label}
                  </div>
                  {c.detail ? (
                    <div className="font-sans text-xs text-ink-muted mt-0.5">
                      {c.detail}
                    </div>
                  ) : null}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="font-serif text-2xl">What to do next</CardTitle>
          </CardHeader>
          <CardContent>
            <ol className="space-y-3.5 text-base leading-relaxed">
              <li>
                <strong>Check your email.</strong> We&apos;ve sent a Birdeye
                admin invite to {adminEmail}. Click through to set your password.
              </li>
              <li>
                <strong>Open your Birdeye dashboard</strong> using the button
                below. Your business number is{" "}
                <code className="font-sans text-xs bg-eggshell-warm px-1.5 py-0.5 rounded text-teal">
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
                  className="text-plum hover:underline underline-offset-4"
                >
                  Need to update something later?
                </Link>
              </li>
            </ol>
            <div className="mt-7 flex flex-wrap gap-3">
              <Link href={dashboardUrl} target="_blank">
                <Button variant="lime" size="lg">
                  <ExternalLink className="h-4 w-4" />
                  Open Birdeye dashboard
                </Button>
              </Link>
              {pkg.id !== "foundations" ? (
                <Link href={qrHref} target="_blank">
                  <Button variant="outline" size="lg">
                    Download review QR PDF
                  </Button>
                </Link>
              ) : null}
              <Link href="/portal">
                <Button variant="ghost" size="lg">Back to portal</Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        {pkg.id === "accelerate" ? (
          <Card className="mt-6">
            <CardHeader>
              <CardTitle className="font-serif text-2xl">
                Webchat embed snippet
              </CardTitle>
              <p className="text-sm text-ink-muted mt-2 leading-relaxed">
                Add this to the <code className="font-sans text-xs">&lt;head&gt;</code> of
                every page where the chat should appear. Your partner will activate
                the Webchat AI module in billing — once that&apos;s done, this snippet
                starts working automatically.
              </p>
            </CardHeader>
            <CardContent>
              <pre className="json text-xs whitespace-pre-wrap break-all">
                {buildWebchatEmbedSnippet(businessNumber)}
              </pre>
            </CardContent>
          </Card>
        ) : null}
      </section>
    </main>
  );
}
