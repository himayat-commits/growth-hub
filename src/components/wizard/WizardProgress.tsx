"use client";

import * as React from "react";
import { cn } from "@/lib/cn";
import { useWizard } from "@/components/wizard/WizardContext";
import { stepsFor } from "@/lib/wizard/state";
import type { StepKey } from "@/lib/wizard/state";

// Slim segmented progress bar + "Step N of M" counter. Mirrors the dashboard
// .gh-progress language (teal fill, lime accent) in segmented form, and is
// automatically mode-aware: 7 segments for the free report flow, 12–13 for
// the paid provisioning flow depending on package.
export function WizardProgress({ currentKey }: { currentKey: StepKey }) {
  const { state, mode } = useWizard();
  const steps = stepsFor(mode, state.packageId);
  const idx = steps.findIndex((s) => s.key === currentKey);
  if (idx === -1) return null;

  return (
    <div
      className="flex items-center gap-3"
      role="progressbar"
      aria-valuemin={1}
      aria-valuemax={steps.length}
      aria-valuenow={idx + 1}
      aria-label={`Step ${idx + 1} of ${steps.length}: ${steps[idx].title}`}
    >
      <div className="flex flex-1 gap-1">
        {steps.map((s, i) => (
          <span
            key={s.key}
            title={s.title}
            className={cn(
              "h-1.5 flex-1 rounded-full transition-colors duration-300",
              i < idx && "bg-teal",
              i === idx && "bg-lime ring-1 ring-inset ring-teal/30",
              i > idx && "bg-teal/10"
            )}
          />
        ))}
      </div>
      <span className="whitespace-nowrap font-sans text-xs tabular-nums text-ink-muted">
        Step <b className="font-semibold text-teal">{idx + 1}</b> of {steps.length}
      </span>
    </div>
  );
}
