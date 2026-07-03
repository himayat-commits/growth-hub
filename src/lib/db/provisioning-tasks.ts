// CRUD for the tracked manual-handoff checklist (provisioning_tasks).
// Written by lib/ops/notify.ts at handoff time; read/toggled by the
// /ops/provisioning console. Writes never throw — the customer is already
// provisioned when these fire, so losing a task row must not fail a run
// (mirrors appendProvisioningLog's stance).

import "server-only";
import { and, desc, eq, inArray, sql } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { provisioningTasks, type ProvisioningTask } from "@/lib/db/schema";

export type TaskKind =
  | "modules"
  | "webchat"
  | "apple_description"
  | "apple_categories"
  | "faqs"
  | "contact_tags"
  | "retry_failed_steps";

export type HandoffTask = {
  kind: TaskKind;
  label: string;
  snapshot: unknown;
};

/** Upsert the handoff checklist for a user after a provisioning run.
 *
 *  Rules per (user, kind):
 *  - no row → insert as open
 *  - open row → refresh label/snapshot (a re-run may change failedSteps etc.)
 *  - done row → stays done, EXCEPT retry_failed_steps which reopens with the
 *    fresh failures.
 *  `resolveRetry` (a fully-provisioned run) closes retry_failed_steps as
 *  done-by-system instead. */
export async function upsertHandoffTasks(
  userId: string,
  tasks: HandoffTask[],
  opts?: { resolveRetry?: boolean },
): Promise<void> {
  const db = getDb();
  try {
    for (const task of tasks) {
      const reopens = task.kind === "retry_failed_steps";
      await db
        .insert(provisioningTasks)
        .values({
          userId,
          taskKind: task.kind,
          status: "open",
          label: task.label,
          snapshot: task.snapshot ?? {},
        })
        .onConflictDoUpdate({
          target: [provisioningTasks.userId, provisioningTasks.taskKind],
          set: reopens
            ? {
                status: "open",
                label: task.label,
                snapshot: task.snapshot ?? {},
                doneAt: null,
                doneBy: null,
              }
            : {
                // Refresh content only while still open; a done task keeps
                // its done state AND its done-time snapshot.
                label: sql`CASE WHEN ${provisioningTasks.status} = 'open' THEN ${task.label} ELSE ${provisioningTasks.label} END`,
                snapshot: sql`CASE WHEN ${provisioningTasks.status} = 'open' THEN ${JSON.stringify(task.snapshot ?? {})}::jsonb ELSE ${provisioningTasks.snapshot} END`,
              },
        });
    }
    if (opts?.resolveRetry) {
      await db
        .update(provisioningTasks)
        .set({ status: "done", doneAt: sql`now()`, doneBy: "system" })
        .where(
          and(
            eq(provisioningTasks.userId, userId),
            eq(provisioningTasks.taskKind, "retry_failed_steps"),
            eq(provisioningTasks.status, "open"),
          ),
        );
    }
  } catch (e) {
    console.error("[provisioning-tasks] upsert failed", e);
  }
}

export async function listTasksForUser(userId: string): Promise<ProvisioningTask[]> {
  return getDb()
    .select()
    .from(provisioningTasks)
    .where(eq(provisioningTasks.userId, userId))
    .orderBy(provisioningTasks.status, provisioningTasks.createdAt);
}

export async function listOpenTasks(limit = 200): Promise<ProvisioningTask[]> {
  return getDb()
    .select()
    .from(provisioningTasks)
    .where(eq(provisioningTasks.status, "open"))
    .orderBy(desc(provisioningTasks.createdAt))
    .limit(limit);
}

export async function setTaskStatus(
  id: number,
  status: "open" | "done",
  doneBy: string,
): Promise<void> {
  await getDb()
    .update(provisioningTasks)
    .set(
      status === "done"
        ? { status, doneAt: sql`now()`, doneBy }
        : { status, doneAt: null, doneBy: null },
    )
    .where(eq(provisioningTasks.id, id));
}

/** Open-task counts for a set of users (list-page badge). */
export async function countOpenTasksByUser(
  userIds: string[],
): Promise<Record<string, number>> {
  if (userIds.length === 0) return {};
  const rows = await getDb()
    .select({
      userId: provisioningTasks.userId,
      count: sql<number>`count(*)::int`,
    })
    .from(provisioningTasks)
    .where(
      and(eq(provisioningTasks.status, "open"), inArray(provisioningTasks.userId, userIds)),
    )
    .groupBy(provisioningTasks.userId);
  return Object.fromEntries(rows.map((r) => [r.userId, r.count]));
}
