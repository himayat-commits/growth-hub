// Provisioning log sink.
//
// Writes every step of a Birdeye provisioning run to the Neon
// `provisioning_logs` table. Ops can inspect what was sent and what
// came back, and the retry UX reads the latest row per user to decide
// whether to suggest a retry or surface an error.
//
// `id` in the function signature is the WorkOS user id (matches
// onboarding_states.userId).

import "server-only";
import { getDb } from "@/lib/db";
import { provisioningLogs } from "@/lib/db/schema";

export async function appendProvisioningLog(
  id: string,
  entry: { step: number; kind: string; payload: unknown; response: unknown; ok: boolean; error?: string }
): Promise<void> {
  try {
    await getDb().insert(provisioningLogs).values({
      userId: id,
      step: entry.step,
      kind: entry.kind,
      ok: entry.ok,
      payload: entry.payload as object,
      response: (entry.response as object | null) ?? null,
      error: entry.error ?? null,
    });
  } catch (e) {
    // Audit logging must never fail the provisioning run. Mirror to console
    // so Vercel function logs still capture the attempt.
    console.error(
      `[provision] audit write failed user=${id} step=${entry.step} kind=${entry.kind} ok=${entry.ok}`,
      e
    );
  }
}
