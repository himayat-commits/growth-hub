"use client";

import * as React from "react";
import { useWizard } from "@/components/wizard/WizardContext";
import { Button } from "@/components/ui/button";
import { SectionLabel } from "@/components/ui/card";
import { Save } from "lucide-react";
import type { StepKey } from "@/lib/wizard/state";

export function StepShell({
  stepKey,
  title,
  blurb,
  eyebrow,
  children,
  onContinue,
  continueDisabled,
  continueLabel = "Continue",
}: {
  stepKey: StepKey;
  title: string;
  blurb: string;
  /** Optional small label above the title — defaults to step name */
  eyebrow?: string;
  children: React.ReactNode;
  onContinue?: () => void | Promise<void>;
  continueDisabled?: boolean;
  continueLabel?: string;
}) {
  const { goPrev, saveAndExit, saving } = useWizard();
  const [busy, setBusy] = React.useState(false);

  const handleContinue = async () => {
    if (!onContinue) return;
    setBusy(true);
    try {
      await onContinue();
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex flex-col min-h-[calc(100vh-3.5rem)]">
      <div className="flex-1 max-w-3xl mx-auto w-full px-6 md:px-10 py-12 md:py-16">
        {eyebrow ? <SectionLabel>{eyebrow}</SectionLabel> : null}
        <h1 className="font-serif text-4xl md:text-5xl font-normal text-teal mt-4 tracking-tight leading-[1.05]">
          {title}
        </h1>
        <p className="mt-4 text-base md:text-lg text-ink-muted leading-relaxed max-w-2xl">
          {blurb}
        </p>
        <div className="mt-10">{children}</div>
      </div>

      <footer className="sticky bottom-0 bg-eggshell/95 backdrop-blur-md border-t border-line z-10">
        <div className="max-w-3xl mx-auto w-full px-6 md:px-10 py-4 flex items-center justify-between gap-3">
          <Button variant="ghost" onClick={() => goPrev(stepKey)}>
            ← Back
          </Button>
          <div className="flex items-center gap-3">
            <span className="font-sans text-xs text-ink-muted hidden sm:inline">
              {saving ? "Saving…" : "Saved"}
            </span>
            <Button variant="outline" onClick={saveAndExit}>
              <Save className="h-4 w-4" />
              Save &amp; exit
            </Button>
            <Button onClick={handleContinue} disabled={continueDisabled || busy}>
              {continueLabel} →
            </Button>
          </div>
        </div>
      </footer>
    </div>
  );
}
