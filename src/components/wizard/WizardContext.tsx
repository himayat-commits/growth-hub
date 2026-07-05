"use client";

// Client-side wizard context. Loads state once on mount, mirrors edits to
// localStorage immediately, and PUTs them to the server (debounced) so
// reload/resume works either way.

import * as React from "react";
import { useRouter } from "next/navigation";
import type { WizardState, StepKey, WizardMode } from "@/lib/wizard/state";
import { stepsFor, wizardStateSchema } from "@/lib/wizard/state";
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
  serverHasRow = true,
  children,
}: {
  initialState: WizardState;
  /** Drives which steps the wizard walks. `report` (free users) uses the
   *  focused subset ending at `action-plan`; `provision` (paid) is the full
   *  flow ending at `review`. */
  mode?: WizardMode;
  /** Whether a persisted onboarding_states row backed `initialState`. When
   *  false, `initialState` is a seconds-old blank and any localStorage
   *  snapshot is the user's only data (e.g. the debounced PUT never landed)
   *  — adopt it unconditionally. */
  serverHasRow?: boolean;
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
        // Normalise through the schema: fills defaulted blocks a hand-rolled
        // or legacy snapshot may lack (e.g. `provisioning`) and rejects
        // shape-drifted snapshots outright instead of letting them crash a
        // step page mid-render.
        const result = wizardStateSchema.safeParse(JSON.parse(raw));
        if (result.success) {
          const parsed = result.data;
          if (parsed.onboardingId === initialState.onboardingId) {
            if (!serverHasRow) {
              // No persisted row — the local snapshot is the only copy of
              // the user's answers. Adopt it wholesale (it re-persists via
              // the next debounced PUT).
              _setState(parsed);
            } else if (
              Date.parse(parsed.updatedAt ?? "") >
              Date.parse(initialState.updatedAt ?? "")
            ) {
              // Adopt the local snapshot only when it's genuinely newer than
              // what the server hydrated (stale tabs / other devices must
              // not win), and NEVER let it override the provisioning block —
              // the runner writes that server-side, and a stale local copy
              // replayed through the next debounced PUT would clobber
              // businessNumber/runStatus.
              _setState({
                ...parsed,
                status: initialState.status,
                provisioning: initialState.provisioning,
              });
            }
          }
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
      // Stamp recency on every edit — the localStorage-vs-server adoption
      // guard on mount compares state.updatedAt, so an unstamped write
      // would make genuinely-newer local snapshots undetectable.
      const stamped = { ...next, updatedAt: new Date().toISOString() };
      _setState(stamped);
      void persist(stamped);
    },
    [persist]
  );

  const patch = React.useCallback(
    (mutate: (s: WizardState) => WizardState, options?: PatchOptions): Promise<void> => {
      // Compute next state outside of _setState so we can return a Promise
      // that resolves once persist() completes. We then commit via _setState.
      let next: WizardState | null = null;
      _setState((curr) => {
        next = { ...mutate(curr), updatedAt: new Date().toISOString() };
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
