// Tolerant parsing for wizard state read back from JSONB. The schema evolves
// (new provisioning fields, new steps) while old onboarding_states rows stay
// as-written, and several top-level objects have no zod defaults — so a bare
// safeParse of a drifted row fails. Healing = deep-merge the raw row onto a
// fresh initial state, then re-validate. Never throws: the wizard must always
// render.

import * as Sentry from "@sentry/nextjs";
import { wizardStateSchema, type WizardState } from "@/lib/wizard/state";
import { createInitialState } from "@/lib/wizard/initial-state";
import type { PackageId } from "@/lib/wizard/packages";

export type StateFallback = {
  onboardingId: string;
  packageId: PackageId;
  email: string;
};

function isPlainObject(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

/** Recursive plain-object merge; arrays and scalars replace wholesale (a
 *  drifted `hours.weekly` must stay intact or be replaced whole to satisfy
 *  its `.length(7)` constraint — element-wise merging would corrupt it). */
function deepMerge(
  base: Record<string, unknown>,
  patch: Record<string, unknown>
): Record<string, unknown> {
  const out: Record<string, unknown> = { ...base };
  for (const [key, value] of Object.entries(patch)) {
    if (value === undefined) continue;
    const existing = out[key];
    if (isPlainObject(existing) && isPlainObject(value)) {
      out[key] = deepMerge(existing, value);
    } else {
      out[key] = value;
    }
  }
  return out;
}

export function parseWizardState(
  raw: unknown,
  fallback: StateFallback
): WizardState {
  // Fast path — zero behaviour change for healthy rows.
  const direct = wizardStateSchema.safeParse(raw);
  if (direct.success) return direct.data;

  // Heal: merge the raw row onto a fresh initial state and re-validate.
  if (isPlainObject(raw)) {
    const healed = wizardStateSchema.safeParse(
      deepMerge(
        createInitialState(fallback) as unknown as Record<string, unknown>,
        raw
      )
    );
    if (healed.success) {
      Sentry.captureMessage("wizard state healed on load", {
        level: "warning",
        tags: { area: "wizard" },
        // Issue paths only — state contains PII.
        extra: {
          onboardingId: fallback.onboardingId,
          issues: direct.error.issues.slice(0, 20).map((i) => i.path.join(".")),
        },
      });
      return healed.data;
    }
  }

  Sentry.captureMessage("wizard state unrecoverable — reset to initial", {
    level: "error",
    tags: { area: "wizard" },
    extra: { onboardingId: fallback.onboardingId },
  });
  return createInitialState(fallback);
}
