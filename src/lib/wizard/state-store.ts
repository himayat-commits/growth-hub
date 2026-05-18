// Provisioning log sink.
//
// In Birdeye-Portal this wrote a JSON file to disk in dev and console.log'd
// on Vercel. We keep the same shape (console.log everywhere) since console
// output is visible in Vercel's runtime logs and that's the only place we
// need to inspect a provisioning run after the fact. If we ever want
// durable audit history, swap this for an INSERT into a `provisioning_log`
// Neon table — the call sites won't need to change.

import "server-only";

export async function appendProvisioningLog(
  id: string,
  entry: { step: number; kind: string; payload: unknown; response: unknown; ok: boolean }
): Promise<void> {
  console.log(
    `[provision] ${id} step=${entry.step} kind=${entry.kind} ok=${entry.ok}`,
    { payload: entry.payload, response: entry.response }
  );
}
