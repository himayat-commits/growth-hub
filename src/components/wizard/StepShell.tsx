"use client";

import * as React from "react";
import { ArrowLeft, ArrowRight, Check, Save } from "lucide-react";
import { useWizard, useStepCompletion } from "@/components/wizard/WizardContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, Pill } from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { WizardProgress } from "@/components/wizard/WizardProgress";
import { REPORT_COPY } from "@/lib/wizard/state";
import { track } from "@/lib/analytics";
import type { StepKey } from "@/lib/wizard/state";

export function StepShell({
  stepKey,
  title,
  blurb,
  badge,
  framed = true,
  children,
  onContinue,
  continueDisabled,
  continueLabel = "Continue",
  continueVariant = "primary",
  locked = false,
}: {
  stepKey: StepKey;
  title: string;
  blurb: string;
  /** Optional Pill next to the title — "Optional", "Accelerate only", package name. */
  badge?: string;
  /** Wrap the step content in a Card (default). Pages that compose their own
   *  top-level white cards (confirm, faqs, assets) pass false to avoid
   *  double-carding. */
  framed?: boolean;
  children: React.ReactNode;
  onContinue?: () => void | Promise<void>;
  continueDisabled?: boolean;
  continueLabel?: string;
  continueVariant?: "primary" | "lime";
  /** Hide Back / Save & exit while a launch is in flight. */
  locked?: boolean;
}) {
  const { state, mode, goPrev, saveAndExit, saving } = useWizard();
  const completion = useStepCompletion();
  const [busy, setBusy] = React.useState(false);

  // Free users share these pages but never hear about Birdeye — report-mode
  // copy overrides win over what the page passed.
  const copy = mode === "report" ? REPORT_COPY[stepKey] : undefined;
  const resolvedTitle = copy?.title ?? title;
  const resolvedBlurb = copy?.blurb ?? blurb;

  const viewFired = React.useRef(false);
  React.useEffect(() => {
    if (viewFired.current) return;
    viewFired.current = true;
    const idx = completion.findIndex((s) => s.key === stepKey);
    const completedCount = completion.filter((s) => s.complete).length;
    track("onboarding_step_view", {
      step: stepKey,
      index: idx + 1,
      mode,
      package: state.packageId,
    });
    if (idx === 0 && completedCount === 0) {
      track("onboarding_wizard_start", { mode, package: state.packageId });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleContinue = async () => {
    if (!onContinue) return;
    setBusy(true);
    try {
      await onContinue();
      track("onboarding_step_complete", {
        step: stepKey,
        index: completion.findIndex((s) => s.key === stepKey) + 1,
        mode,
        package: state.packageId,
      });
    } finally {
      setBusy(false);
    }
  };

  // Rendered inside (app)/onboarding/layout.tsx → (app)/layout.tsx, so the
  // outer Sidebar+Topbar already exist. The footer is `position: sticky;
  // bottom: 0` so it pins to the bottom of the .gh-content scroll viewport
  // regardless of step length; its negative margins counter .gh-content's
  // 16/32px padding so the bar runs edge to edge like the Topbar.
  return (
    <div className="flex flex-col">
      <div className="mx-auto w-full max-w-3xl px-4 pt-2 pb-12 md:px-6 md:pt-4">
        <WizardProgress currentKey={stepKey} />
        <div className="mt-7">
          <PageHeader
            kicker={mode === "report" ? "Your growth snapshot" : "Birdeye setup"}
            title={resolvedTitle}
            sub={resolvedBlurb}
            actions={badge ? <Pill tone="teal">{badge}</Pill> : undefined}
          />
        </div>
        <div className="mt-7">
          {framed ? (
            <Card>
              <CardContent className="pt-6 md:p-7">{children}</CardContent>
            </Card>
          ) : (
            children
          )}
        </div>
      </div>

      <footer className="sticky bottom-0 z-10 -mx-4 border-t border-line bg-white/95 px-4 backdrop-blur md:-mx-8 md:px-8">
        <div className="mx-auto flex w-full max-w-3xl items-center justify-between gap-2 py-3">
          {!locked ? (
            <Button variant="ghost" onClick={() => goPrev(stepKey)}>
              <ArrowLeft className="h-4 w-4" />
              <span className="hidden sm:inline">Back</span>
            </Button>
          ) : (
            <span />
          )}
          <div className="flex items-center gap-2 sm:gap-3">
            <span
              className="hidden items-center gap-1.5 font-sans text-xs text-ink-muted sm:flex"
              aria-live="polite"
            >
              {saving ? (
                <>
                  <Spinner /> Saving…
                </>
              ) : (
                <>
                  <Check className="h-3.5 w-3.5 text-teal" /> Saved
                </>
              )}
            </span>
            {!locked ? (
              <Button variant="outline" onClick={saveAndExit}>
                <Save className="h-4 w-4" />
                <span className="hidden sm:inline">Save &amp; exit</span>
              </Button>
            ) : null}
            <Button
              variant={continueVariant}
              onClick={handleContinue}
              disabled={continueDisabled || busy}
            >
              {busy ? (
                <Spinner
                  className={
                    continueVariant === "primary"
                      ? "border-eggshell/30 border-t-eggshell"
                      : undefined
                  }
                />
              ) : null}
              {continueLabel}
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </footer>
    </div>
  );
}
