"use client";

// Client-side wizard context. Loads state once on mount, mirrors edits to
// localStorage immediately, and PUTs them to the server (debounced) so
// reload/resume works either way.

import * as React from "react";
import { useRouter } from "next/navigation";
import type { WizardState, StepKey } from "@/lib/wizard/state";
import { stepsForPackage } from "@/lib/wizard/state";
import { isStepComplete } from "@/lib/wizard/initial-state";

type Ctx = {
  state: WizardState;
  setState: (next: WizardState) => void;
  patch: (mutate: (s: WizardState) => WizardState) => void;
  goNext: (currentKey: StepKey) => void;
  goPrev: (currentKey: StepKey) => void;
  saveAndExit: () => Promise<void>;
  saving: boolean;
};

const WizardCtx = React.createContext<Ctx | null>(null);

export function useWizard() {
  const ctx = React.useContext(WizardCtx);
  if (!ctx) throw new Error("useWizard must be used inside <WizardProvider>");
  return ctx;
}

export function WizardProvider({
  initialState,
  children,
}: {
  initialState: WizardState;
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [state, _setState] = React.useState<WizardState>(initialState);
  const [saving, setSaving] = React.useState(false);
  const saveTimer = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const lsKey = `gh_wizard_${initialState.onboardingId}`;

  React.useEffect(() => {
    try {
      const raw = localStorage.getItem(lsKey);
      if (raw) {
        const parsed = JSON.parse(raw) as WizardState;
        if (parsed.onboardingId === initialState.onboardingId) _setState(parsed);
      }
    } catch {
      /* ignore */
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const persist = React.useCallback(
    (next: WizardState) => {
      try {
        localStorage.setItem(lsKey, JSON.stringify(next));
      } catch {
        /* quota — ignore */
      }
      if (saveTimer.current) clearTimeout(saveTimer.current);
      saveTimer.current = setTimeout(async () => {
        setSaving(true);
        try {
          await fetch(`/api/onboarding/${next.onboardingId}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(next),
          });
        } finally {
          setSaving(false);
        }
      }, 600);
    },
    [lsKey]
  );

  const setState = React.useCallback(
    (next: WizardState) => {
      _setState(next);
      persist(next);
    },
    [persist]
  );

  const patch = React.useCallback(
    (mutate: (s: WizardState) => WizardState) => {
      _setState((curr) => {
        const next = mutate(curr);
        persist(next);
        return next;
      });
    },
    [persist]
  );

  const steps = stepsForPackage(state.packageId);
  const goNext = React.useCallback(
    (currentKey: StepKey) => {
      const idx = steps.findIndex((s) => s.key === currentKey);
      const nextStep = steps[idx + 1];
      if (nextStep) router.push(`/onboarding/${nextStep.key}`);
    },
    [router, steps]
  );
  const goPrev = React.useCallback(
    (currentKey: StepKey) => {
      const idx = steps.findIndex((s) => s.key === currentKey);
      const prevStep = steps[idx - 1];
      if (prevStep) router.push(`/onboarding/${prevStep.key}`);
    },
    [router, steps]
  );

  const saveAndExit = React.useCallback(async () => {
    setSaving(true);
    try {
      await fetch(`/api/onboarding/${state.onboardingId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(state),
      });
      router.push("/portal");
    } finally {
      setSaving(false);
    }
  }, [router, state]);

  const value: Ctx = { state, setState, patch, goNext, goPrev, saveAndExit, saving };
  return <WizardCtx.Provider value={value}>{children}</WizardCtx.Provider>;
}

export function useStepCompletion() {
  const { state } = useWizard();
  const steps = stepsForPackage(state.packageId);
  return steps.map((s) => ({ ...s, complete: isStepComplete(state, s.key) }));
}
