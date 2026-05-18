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
import { ProgressCard } from "@/components/portal/ProgressCard";
import {
  CalendarCheck,
  BookOpen,
  MessageCircle,
  ExternalLink,
} from "lucide-react";
import { isStepComplete } from "@/lib/wizard/initial-state";
import {
  stepsForPackage,
  type WizardState,
} from "@/lib/wizard/state";
import { PACKAGES, type PackageId } from "@/lib/wizard/packages";
import { buildWebchatEmbedSnippet } from "@/lib/birdeye/payloads";

// Reads canonical wizard state from localStorage on mount. Until that
// hydration completes we render an empty checklist (no flash of wrong
// data) — typical for client-only state on Vercel.

export function PortalView({
  onboardingId,
  packageId,
  email,
}: {
  onboardingId: string;
  packageId: PackageId;
  email?: string;
}) {
  const [state, setState] = React.useState<WizardState | null>(null);
  React.useEffect(() => {
    try {
      const raw = localStorage.getItem(`gh_wizard_${onboardingId}`);
      if (raw) {
        const parsed = JSON.parse(raw) as WizardState;
        if (parsed.onboardingId === onboardingId) setState(parsed);
      }
    } catch {
      /* ignore */
    }
  }, [onboardingId]);

  const pkg = PACKAGES[packageId];
  const steps = stepsForPackage(packageId);
  const completed: Record<string, boolean> = {};
  for (const s of steps) {
    completed[s.key] = state ? isStepComplete(state, s.key) : false;
  }

  const provisioned = state?.status === "provisioned";
  const businessNumber = state?.provisioning.businessNumber;

  const firstIncomplete =
    steps.find((s) => s.key !== "review" && !completed[s.key])?.key ?? "review";
  const resumeHref = `/onboarding/${firstIncomplete}`;

  return (
    <main className="min-h-screen">
      <header className="bg-eggshell/85 border-b border-teal/10 backdrop-blur-md sticky top-0 z-30">
        <div className="max-w-5xl mx-auto px-6 py-5 flex items-center justify-between">
          <Logo />
          <div className="flex items-center gap-3">
            <Pill tone="teal">{pkg.name}</Pill>
            <span className="font-sans text-sm text-ink-muted hidden md:inline">
              {email}
            </span>
          </div>
        </div>
      </header>

      <section className="max-w-5xl mx-auto px-6 py-12 grid gap-6">
        {!provisioned ? (
          <Card>
            <CardHeader>
              <SectionLabel>Welcome</SectionLabel>
              <CardTitle className="font-serif text-4xl mt-3 leading-tight">
                You&apos;re in. Let&apos;s get your{" "}
                <em className="not-italic text-plum font-serif">Birdeye account</em>{" "}
                set up.
              </CardTitle>
              <p className="mt-4 text-ink-muted leading-relaxed max-w-2xl">
                The wizard takes about 15 minutes. You can save and come back any
                time &mdash; we&apos;ll resume right where you left off.
              </p>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-sans text-sm text-ink-muted mr-2">
                  Your package includes:
                </span>
                {pkg.modules.map((m) => (
                  <Pill key={m}>{m}</Pill>
                ))}
              </div>
            </CardContent>
          </Card>
        ) : (
          <ProvisionedSummary
            businessNumber={businessNumber!}
            packageId={packageId}
            email={email}
            invitedUsers={state?.provisioning.invitedUsers ?? []}
            businessName={state?.business.name}
          />
        )}

        <ProgressCard
          steps={steps}
          completed={completed}
          resumeHref={resumeHref}
          totalSteps={steps.length}
        />

        <div className="grid gap-4 md:grid-cols-3">
          <SecondaryCard
            icon={<CalendarCheck className="h-5 w-5" />}
            title="Book your strategy call"
            body="A 30-min call with your Growth Hub partner to plan the first 90 days."
          />
          <SecondaryCard
            icon={<BookOpen className="h-5 w-5" />}
            title="Read the Growth Framework"
            body="Our playbook for compounding visibility, reviews and revenue."
          />
          <SecondaryCard
            icon={<MessageCircle className="h-5 w-5" />}
            title="Contact your partner"
            body="Stuck or unsure? Send a quick note — we'll come back inside a working day."
          />
        </div>
      </section>
    </main>
  );
}

function SecondaryCard({
  icon,
  title,
  body,
}: {
  icon: React.ReactNode;
  title: string;
  body: string;
}) {
  return (
    <Card className="hover:-translate-y-0.5 hover:shadow-card transition-all cursor-pointer">
      <CardContent className="pt-7">
        <div className="inline-flex items-center justify-center h-9 w-9 rounded-full bg-lime text-teal">
          {icon}
        </div>
        <h4 className="mt-4 font-serif text-lg text-teal">{title}</h4>
        <p className="mt-2 text-sm text-ink-muted leading-relaxed">{body}</p>
      </CardContent>
    </Card>
  );
}

function ProvisionedSummary({
  businessNumber,
  packageId,
  email,
  invitedUsers,
  businessName,
}: {
  businessNumber: string;
  packageId: PackageId;
  email?: string;
  invitedUsers: string[];
  businessName?: string;
}) {
  const embed = buildWebchatEmbedSnippet(businessNumber);
  const qrHref = businessName
    ? `/api/review-qr-pdf?title=${encodeURIComponent(businessName)}`
    : "/api/review-qr-pdf";
  return (
    <Card>
      <CardHeader>
        <Pill tone="lime">✓ Provisioning complete</Pill>
        <CardTitle className="font-serif text-4xl mt-3 leading-tight">
          Your Birdeye account is{" "}
          <em className="not-italic text-plum font-serif">ready.</em>
        </CardTitle>
        <p className="mt-4 text-ink-muted leading-relaxed">
          Provisioned business number{" "}
          <code className="font-sans bg-eggshell-warm px-2 py-0.5 rounded text-teal">
            {businessNumber}
          </code>
          . Invites sent to{" "}
          <strong>{[email, ...invitedUsers].filter(Boolean).join(", ")}</strong>.
        </p>
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap gap-3">
          <Link href="https://app.birdeye.com" target="_blank">
            <Button size="lg" variant="lime">
              <ExternalLink className="h-4 w-4" />
              Open my Birdeye dashboard
            </Button>
          </Link>
          {packageId !== "foundations" ? (
            <Link href={qrHref} target="_blank">
              <Button size="lg" variant="outline">
                Download review QR PDF
              </Button>
            </Link>
          ) : null}
        </div>
        {packageId === "accelerate" ? (
          <div className="mt-7">
            <SectionLabel>Webchat embed</SectionLabel>
            <pre className="json mt-3 text-xs whitespace-pre-wrap break-all">
              {embed}
            </pre>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
