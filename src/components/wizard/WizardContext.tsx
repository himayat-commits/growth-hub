"use client";

// Client-side wizard context. Loads state once on mount, mirrors edits to
// localStorage immediately, and PUTs them to the server (debounced) so
// reload/resume works either way.

import * as React from "react";
import { useRouter } from "next/navigation";
import type { WizardState, StepKey, WizardMode } from "@/lib/wizard/state";
import { stepsFor } from "@/lib/wizard/state";
import { isStepComplete } from "@/lib/wizard/initial-state";

type PatchOptions = {
  /** If true, bypass the 600ms debounce and PUT this state to the server
   *  immediately. The returned Promise resolves when the PUT lands. Use
   *  for "must be persisted before we navigate" moments — e.g. after the
   *  SSE provisioning "done" event. */
  immediate?: boolean;
};

type Ctx = {
  state: WizardState;
  mode: WizardMode;
  setState: (next: WizardState) => void;
  patch: (mutate: (s: WizardState) => WizardState, options?: PatchOptions) => Promise<void>;
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
  mode = "provision",
  children,
}: {
  initialState: WizardState;
  /** Drives which steps the wizard walks. `report` (free users) uses the
   *  focused subset ending at `action-plan`; `provision` (paid) is the full
   *  flow ending at `review`. */
  mode?: WizardMode;
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
        // Adopt the local snapshot only when it's genuinely newer than what
        // the server hydrated (stale tabs / other devices must not win), and
        // NEVER let it override the provisioning block — the runner writes
        // that server-side, and a stale local copy replayed through the next
        // debounced PUT would clobber businessNumber/runStatus.
        if (
          parsed.onboardingId === initialState.onboardingId &&
          Date.parse(parsed.updatedAt ?? "") > Date.parse(initialState.updatedAt ?? "")
        ) {
          _setState({
            ...parsed,
            status: initialState.status,
            provisioning: initialState.provisioning,
          });
        }
      }
    } catch {
      /* ignore */
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const putImmediate = React.useCallback(async (next: WizardState) => {
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
  }, []);

  const persist = React.useCallback(
    (next: WizardState, options?: PatchOptions): Promise<void> => {
      try {
        localStorage.setItem(lsKey, JSON.stringify(next));
      } catch {
        /* quota — ignore */
      }
      if (saveTimer.current) {
        clearTimeout(saveTimer.current);
        saveTimer.current = null;
      }
      if (options?.immediate) {
        return putImmediate(next);
      }
      saveTimer.current = setTimeout(() => {
        void putImmediate(next);
      }, 600);
      return Promise.resolve();
    },
    [lsKey, putImmediate]
  );

  const setState = React.useCallback(
    (next: WizardState) => {
      _setState(next);
      void persist(next);
    },
    [persist]
  );

  const patch = React.useCallback(
    (mutate: (s: WizardState) => WizardState, options?: PatchOptions): Promise<void> => {
      // Compute next state outside of _setState so we can return a Promise
      // that resolves once persist() completes. We then commit via _setState.
      let next: WizardState | null = null;
      _setState((curr) => {
        next = mutate(curr);
        return next;
      });
      if (next) return persist(next, options);
      return Promise.resolve();
    },
    [persist]
  );

  const steps = stepsFor(mode, state.packageId);
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
    if (saveTimer.current) {
      clearTimeout(saveTimer.current);
      saveTimer.current = null;
    }
    await putImmediate(state);
    router.push("/dashboard");
  }, [putImmediate, router, state]);

  const value: Ctx = { state, mode, setState, patch, goNext, goPrev, saveAndExit, saving };
  return <WizardCtx.Provider value={value}>{children}</WizardCtx.Provider>;
}

export function useStepCompletion() {
  const { state, mode } = useWizard();
  const steps = stepsFor(mode, state.packageId);
  return steps.map((s) => ({ ...s, complete: isStepComplete(state, s.key) }));
}
