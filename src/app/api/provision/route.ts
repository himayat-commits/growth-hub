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
import { wizardStateSchema } from "@/lib/wizard/state";
import {
  loadOnboardingState,
  ensureOnboardingState,
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

  // ── Subscription gate (defense-in-depth) ─────────────────────────────────
  // Provisioning creates a billable Birdeye sub-account — strictly paid-only.
  // Free users use the action-plan path, which never calls this route.
  const sub = await getSubscription(user.id);
  if (!isActive(sub)) {
    return json({ error: "An active subscription is required to provision." }, 403);
  }

  // ── Authoritative state + idempotency gate ───────────────────────────────
  const dbState = await loadOnboardingState(user.id);
  const state = dbState ?? parsed.data.state;
  await ensureOnboardingState(user.id, state);

  if (state.provisioning.businessNumber && state.provisioning.runStatus === "provisioned") {
    return json({
      alreadyProvisioned: true,
      businessNumber: state.provisioning.businessNumber,
      status: "provisioned",
    });
  }

  // ── Resolve effective mode (deployment switch × allowlist) ───────────────
  const mode = resolveEffectiveMode(getProvisionMode(), isOpsEmail(user.email));
  const origin = req.headers.get("origin") ?? "";

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const enc = new TextEncoder();
      const send = (event: unknown) =>
        controller.enqueue(enc.encode(`data: ${JSON.stringify(event)}\n\n`));
      try {
        await runProvision({
          userId: user.id,
          state,
          mode,
          origin,
          resellerId: RESELLER_ID,
          apiHost: API_HOST,
          send,
        });
      } catch (err) {
        send({
          status: "error",
          error: err instanceof Error ? err.message : "Provisioning failed unexpectedly.",
        });
      } finally {
        controller.close();
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
