// Wizard state persistence. Replaces Birdeye-Portal's stateless stub —
// here the canonical store is the `onboarding_states` Neon table
// (one row per WorkOS user, JSONB state column).
//
// The `[id]` route param IS the WorkOS user id. The client passes it,
// but we still verify it against the authenticated session — a user
// cannot read/write someone else's wizard state.

import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { withAuth } from "@/lib/auth/with-auth";
import { getDb } from "@/lib/db";
import { onboardingStates } from "@/lib/db/schema";
import { wizardStateSchema, type WizardState } from "@/lib/wizard/state";

export const runtime = "nodejs";

async function authorize(id: string) {
  const { user } = await withAuth();
  if (!user) return { error: "Unauthorized", status: 401 as const };
  if (user.id !== id) return { error: "Forbidden", status: 403 as const };
  return { user };
}

export async function GET(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const auth = await authorize(id);
  if ("error" in auth) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const rows = await getDb()
    .select()
    .from(onboardingStates)
    .where(eq(onboardingStates.userId, id))
    .limit(1);

  const row = rows[0];
  if (!row) return NextResponse.json({ state: null });
  return NextResponse.json({ state: row.state as WizardState });
}

export async function PUT(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const auth = await authorize(id);
  if ("error" in auth) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const body = await req.json().catch(() => null);
  const parsed = wizardStateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid wizard state", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  // The `provisioning` block is SERVER-OWNED: the runner persists
  // businessNumber / runStatus / lockedUntil / escalatedAt here, and a
  // client auto-save must never overwrite them — a stale tab's debounced
  // PUT replaying pre-run provisioning would erase the run lease and the
  // businessNumber (→ duplicate billable sub-account on the next launch).
  // Same for the coarse lifecycle `status` once it reached `provisioned`.
  // On first insert the block is reset too, so a crafted POST body can't
  // smuggle a foreign businessNumber in before the row exists.
  const db = getDb();
  const existing = await db
    .select()
    .from(onboardingStates)
    .where(eq(onboardingStates.userId, id))
    .limit(1);
  const serverState = existing[0]?.state as WizardState | undefined;

  const state: WizardState = {
    ...parsed.data,
    status:
      serverState?.status === "provisioned" ? "provisioned" : parsed.data.status,
    provisioning:
      serverState?.provisioning ?? { invitedUsers: [], mediaIds: [] },
  };

  await db
    .insert(onboardingStates)
    .values({ userId: id, state, updatedAt: new Date() })
    .onConflictDoUpdate({
      target: onboardingStates.userId,
      set: { state, updatedAt: new Date() },
    });

  return NextResponse.json({ ok: true });
}
