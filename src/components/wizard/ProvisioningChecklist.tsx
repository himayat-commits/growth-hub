"use client";

import * as React from "react";
import { Check, X } from "lucide-react";
import { cn } from "@/lib/cn";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Pill,
} from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
import type { WizardState } from "@/lib/wizard/state";

// One SSE event from /api/provision. Kinds repeat for per-item steps
// (create_user once per team member, save_contact once per contact).
export type ProvisionEvent = {
  step: number;
  total: number;
  kind: string;
  label: string;
  status: "running" | "ok" | "error";
  response?: unknown;
  error?: string;
};

type PhaseStatus = "pending" | "running" | "ok" | "error";

type Phase = {
  kind: string;
  label: string;
  /** How many events of this kind a full run emits. */
  expected: number;
};

// The launch experience: every expected phase renders as pending the moment
// the user clicks Launch, then the SSE stream folds into per-phase statuses.
// Row anatomy mirrors the dashboard .gh-checklist (22px circles + Pill).
export function ProvisioningChecklist({
  state,
  events,
}: {
  state: WizardState;
  events: ProvisionEvent[];
}) {
  const phases = expectedPhases(state);
  // On a resume the runner skips create_subaccount entirely (the account
  // already exists), so no events of that kind ever arrive — show it done.
  // (Optional-chained: a legacy client snapshot may lack the block.)
  const resuming = Boolean(state.provisioning?.businessNumber);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Setting up your account</CardTitle>
        <CardDescription>
          Takes about a minute — keep this tab open.
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-2" aria-live="polite">
        {phases.map((phase) => {
          const phaseEvents = events.filter((e) => e.kind === phase.kind);
          const status: PhaseStatus =
            phase.kind === "create_subaccount" && resuming
              ? "ok"
              : phaseStatus(phase, phaseEvents);
          const okCount = phaseEvents.filter((e) => e.status === "ok").length;
          return (
            <div
              key={phase.kind}
              className="grid grid-cols-[24px_1fr_auto] items-center gap-3 border-t border-line py-3 first:border-0"
            >
              <PhaseCircle status={status} />
              <div>
                <div
                  className={cn(
                    "font-sans text-sm font-medium",
                    status === "ok" ? "text-ink/60" : "text-ink"
                  )}
                >
                  {phase.label}
                </div>
                {phase.expected > 1 ? (
                  <div className="font-sans text-xs text-ink-muted">
                    {okCount} of {phase.expected} done
                  </div>
                ) : null}
              </div>
              {status === "ok" ? (
                <Pill tone="lime">Done</Pill>
              ) : status === "error" ? (
                <Pill tone="red">Needs retry</Pill>
              ) : status === "running" ? (
                <span className="font-sans text-xs text-ink-muted">
                  In progress
                </span>
              ) : (
                <span className="font-sans text-xs text-ink-muted/60">
                  Waiting
                </span>
              )}
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}

function PhaseCircle({ status }: { status: PhaseStatus }) {
  return (
    <span
      className={cn(
        "flex h-[22px] w-[22px] items-center justify-center rounded-full",
        status === "pending" && "border-[1.5px] border-teal/25 bg-white",
        status === "running" && "border-[1.5px] border-teal bg-white",
        status === "ok" && "border-[1.5px] border-teal bg-teal text-white",
        status === "error" && "border-[1.5px] border-plum bg-plum/10 text-plum"
      )}
    >
      {status === "running" ? <Spinner className="h-3 w-3" /> : null}
      {status === "ok" ? <Check className="h-3 w-3" /> : null}
      {status === "error" ? <X className="h-3 w-3" /> : null}
    </span>
  );
}

function phaseStatus(phase: Phase, phaseEvents: ProvisionEvent[]): PhaseStatus {
  if (phaseEvents.some((e) => e.status === "error")) return "error";
  const okCount = phaseEvents.filter((e) => e.status === "ok").length;
  if (okCount >= phase.expected) return "ok";
  if (phaseEvents.length > 0) return "running";
  return "pending";
}

// Mirrors the run plan in src/lib/birdeye/provision-runner.ts: phases with
// zero items (no media, no extra users, no contacts) are skipped there, so
// they're omitted here too.
function expectedPhases(state: WizardState): Phase[] {
  const phases: Phase[] = [
    { kind: "create_subaccount", label: "Creating your Birdeye account", expected: 1 },
    { kind: "update_business", label: "Publishing your business profile", expected: 1 },
  ];
  const mediaCount = state.assets.showcase.length;
  if (mediaCount > 0) {
    phases.push({
      kind: "add_media",
      label: "Uploading your photos & media",
      expected: 1,
    });
  }
  if (state.additionalUsers.length > 0) {
    phases.push({
      kind: "create_user",
      label: "Inviting your team",
      expected: state.additionalUsers.length,
    });
  }
  phases.push({
    kind: "default_review_sources",
    label: "Connecting review sources — Google & Facebook",
    expected: 1,
  });
  if (state.contacts.length > 0) {
    phases.push({
      kind: "save_contact",
      label: "Loading your first contacts",
      expected: state.contacts.length,
    });
  }
  return phases;
}
