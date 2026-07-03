// Birdeye provisioning endpoint. Thin shell: it authenticates, gates, and
// streams; the actual sequence lives in lib/birdeye/provision-runner.ts.
//
// All gating happens BEFORE the stream opens, so it can return real HTTP
// status codes (once an SSE stream starts, the status is locked at 200 and
// errors must be in-band events).
//
// Stateless wrt the request body: the wizard state arrives in the body, but
// we prefer the server-authoritative onboarding_states row (it's auto-saved
// on every step and carries the resume cursor — a posted body can't spoof an
// existing businessNumber).

import { z } from "zod";
import { withAuth } from "@/lib/auth/with-auth";
import { isOpsEmail } from "@/lib/auth/ops";
import { getSubscription, isActive } from "@/lib/subscription";
import { rateLimit, tooManyRequests } from "@/lib/rate-limit";
import { wizardStateSchema } from "@/lib/wizard/state";
import {
  acquireProvisionLock,
  ensureOnboardingState,
  isStaleRunning,
  loadOnboardingRow,
  releaseProvisionLock,
} from "@/lib/wizard/provisioning-store";
import { getProvisionMode, resolveEffectiveMode } from "@/lib/birdeye/client";
import { runProvision } from "@/lib/birdeye/provision-runner";

// Live runs can fan out to many calls (profile + media + N users + N contacts)
// each with retries, so give the function generous headroom. Confirm the
// deployed Vercel plan permits this ceiling.
export const runtime = "nodejs";
export const maxDuration = 300;

const Body = z.object({ state: wizardStateSchema });

const RESELLER_ID = process.env.BIRDEYE_RESELLER_ID ?? "demo-reseller";
const API_HOST = process.env.BIRDEYE_API_HOST ?? "https://api.birdeye.com/resources";

const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });

export async function POST(req: Request) {
  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return json({ error: "Invalid request — wizard state required in body" }, 400);
  }

  // ── Auth + identity binding ──────────────────────────────────────────────
  const { user } = await withAuth();
  if (!user) return json({ error: "Unauthorized" }, 401);
  if (parsed.data.state.onboardingId !== user.id) {
    return json({ error: "Forbidden" }, 403);
  }

  // ── Rate limit ───────────────────────────────────────────────────────────
  // Provisioning is idempotent, but each attempt burns Birdeye API calls and
  // a 5-minute function slot. Keyed by user (post-auth), not IP.
  const rl = rateLimit(`provision:${user.id}`, 3, 10 * 60_000);
  if (!rl.ok) return tooManyRequests(rl.retryAfterSec);

  // ── Subscription gate (defense-in-depth) ─────────────────────────────────
  // Provisioning creates a billable Birdeye sub-account — strictly paid-only.
  // Free users use the action-plan path, which never calls this route.
  const sub = await getSubscription(user.id);
  if (!isActive(sub)) {
    return json({ error: "An active subscription is required to provision." }, 403);
  }

  // ── Authoritative state + idempotency gate ───────────────────────────────
  const row = await loadOnboardingRow(user.id);
  const state = row?.state ?? parsed.data.state;
  await ensureOnboardingState(user.id, state);

  if (state.provisioning.businessNumber && state.provisioning.runStatus === "provisioned") {
    return json({
      alreadyProvisioned: true,
      businessNumber: state.provisioning.businessNumber,
      status: "provisioned",
    });
  }

  // ── Concurrent-run guard ─────────────────────────────────────────────────
  // A fresh `running` row means another invocation is mid-flight (each
  // runner step bumps updatedAt) — a second run would double Birdeye calls
  // and could double-create the billable sub-account. A STALE `running`
  // row is a crashed function; fall through and let the resume path run.
  if (
    row &&
    state.provisioning.runStatus === "running" &&
    !isStaleRunning(state, row.updatedAt)
  ) {
    return json(
      {
        alreadyRunning: true,
        error: "A provisioning run is already in progress. This page will pick it up shortly.",
      },
      409,
    );
  }

  // The lock is the authoritative mutual exclusion (the check above is a
  // fast-path courtesy); user Resume, ops re-run and the retry cron all
  // acquire it before touching Birdeye.
  if (!(await acquireProvisionLock(user.id))) {
    return json(
      {
        alreadyRunning: true,
        error: "A provisioning run is already in progress. This page will pick it up shortly.",
      },
      409,
    );
  }

  // ── Resolve effective mode (deployment switch × allowlist) ───────────────
  const mode = resolveEffectiveMode(getProvisionMode(), isOpsEmail(user.email));
  const origin = req.headers.get("origin") ?? "";

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const enc = new TextEncoder();
      // No-throw send: if the client closed the tab the stream is cancelled
      // and enqueue throws — swallow it so the run continues server-side to
      // a terminal runStatus instead of dying mid-sequence.
      const send = (event: unknown) => {
        try {
          controller.enqueue(enc.encode(`data: ${JSON.stringify(event)}\n\n`));
        } catch {
          /* client gone — keep provisioning */
        }
      };
      try {
        await runProvision({
          userId: user.id,
          state,
          mode,
          origin,
          resellerId: RESELLER_ID,
          apiHost: API_HOST,
          runBy: "user",
          send,
        });
      } catch (err) {
        send({
          status: "error",
          error: err instanceof Error ? err.message : "Provisioning failed unexpectedly.",
        });
      } finally {
        await releaseProvisionLock(user.id).catch(() => {});
        try {
          controller.close();
        } catch {
          /* already closed by a cancelled stream */
        }
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}
