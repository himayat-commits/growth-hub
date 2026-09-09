// The Birdeye provisioning sequence, extracted from the route so it can be
// resumed and unit-reasoned about. Streams progress via `send` (SSE) and
// persists progress to onboarding_states after every meaningful step.
//
// Key safety properties:
//   • The businessNumber is persisted the INSTANT the sub-account is created,
//     before any later call — a crash never orphans a billable account.
//   • A re-run with an existing LIVE businessNumber SKIPS creation (the only
//     duplicate that costs money) and re-applies the rest. update_business is
//     a PUT and the remaining calls are upserts, so replaying them is safe.
//   • A businessNumber written by a MOCK run is synthetic. When the effective
//     mode is live those identifiers are discarded first so create runs for
//     real — otherwise customers provisioned during the mock period would be
//     stuck with a fake account forever.
//   • create_subaccount is never retried in-process and is REFUSED while a
//     previous attempt has an unknown outcome (`unresolvedCreate`) or while
//     the audit log shows a live create that succeeded without a persisted
//     id. Ops must confirm in Birdeye that no account exists before clearing.
//   • Late-step failures don't abort the run; they're collected into
//     failedSteps and the run finishes as `partial` (the account still exists
//     and is usable), so ops can resolve the gaps.

import "server-only";
import * as Sentry from "@sentry/nextjs";
import { and, eq, gt, sql } from "drizzle-orm";
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
  type CallResult,
  type ClientMode,
} from "@/lib/birdeye/client";
import { needsLiveReset } from "@/lib/birdeye/provisioned";
import { appendProvisioningLog } from "@/lib/wizard/state-store";
import { loadOnboardingState, updateProvisioning } from "@/lib/wizard/provisioning-store";
import { createNotification } from "@/lib/db/notifications";
import { getDb } from "@/lib/db";
import { provisioningLogs } from "@/lib/db/schema";
import { sendOpsHandoff } from "@/lib/ops/notify";
import type { Provisioning, WizardState } from "@/lib/wizard/state";

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
  resellerId: string;
  apiHost: string;
  /** Who started this run — recorded as provisioning.lastRunBy. */
  runBy?: "user" | "ops" | "cron";
  send: (event: unknown) => void;
};

/** The message a customer/ops sees when the runner refuses to create. */
export const UNRESOLVED_CREATE_ERROR =
  "A previous create attempt has an unknown outcome. Ops must confirm in Birdeye whether an account exists before retrying.";

/** Cap on the raw create response we keep in JSONB for ops to inspect. */
const UNRESOLVED_RESPONSE_MAX_CHARS = 4096;

const isTransientStatus = (status: number) =>
  status === 0 || status === 429 || status >= 500;

function truncateResponse(response: unknown): unknown {
  if (response === undefined || response === null) return response;
  let text: string;
  try {
    text = typeof response === "string" ? response : JSON.stringify(response);
  } catch {
    text = String(response);
  }
  if (text.length <= UNRESOLVED_RESPONSE_MAX_CHARS) return response;
  return `${text.slice(0, UNRESOLVED_RESPONSE_MAX_CHARS)}… [truncated ${text.length - UNRESOLVED_RESPONSE_MAX_CHARS} chars]`;
}

/** Pre-create guard (live only): has a LIVE create_subaccount ever succeeded
 *  for this user? If so and no id is persisted, an account may exist that we
 *  lost track of (e.g. a clobbered JSONB write). Rows older than the last
 *  explicit ops clear are ignored — ops confirmed no orphan as of then.
 *  Mock rows are excluded via the `mode` we stamp on every log payload. */
async function hasUnaccountedLiveCreate(
  userId: string,
  clearedAt: string | undefined,
): Promise<boolean> {
  try {
    const conditions = [
      eq(provisioningLogs.userId, userId),
      eq(provisioningLogs.kind, "create_subaccount"),
      eq(provisioningLogs.ok, true),
      sql`${provisioningLogs.payload}->>'mode' = 'live'`,
    ];
    if (clearedAt) conditions.push(gt(provisioningLogs.createdAt, new Date(clearedAt)));
    const rows = await getDb()
      .select({ id: provisioningLogs.id })
      .from(provisioningLogs)
      .where(and(...conditions))
      .limit(1);
    return rows.length > 0;
  } catch (e) {
    // Fail CLOSED: if we cannot prove there is no prior live create, do not
    // create. Ops can re-run once the database is reachable again.
    Sentry.captureException(e, { tags: { area: "provision", step: "precreate_guard" } });
    return true;
  }
}

export async function runProvision(args: RunProvisionArgs): Promise<ProvisionResult> {
  const { userId, state, mode, resellerId, apiHost, send } = args;
  const runBy = args.runBy ?? "user";
  const onboardingId = state.onboardingId;
  const failedSteps: { kind: string; error: string }[] = [];

  // ── Refusal gate: unknown outcome of an earlier create ──────────────────
  // Checked before anything is written so a refused run doesn't bump
  // attempts or flip a `failed` row to `running`.
  if (!state.provisioning.businessNumber && state.provisioning.unresolvedCreate) {
    send({ status: "error", error: UNRESOLVED_CREATE_ERROR });
    return { status: "failed", invitedUsers: [], mediaIds: [], error: UNRESOLVED_CREATE_ERROR };
  }

  // ── Mock → live: the stored identifiers are synthetic ───────────────────
  // Discard them (keep attempts + audit fields) so create executes for real.
  const liveReset = needsLiveReset(state, mode);
  let businessNumber = liveReset ? undefined : state.provisioning.businessNumber;
  const resuming = Boolean(businessNumber);

  // Total = the steps this invocation will actually run (create is skipped on resume).
  const total =
    (resuming ? 0 : 1) +
    1 + // update_business
    (state.assets.showcase.length ? 1 : 0) +
    state.additionalUsers.length +
    1 + // default_review_sources
    state.contacts.length;

  send({ type: "start", mode, resuming, total });

  let stepCounter = 1;
  const run = async (kind: AssembledRequest["kind"], req: AssembledRequest) => {
    const step = stepCounter++;
    send({ step, total, kind, label: REQUEST_LABELS[kind], status: "running" });
    // A create is not idempotent: a gateway 502 after Birdeye committed the
    // account would otherwise be replayed into a second billable account.
    const result = await callBirdeyeWithRetry(
      req,
      { onboardingId, mode },
      { retries: kind === "create_subaccount" ? 0 : undefined },
    );
    await appendProvisioningLog(onboardingId, {
      step,
      kind,
      // `mode` on the payload lets the pre-create guard tell live rows from
      // mock ones (the mock also logs ok=true creates with fake ids).
      payload: { ...req.req, mode },
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
  // key + record the mode this run executes under. Leave the top-level
  // lifecycle `status` untouched (don't downgrade a resumed, already-
  // provisioned account back to draft).
  await updateProvisioning(userId, (prev) => ({
    provisioning: {
      runStatus: "running",
      mode,
      externalReferenceId: onboardingId,
      attempts: (prev.attempts ?? 0) + 1,
      failedSteps: [],
      lastRunBy: runBy,
      ...(liveReset
        ? {
            businessId: undefined,
            businessNumber: undefined,
            invitedUsers: [],
            mediaIds: [],
            lastStep: undefined,
            completedAt: undefined,
          }
        : {}),
    },
  }));

  /** Land the run as `failed` with no account. `unresolved` marks an unknown
   *  outcome that blocks further creates until ops clears it. Always tells
   *  ops — a paid customer with no account must never be silent. */
  const failCreate = async (
    error: string,
    unresolved?: { status: number; reason: string; response?: unknown },
  ): Promise<ProvisionResult> => {
    Sentry.captureMessage("birdeye create_subaccount failed", {
      level: "error",
      tags: { area: "provision", step: "create_subaccount", mode, unresolved: String(Boolean(unresolved)) },
      extra: { onboardingId, error, reason: unresolved?.reason },
    });
    await updateProvisioning(userId, () => ({
      status: "failed",
      provisioning: {
        runStatus: "failed",
        mode,
        lastStep: "create_subaccount",
        failedSteps,
        ...(unresolved
          ? {
              unresolvedCreate: {
                at: new Date().toISOString(),
                status: unresolved.status,
                reason: unresolved.reason,
                response: truncateResponse(unresolved.response),
              },
            }
          : {}),
      },
    }));
    await notifyOps({ onboardingId, state, mode, invitedUsers: [], mediaIds: [], status: "failed" });
    send({ status: "error", error });
    return { status: "failed", invitedUsers: [], mediaIds: [], error };
  };

  // Step 1 — create sub-account (skipped on resume).
  if (!businessNumber) {
    // Pre-create guard (live only): the audit log says a live create already
    // succeeded but nothing is persisted → an orphan may exist. Refuse.
    if (
      mode === "live" &&
      (await hasUnaccountedLiveCreate(userId, state.provisioning.unresolvedCleared?.at))
    ) {
      failedSteps.push({ kind: "create_subaccount", error: UNRESOLVED_CREATE_ERROR });
      return failCreate(UNRESOLVED_CREATE_ERROR, {
        status: 200,
        reason: "provisioning_logs has a live create_subaccount ok=true row but no businessNumber is persisted",
      });
    }

    const createReq = buildCreateSubaccountPayload(state, resellerId, apiHost);
    const r1: CallResult = await run("create_subaccount", { kind: "create_subaccount", req: createReq });
    if (!r1.ok) {
      const error = r1.error ?? "create_subaccount failed";
      // 4xx is a definitive "not created" — retry is safe. Anything transient
      // (network, 429, 5xx) may have committed server-side → unknown outcome.
      return failCreate(
        error,
        isTransientStatus(r1.status)
          ? { status: r1.status, reason: `transient failure (${r1.status}) — Birdeye may have created the account`, response: r1.response }
          : undefined,
      );
    }
    const ids = extractIdentifiers(r1.response);
    businessNumber = ids.businessNumber;
    if (!businessNumber) {
      const error = "No businessNumber returned from create_subaccount";
      failedSteps.push({ kind: "create_subaccount", error });
      return failCreate(error, {
        status: r1.status,
        reason: "create returned 2xx but no businessNumber/businessId could be extracted",
        response: r1.response,
      });
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
        mode,
        lastStep: "done",
        completedAt,
        escalatedAt,
      },
    };
  });

  // Step 7 — ops handoff (module entitlements, Webchat, Apple/FAQs/tags the
  // public API can't set). Non-fatal: the customer is already provisioned.
  await notifyOps({ onboardingId, state, mode, businessNumber, invitedUsers, mediaIds, status });

  // In-app notification. Escalated partials tell the user we've got it —
  // they've retried enough; ops now owns the remaining steps. A mock run
  // never claims a live account: a Growth Strategist finishes it by hand.
  try {
    const numberTag = businessNumber ? ` (#${businessNumber})` : "";
    await createNotification({
      userId: onboardingId,
      kind: "birdeye_provisioned",
      title:
        mode !== "live"
          ? "Your Birdeye setup is with our team"
          : status === "partial" && !escalated
            ? "Birdeye account ready (action needed)"
            : "Birdeye account ready",
      body:
        mode !== "live"
          ? "We've received everything we need. A Growth Strategist is setting up your Birdeye account and will email your login details — usually within two business days."
          : escalated
            ? `Your business is live on Birdeye${numberTag}. Our team is finishing the last few setup steps — no action needed.`
            : status === "partial"
              ? `Your business is live on Birdeye${numberTag}, but ${failedSteps.length} setup step(s) need a retry. Open /services to resume.`
              : `Your business is live on Birdeye${numberTag}. Open your dashboard from /services or the portal banner.`,
      href: mode !== "live" ? "/messages" : "/services",
    });
  } catch (e) {
    Sentry.captureException(e, { tags: { area: "provision", step: "notification", mode } });
  }

  send({ type: "done", businessNumber, invitedUsers, mediaIds, status, mode });
  return { status, businessNumber, invitedUsers, mediaIds };
}

/** Run the ops handoff (tracked tasks + webhook + email via lib/ops/notify).
 *  Reads the just-persisted terminal state back from Neon so the handoff
 *  carries THIS run's failedSteps/attempts/escalatedAt/unresolvedCreate —
 *  the in-memory `state` predates the run. Logs the attempt to
 *  provisioning_logs and never throws. Anything other than a clean
 *  `provisioned` is action_required: a partial needs the tail finished, a
 *  failed create means a paid customer with NO account. */
async function notifyOps(args: {
  onboardingId: string;
  state: WizardState;
  mode: ClientMode;
  businessNumber?: string;
  invitedUsers: string[];
  mediaIds: string[];
  status: ProvisionResult["status"];
}): Promise<void> {
  const { onboardingId, state, mode, businessNumber, invitedUsers, mediaIds, status } = args;
  const severity = status === "provisioned" ? ("info" as const) : ("action_required" as const);
  try {
    const fallbackProvisioning: Provisioning = {
      ...state.provisioning,
      businessNumber,
      invitedUsers,
      mediaIds,
      mode,
      runStatus: status,
    };
    const fresh =
      (await loadOnboardingState(onboardingId)) ??
      ({ ...state, provisioning: fallbackProvisioning } as WizardState);
    const result = await sendOpsHandoff({ state: fresh, severity });
    if (!result.ok) throw new Error(result.error ?? "ops handoff failed");
    await appendProvisioningLog(onboardingId, {
      step: 0,
      kind: "notify_ops",
      payload: { severity, businessNumber, mode },
      response: { ok: true },
      ok: true,
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "unknown error";
    Sentry.captureException(e, { tags: { area: "provision", step: "notify_ops" }, extra: { onboardingId } });
    await appendProvisioningLog(onboardingId, {
      step: 0,
      kind: "notify_ops",
      payload: { severity, businessNumber, mode },
      response: null,
      ok: false,
      error: message,
    });
  }
}
