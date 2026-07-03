// The Birdeye provisioning sequence, extracted from the route so it can be
// resumed and unit-reasoned about. Streams progress via `send` (SSE) and
// persists progress to onboarding_states after every meaningful step.
//
// Key safety properties:
//   • The businessNumber is persisted the INSTANT the sub-account is created,
//     before any later call — a crash never orphans a billable account.
//   • A re-run with an existing businessNumber SKIPS creation (the only
//     duplicate that costs money) and re-applies the rest. update_business is
//     a PUT and the remaining calls are upserts, so replaying them is safe.
//   • Late-step failures don't abort the run; they're collected into
//     failedSteps and the run finishes as `partial` (the account still exists
//     and is usable), so ops can resolve the gaps.

import "server-only";
import * as Sentry from "@sentry/nextjs";
import {
  buildCreateSubaccountPayload,
  buildUpdateBusinessPayload,
  buildAddMediaPayload,
  buildCreateUserPayloads,
  buildDefaultReviewSourcesPayload,
  buildContactPayloads,
  REQUEST_LABELS,
  type AssembledRequest,
} from "@/lib/birdeye/payloads";
import {
  callBirdeyeWithRetry,
  extractIdentifiers,
  type ClientMode,
} from "@/lib/birdeye/client";
import { appendProvisioningLog } from "@/lib/wizard/state-store";
import { updateProvisioning } from "@/lib/wizard/provisioning-store";
import { createNotification } from "@/lib/db/notifications";
import type { WizardState } from "@/lib/wizard/state";

export type ProvisionResult = {
  status: "provisioned" | "partial" | "failed";
  businessNumber?: string;
  invitedUsers: string[];
  mediaIds: string[];
  error?: string;
};

export type RunProvisionArgs = {
  userId: string;
  state: WizardState;
  mode: ClientMode;
  origin: string;
  resellerId: string;
  apiHost: string;
  /** Who started this run — recorded as provisioning.lastRunBy. */
  runBy?: "user" | "ops" | "cron";
  send: (event: unknown) => void;
};

export async function runProvision(args: RunProvisionArgs): Promise<ProvisionResult> {
  const { userId, state, mode, origin, resellerId, apiHost, send } = args;
  const runBy = args.runBy ?? "user";
  const onboardingId = state.onboardingId;
  const failedSteps: { kind: string; error: string }[] = [];

  // Resume: a saved businessNumber means the sub-account already exists.
  let businessNumber = state.provisioning.businessNumber;
  const resuming = Boolean(businessNumber);

  // Total = the steps this invocation will actually run (create is skipped on resume).
  const total =
    (resuming ? 0 : 1) +
    1 + // update_business
    (state.assets.showcase.length ? 1 : 0) +
    state.additionalUsers.length +
    1 + // default_review_sources
    state.contacts.length;

  let stepCounter = 1;
  const run = async (kind: AssembledRequest["kind"], req: AssembledRequest) => {
    const step = stepCounter++;
    send({ step, total, kind, label: REQUEST_LABELS[kind], status: "running" });
    const result = await callBirdeyeWithRetry(req, { onboardingId, mode });
    await appendProvisioningLog(onboardingId, {
      step,
      kind,
      payload: req.req,
      response: result.response,
      ok: result.ok,
      error: result.error,
    });
    if (!result.ok) failedSteps.push({ kind, error: result.error ?? `step ${kind} failed` });
    send({
      step,
      total,
      kind,
      label: REQUEST_LABELS[kind],
      status: result.ok ? "ok" : "error",
      response: result.response,
      error: result.error,
    });
    return result;
  };

  // Mark the run started + bump the attempt counter + anchor the idempotency
  // key. Leave the top-level lifecycle `status` untouched (don't downgrade a
  // resumed, already-provisioned account back to draft).
  await updateProvisioning(userId, (prev) => ({
    provisioning: {
      runStatus: "running",
      externalReferenceId: onboardingId,
      attempts: (prev.attempts ?? 0) + 1,
      failedSteps: [],
      lastRunBy: runBy,
    },
  }));

  // Step 1 — create sub-account (skipped on resume).
  if (!businessNumber) {
    const createReq = buildCreateSubaccountPayload(state, resellerId, apiHost);
    const r1 = await run("create_subaccount", { kind: "create_subaccount", req: createReq });
    if (!r1.ok) {
      Sentry.captureMessage("birdeye create_subaccount failed", {
        level: "error",
        tags: { area: "provision", step: "create_subaccount", mode },
        extra: { onboardingId, error: r1.error },
      });
      await updateProvisioning(userId, () => ({
        status: "failed",
        provisioning: { runStatus: "failed", lastStep: "create_subaccount", failedSteps },
      }));
      send({ status: "error", error: r1.error });
      return { status: "failed", invitedUsers: [], mediaIds: [], error: r1.error };
    }
    const ids = extractIdentifiers(r1.response);
    businessNumber = ids.businessNumber;
    if (!businessNumber) {
      const error = "No businessNumber returned from create_subaccount";
      Sentry.captureMessage(error, {
        level: "error",
        tags: { area: "provision", step: "create_subaccount", mode },
        extra: { onboardingId },
      });
      await updateProvisioning(userId, () => ({
        status: "failed",
        provisioning: { runStatus: "failed", lastStep: "create_subaccount", failedSteps },
      }));
      send({ status: "error", error });
      return { status: "failed", invitedUsers: [], mediaIds: [], error };
    }
    // Persist the identifiers IMMEDIATELY, before any later call.
    await updateProvisioning(userId, () => ({
      provisioning: {
        businessId: ids.businessId,
        businessNumber,
        lastStep: "create_subaccount",
      },
    }));
  }

  // Step 2 — update business profile.
  const updateReq = buildUpdateBusinessPayload(state, businessNumber, apiHost);
  await run("update_business", { kind: "update_business", req: updateReq });

  // Step 3 — showcase media (optional).
  const mediaIds: string[] = [];
  const mediaReq = buildAddMediaPayload(state, businessNumber, apiHost);
  if (mediaReq) {
    const r = await run("add_media", { kind: "add_media", req: mediaReq });
    if (r.ok) mediaIds.push(...((r.response as { mediaIds?: string[] }).mediaIds ?? []));
  }

  // Step 4 — additional users.
  const invitedUsers: string[] = [];
  for (const u of buildCreateUserPayloads(state, businessNumber, apiHost)) {
    const r = await run("create_user", { kind: "create_user", req: u });
    if (r.ok) invitedUsers.push(u.body.userEmailId);
  }

  // Step 5 — default review sources.
  const reviewReq = buildDefaultReviewSourcesPayload(businessNumber, resellerId, apiHost);
  await run("default_review_sources", { kind: "default_review_sources", req: reviewReq });

  // Step 6 — initial contacts.
  for (const c of buildContactPayloads(state, businessNumber, apiHost)) {
    await run("save_contact", { kind: "save_contact", req: c });
  }

  const status: ProvisionResult["status"] = failedSteps.length ? "partial" : "provisioned";
  const completedAt = new Date().toISOString();

  if (status === "partial") {
    Sentry.captureMessage("birdeye provisioning partial", {
      level: "warning",
      tags: { area: "provision", mode },
      extra: { onboardingId, failedSteps },
    });
  }

  // Escalation ceiling: after 3 attempts with steps still failing, the retry
  // burden moves to ops — the UI flips from "retry" to "we're on it". A full
  // success clears the flag; user retries past the ceiling never reset it.
  let escalated = false;
  await updateProvisioning(userId, (prev) => {
    const escalatedAt =
      status === "provisioned"
        ? undefined
        : prev.escalatedAt ?? ((prev.attempts ?? 0) >= 3 ? completedAt : undefined);
    escalated = status === "partial" && Boolean(escalatedAt);
    // Persist the terminal state. status stays `provisioned` even on partial —
    // the account exists and is usable; runStatus/failedSteps carry the nuance.
    return {
      status: "provisioned",
      provisioning: {
        businessNumber,
        invitedUsers,
        mediaIds,
        failedSteps,
        runStatus: status,
        lastStep: "done",
        completedAt,
        escalatedAt,
      },
    };
  });

  // Step 7 — ops handoff (module entitlements, Webchat, Apple/FAQs/tags the
  // public API can't set). Non-fatal: the customer is already provisioned.
  await notifyOps({
    origin,
    onboardingId,
    state,
    businessNumber,
    invitedUsers,
    mediaIds,
    status,
    escalated,
  });

  // In-app notification. Escalated partials tell the user we've got it —
  // they've retried enough; ops now owns the remaining steps.
  try {
    await createNotification({
      userId: onboardingId,
      kind: "birdeye_provisioned",
      title:
        status === "partial" && !escalated
          ? "Birdeye account ready (action needed)"
          : "Birdeye account ready",
      body: escalated
        ? `Your business is live on Birdeye${businessNumber ? ` (#${businessNumber})` : ""}. Our team is finishing the last few setup steps — no action needed.`
        : status === "partial"
          ? `Your business is live on Birdeye${businessNumber ? ` (#${businessNumber})` : ""}, but ${failedSteps.length} setup step(s) need a retry. Open /services to resume.`
          : `Your business is live on Birdeye${businessNumber ? ` (#${businessNumber})` : ""}. Open your dashboard from /services or the portal banner.`,
      href: "/services",
    });
  } catch (e) {
    Sentry.captureException(e, { tags: { area: "provision", step: "notification", mode } });
  }

  send({ type: "done", businessNumber, invitedUsers, mediaIds, status });
  return { status, businessNumber, invitedUsers, mediaIds };
}

/** POST the ops-handoff summary. Logs the attempt to provisioning_logs and
 *  never throws — provisioning has already succeeded against Birdeye. */
async function notifyOps(args: {
  origin: string;
  onboardingId: string;
  state: WizardState;
  businessNumber: string;
  invitedUsers: string[];
  mediaIds: string[];
  status: ProvisionResult["status"];
  escalated?: boolean;
}): Promise<void> {
  const { origin, onboardingId, state, businessNumber, invitedUsers, mediaIds, status, escalated } =
    args;
  const opsPayload = {
    state: { ...state, provisioning: { ...state.provisioning, businessNumber, invitedUsers, mediaIds } },
    severity: status === "partial" ? "action_required" : "info",
    escalated: Boolean(escalated),
  };
  try {
    if (!origin) throw new Error("Missing origin header — can't reach /api/notify-ops");
    const res = await fetch(`${origin}/api/notify-ops`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(opsPayload),
    });
    if (!res.ok) throw new Error(`notify-ops returned ${res.status}`);
    await appendProvisioningLog(onboardingId, {
      step: 0,
      kind: "notify_ops",
      payload: opsPayload,
      response: { status: res.status },
      ok: true,
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "unknown error";
    Sentry.captureException(e, { tags: { area: "provision", step: "notify_ops" }, extra: { onboardingId } });
    await appendProvisioningLog(onboardingId, {
      step: 0,
      kind: "notify_ops",
      payload: opsPayload,
      response: null,
      ok: false,
      error: message,
    });
  }
}
