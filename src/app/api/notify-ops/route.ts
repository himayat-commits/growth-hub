// Authenticated wrapper around the in-process ops notifier (lib/ops/notify).
//
// Posts a JSON summary to the reseller ops inbox/webhook so they can activate
// Birdeye modules that aren't enable-able via the public API. The provisioning
// orchestrator calls notifyOps() directly; this route exists for any external
// caller and now requires a signed-in user who owns the onboarding state, so
// it can no longer be used anonymously to exfiltrate onboarding data.

import { NextResponse } from "next/server";
import { z } from "zod";
import { withAuth } from "@/lib/auth/with-auth";
import { wizardStateSchema } from "@/lib/wizard/state";
import { notifyOps } from "@/lib/ops/notify";

const Body = z.object({ state: wizardStateSchema });

export async function POST(req: Request) {
  const { user } = await withAuth();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
  const state = parsed.data.state;

  // onboardingId is the user's id (set in the wizard layout). Block callers
  // from submitting another user's onboarding state.
  if (user.id !== state.onboardingId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  await notifyOps(state);
  return NextResponse.json({ ok: true });
}
