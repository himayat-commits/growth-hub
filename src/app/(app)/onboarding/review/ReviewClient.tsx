"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronRight } from "lucide-react";
import { useWizard } from "@/components/wizard/WizardContext";
import { StepShell } from "@/components/wizard/StepShell";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { InlineNotice } from "@/components/ui/notice";
import { ShieldCheck } from "lucide-react";
import { PayloadPreview } from "@/components/wizard/PayloadPreview";
import {
  ProvisioningChecklist,
  type ProvisionEvent,
} from "@/components/wizard/ProvisioningChecklist";
import { assembleAllPayloads, REQUEST_LABELS } from "@/lib/birdeye/payloads";
import { PACKAGES } from "@/lib/wizard/packages";
import type { Provisioning } from "@/lib/wizard/state";

const PUBLIC_HOST = "https://api.birdeye.com/resources";
const PREVIEW_RESELLER_ID = "{resellerId}";

type DoneEvent = {
  type: "done";
  businessNumber: string;
  invitedUsers: string[];
  mediaIds: string[];
  status?: "provisioned" | "partial";
};

type RunState = "idle" | "running" | "success" | "error";

export function ReviewClient({
  serverProvisioning,
}: {
  /** Authoritative provisioning block from Neon — the client context's copy
   *  can lag behind (localStorage mirror). Re-entry states key off this. */
  serverProvisioning: Provisioning | null;
}) {
  const { state, patch } = useWizard();
  const router = useRouter();
  const [runState, setRunState] = React.useState<RunState>("idle");
  const [events, setEvents] = React.useState<ProvisionEvent[]>([]);
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);
  const provisioning = runState === "running";

  const requests = React.useMemo(
    () => assembleAllPayloads(state, PREVIEW_RESELLER_ID, PUBLIC_HOST),
    [state]
  );
  const pkg = PACKAGES[state.packageId];

  const provision = async () => {
    setRunState("running");
    setEvents([]);
    setErrorMessage(null);
    // Stateless API on Vercel — send the full wizard state in the body.
    const res = await fetch("/api/provision", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ state }),
    });

    // Pre-stream gates (auth, subscription, already-provisioned) return JSON
    // with a real status code instead of an SSE stream.
    const contentType = res.headers.get("content-type") ?? "";
    if (contentType.includes("application/json")) {
      const data = (await res.json().catch(() => ({}))) as {
        alreadyProvisioned?: boolean;
        error?: string;
      };
      if (res.ok && data.alreadyProvisioned) {
        setRunState("success");
        router.push("/onboarding/done");
        return;
      }
      setRunState("error");
      setErrorMessage(data.error ?? "Provisioning couldn't start. Please retry.");
      return;
    }

    if (!res.body) {
      setRunState("error");
      setErrorMessage("Server did not return a response stream. Please retry.");
      return;
    }
    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buf = "";
    let sawDone = false;
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buf += decoder.decode(value, { stream: true });
      const parts = buf.split("\n\n");
      buf = parts.pop() ?? "";
      for (const p of parts) {
        const line = p.split("\n").find((l) => l.startsWith("data:"));
        if (!line) continue;
        try {
          const ev = JSON.parse(line.slice(5).trim()) as
            | ProvisionEvent
            | DoneEvent
            | { status: "error"; error?: string };
          if ("type" in ev && ev.type === "done") {
            sawDone = true;
            // Persist result with immediate=true so the PUT lands BEFORE
            // we navigate. /done and /portal then read businessNumber
            // server-side from Neon on the next request.
            await patch(
              (s) => ({
                ...s,
                status: "provisioned",
                provisioning: {
                  ...s.provisioning,
                  businessNumber: ev.businessNumber,
                  invitedUsers: ev.invitedUsers,
                  mediaIds: ev.mediaIds,
                  runStatus: ev.status ?? "provisioned",
                  completedAt: new Date().toISOString(),
                },
              }),
              { immediate: true }
            );
            setRunState("success");
            router.push("/onboarding/done");
            return;
          }
          // Terminal fatal error emitted by the orchestrator (e.g. first step failed).
          if ("status" in ev && ev.status === "error" && !("step" in ev)) {
            setRunState("error");
            setErrorMessage(
              ("error" in ev && ev.error) || "Provisioning halted. Please retry."
            );
            return;
          }
          setEvents((curr) => [...curr, ev as ProvisionEvent]);
        } catch {
          /* malformed line — ignore */
        }
      }
    }
    // Stream ended without a "done" event — treat as failure.
    if (!sawDone) {
      setRunState("error");
      // Surface the most recent step's error if we have one.
      const lastError = events.findLast?.((e) => e.status === "error");
      setErrorMessage(
        lastError?.error ??
          "Provisioning didn't complete. Your existing answers are saved — please retry."
      );
    }
  };

  // While a run is streaming (or just failed mid-stream) the summary gives
  // way to the live checklist; the footer CTA is the single control.
  const streaming = runState === "running" || (runState === "error" && events.length > 0);

  const failedCount =
    serverProvisioning?.failedSteps?.length ?? 0;

  return (
    <StepShell
      stepKey="review"
      framed={false}
      title="Review & launch"
      blurb="Everything you've told us, in one place. Click any row to jump back and edit, then launch when you're happy."
      badge={pkg.name}
      onContinue={provision}
      continueDisabled={provisioning}
      continueLabel={
        provisioning
          ? "Launching…"
          : runState === "error"
          ? "Retry launch"
          : failedCount > 0
          ? `Retry the ${failedCount} remaining step${failedCount === 1 ? "" : "s"}`
          : "Launch my Birdeye account"
      }
      continueVariant="lime"
      locked={provisioning}
    >
      {streaming ? (
        <>
          <ProvisioningChecklist state={state} events={events} />
          {runState === "error" && errorMessage ? (
            <InlineNotice tone="warning" title="Provisioning paused." className="mt-4">
              {errorMessage} Your answers are saved — retry below; steps that
              already succeeded are never repeated unsafely.
            </InlineNotice>
          ) : null}
        </>
      ) : (
        <>
          {runState === "error" && errorMessage ? (
            <InlineNotice tone="warning" title="Provisioning paused." className="mb-6">
              {errorMessage} Your answers are saved — use the retry button
              below when you&apos;re ready.
            </InlineNotice>
          ) : null}

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <ShieldCheck className="h-4 w-4 text-teal" />
                Captured information
              </CardTitle>
            </CardHeader>
            <CardContent className="grid gap-1">
              <SummaryRow href="/onboarding/confirm" label="Admin user">
                {state.adminUser.firstName} {state.adminUser.lastName} ·{" "}
                {state.adminUser.email}
                {state.additionalUsers.length
                  ? ` · +${state.additionalUsers.length} team members`
                  : ""}
              </SummaryRow>
              <SummaryRow href="/onboarding/business" label="Business identity">
                {state.business.name || "—"} · {state.business.timezone}
                {state.business.abn ? ` · ABN ${state.business.abn}` : ""}
              </SummaryRow>
              <SummaryRow href="/onboarding/address" label="Address & contact">
                {[
                  state.address.address1,
                  state.address.city,
                  state.address.state,
                  state.address.zip,
                ]
                  .filter(Boolean)
                  .join(", ") || "—"}{" "}
                · {state.address.phone}
              </SummaryRow>
              <SummaryRow href="/onboarding/hours" label="Hours">
                {state.hours.is24x7
                  ? "Open 24/7"
                  : `${state.hours.weekly.filter((d) => d.isOpen).length} days/week open`}{" "}
                · {state.hours.status}
              </SummaryRow>
              <SummaryRow href="/onboarding/about" label="About & descriptions">
                Birdeye {state.descriptions.birdeye.length}/5000 · Google{" "}
                {state.descriptions.google.length}/750 · FB{" "}
                {state.descriptions.facebook.length}/255
              </SummaryRow>
              <SummaryRow href="/onboarding/taxonomy" label="Categories & keywords">
                Primary: {state.taxonomy.gmbPrimary || "—"}
                {state.taxonomy.payment.length
                  ? ` · ${state.taxonomy.payment.length} payment methods`
                  : ""}
              </SummaryRow>
              <SummaryRow href="/onboarding/assets" label="Brand assets">
                {state.assets.logoUrl ? "Logo ✓ " : "Logo missing "}
                {state.assets.birdeyeCoverUrl ? "· Cover ✓ " : "· Cover missing "}·{" "}
                {state.assets.showcase.length} showcase
              </SummaryRow>
              <SummaryRow href="/onboarding/social" label="Social profiles">
                {Object.values(state.social).filter(Boolean).length} linked
              </SummaryRow>
              <SummaryRow href="/onboarding/faqs" label="Custom FAQs">
                {state.faqs.length}
              </SummaryRow>
              {state.packageId === "accelerate" ? (
                <SummaryRow href="/onboarding/webchat" label="Webchat">
                  Agent: {state.webchat?.agentName} · Window:{" "}
                  {state.webchat?.windowSize}
                </SummaryRow>
              ) : null}
              <SummaryRow href="/onboarding/contacts" label="Initial contacts">
                {state.contacts.length} contacts
              </SummaryRow>
            </CardContent>
          </Card>

          <details className="group mt-8">
            <summary className="flex cursor-pointer list-none items-center gap-2 font-sans text-sm text-ink-muted transition-colors hover:text-teal [&::-webkit-details-marker]:hidden">
              <ChevronRight className="h-4 w-4 transition-transform group-open:rotate-90" />
              Technical details — the {requests.length} API calls we&apos;ll
              make on your behalf
            </summary>
            <p className="mt-3 font-sans text-xs text-ink-muted">
              Your API key never leaves our server.
            </p>
            <div className="mt-4 grid gap-2.5">
              {requests.map((r, i) => (
                <PayloadPreview
                  key={i}
                  index={i + 1}
                  label={REQUEST_LABELS[r.kind]}
                  method={r.req.method}
                  url={r.req.url}
                  headers={"headers" in r.req ? r.req.headers : undefined}
                  body={r.req.body}
                />
              ))}
            </div>
          </details>
        </>
      )}
    </StepShell>
  );
}

function SummaryRow({
  href,
  label,
  children,
}: {
  href: string;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className="flex flex-col items-start gap-1 rounded-xl px-3 py-2.5 transition-colors hover:bg-eggshell-warm/50 sm:flex-row sm:items-center sm:gap-3"
    >
      <span className="w-44 flex-shrink-0 font-sans text-[11px] font-semibold uppercase tracking-wider text-ink-muted">
        {label}
      </span>
      <span className="flex-1 text-sm text-ink sm:truncate">{children}</span>
      <ChevronRight className="hidden h-4 w-4 text-ink-muted/50 sm:block" />
    </Link>
  );
}
