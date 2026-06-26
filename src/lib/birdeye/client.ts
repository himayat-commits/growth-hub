// Server-only Birdeye client. The x-api-key header is applied here and
// NEVER returned to the browser. In `mock` mode the client returns
// deterministic fake responses and never makes a network request.

import "server-only";
import type { AssembledRequest } from "./payloads";

/** What a single call actually does. */
export type ClientMode = "mock" | "live";

/** The deployment-wide switch (server-only env `PROVISION_MODE`):
 *  - `mock`           — nobody hits the real API (default; the kill switch).
 *  - `live_allowlist` — only allowlisted users go live; everyone else mock.
 *  - `live`           — every (paid) user goes live. */
export type ProvisionMode = "mock" | "live_allowlist" | "live";

/** Reads the deployment switch. Server-only: `PROVISION_MODE` is NOT
 *  `NEXT_PUBLIC_` (it must not be inlined into the browser bundle, and it
 *  must stay flippable at runtime so rollback to `mock` is instant). The
 *  `NEXT_PUBLIC_PROVISION_MODE` fallback is transitional — drop it once the
 *  Vercel env var has been renamed. */
export const getProvisionMode = (): ProvisionMode => {
  const raw = (
    process.env.PROVISION_MODE ??
    process.env.NEXT_PUBLIC_PROVISION_MODE ??
    "mock"
  ).toLowerCase();
  if (raw === "live") return "live";
  if (raw === "live_allowlist") return "live_allowlist";
  return "mock";
};

/** Resolves the effective per-call mode. Live calls only happen when the
 *  deployment switch allows it AND (for `live_allowlist`) the caller is
 *  allowlisted. Anything else degrades safely to `mock`. */
export const resolveEffectiveMode = (
  deploymentMode: ProvisionMode,
  isAllowlisted: boolean,
): ClientMode => {
  if (deploymentMode === "live") return "live";
  if (deploymentMode === "live_allowlist") return isAllowlisted ? "live" : "mock";
  return "mock";
};

/** Tolerant reader for the create-subaccount response. The mock returns
 *  `{ businessId }`; the live API shape is unconfirmed (may nest under
 *  `data`/`result`, or return `businessNumber`/`id`). Isolating the read
 *  here means only this function changes once the real shape is known. */
export function extractIdentifiers(response: unknown): {
  businessId?: string;
  businessNumber?: string;
} {
  const toStr = (v: unknown): string | undefined =>
    typeof v === "string" && v
      ? v
      : typeof v === "number"
        ? String(v)
        : undefined;
  const root = (response ?? {}) as Record<string, unknown>;
  const nested =
    (root.data as Record<string, unknown> | undefined) ??
    (root.result as Record<string, unknown> | undefined) ??
    root;
  const businessId =
    toStr(nested.businessId) ??
    toStr((nested as Record<string, unknown>).business_id) ??
    toStr(nested.id) ??
    toStr(root.businessId);
  const businessNumber =
    toStr(nested.businessNumber) ??
    toStr((nested as Record<string, unknown>).business_number) ??
    toStr(root.businessNumber) ??
    businessId;
  return { businessId, businessNumber };
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
const jitter = (min: number, max: number) => min + Math.random() * (max - min);

const ERROR_HINTS: Record<number, string> = {
  1052: "A required field is missing - check the request body against the Birdeye blueprint.",
  1161: "Invalid API key - confirm BIRDEYE_API_KEY in .env.local.",
  1167: "Birdeye rate limit hit - retry will back off automatically.",
  1100: "Auth failed - confirm reseller credentials and account access.",
};

export type CallResult = {
  ok: boolean;
  status: number;
  response: unknown;
  error?: string;
};

function fakeResponse(req: AssembledRequest, onboardingId: string): unknown {
  const tail = onboardingId.slice(-8).padStart(8, "0");
  switch (req.kind) {
    case "create_subaccount":
      return { businessId: `9${tail}`, status: "Created" };
    case "update_business":
      return { businessNumber: `9${tail}`, updated: true };
    case "add_media":
      return {
        mediaIds: req.req.body.media.map((_, i) => `media_${tail}_${i + 1}`),
        accepted: req.req.body.media.length,
      };
    case "create_user":
      return {
        userId: `usr_${tail}_${req.req.body.userEmailId.split("@")[0]}`,
        invited: true,
      };
    case "default_review_sources":
      return {
        configured: ["GOOGLE", "FACEBOOK"],
        businessIds: req.req.body.businessIds,
      };
    case "save_contact":
      return {
        contactId: `ctc_${tail}_${req.req.body.email ?? req.req.body.phone ?? "anon"}`,
      };
  }
}

export async function callBirdeye(
  req: AssembledRequest,
  ctx: { onboardingId: string; mode: ClientMode }
): Promise<CallResult> {
  await sleep(jitter(400, 1200));

  if (ctx.mode === "mock") {
    return {
      ok: true,
      status: 200,
      response: fakeResponse(req, ctx.onboardingId),
    };
  }

  const apiKey = process.env.BIRDEYE_API_KEY;
  if (!apiKey) {
    return {
      ok: false,
      status: 0,
      response: null,
      error: "BIRDEYE_API_KEY is not set on the server.",
    };
  }

  const headers: Record<string, string> = {
    Accept: "application/json",
    "Content-Type": "application/json",
    "x-api-key": apiKey,
  };
  if ("headers" in req.req) Object.assign(headers, req.req.headers);

  try {
    const res = await fetch(req.req.url, {
      method: req.req.method,
      headers,
      body: JSON.stringify(req.req.body),
    });
    const text = await res.text();
    let parsed: unknown = text;
    try {
      parsed = JSON.parse(text);
    } catch {
      /* not JSON */
    }
    if (!res.ok) {
      const code =
        typeof parsed === "object" && parsed && "code" in parsed
          ? Number((parsed as { code: unknown }).code)
          : undefined;
      const hint = code !== undefined ? ERROR_HINTS[code] : undefined;
      return {
        ok: false,
        status: res.status,
        response: parsed,
        error: hint ?? `Birdeye returned ${res.status}.`,
      };
    }
    return { ok: true, status: res.status, response: parsed };
  } catch (err) {
    return {
      ok: false,
      status: 0,
      response: null,
      error: err instanceof Error ? err.message : "Unknown network error",
    };
  }
}

/** Whether a failed result is worth retrying: network error (status 0),
 *  rate limit (429), or a 5xx. 4xx (bad request, auth) are not retried. */
const isTransient = (r: CallResult): boolean =>
  r.status === 0 || r.status === 429 || r.status >= 500;

/** callBirdeye with bounded exponential backoff on transient failures.
 *  Mock mode never fails transiently, so this is a no-op cost there. */
export async function callBirdeyeWithRetry(
  req: AssembledRequest,
  ctx: { onboardingId: string; mode: ClientMode },
  opts: { retries?: number } = {},
): Promise<CallResult> {
  const retries = opts.retries ?? 2;
  let result = await callBirdeye(req, ctx);
  for (let attempt = 1; attempt <= retries && !result.ok && isTransient(result); attempt++) {
    await sleep(jitter(400, 800) * attempt);
    result = await callBirdeye(req, ctx);
  }
  return result;
}
