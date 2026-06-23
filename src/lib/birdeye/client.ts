// Server-only Birdeye client. The x-api-key header is applied here and
// NEVER returned to the browser. In `mock` mode the client returns
// deterministic fake responses and never makes a network request.

import "server-only";
import type { AssembledRequest } from "./payloads";

export type ClientMode = "mock" | "live";

export const getMode = (): ClientMode =>
  (process.env.NEXT_PUBLIC_PROVISION_MODE as ClientMode) === "live"
    ? "live"
    : "mock";

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

// Retry/timeout policy for live calls. Centralised here so every step of the
// provisioning sequence is resilient, rather than relying on a single ad-hoc
// retry at one call site.
const MAX_ATTEMPTS = 3;
const TIMEOUT_MS = 15_000;

function isRateLimited(parsed: unknown): boolean {
  return (
    typeof parsed === "object" &&
    parsed !== null &&
    "code" in parsed &&
    Number((parsed as { code: unknown }).code) === 1167
  );
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

  // One network attempt, aborted after TIMEOUT_MS so a hung Birdeye call can't
  // stall the SSE provisioning stream indefinitely.
  const attempt = async (): Promise<CallResult> => {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
    try {
      const res = await fetch(req.req.url, {
        method: req.req.method,
        headers,
        body: JSON.stringify(req.req.body),
        signal: controller.signal,
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
      const aborted = err instanceof Error && err.name === "AbortError";
      return {
        ok: false,
        status: 0,
        response: null,
        error: aborted
          ? `Birdeye request timed out after ${TIMEOUT_MS}ms.`
          : err instanceof Error
            ? err.message
            : "Unknown network error",
      };
    } finally {
      clearTimeout(timer);
    }
  };

  // Retry transient failures (network error / timeout / 5xx / rate-limit 1167)
  // with exponential backoff + jitter. 4xx and success return immediately.
  let result = await attempt();
  for (let n = 1; n < MAX_ATTEMPTS; n++) {
    const transient =
      !result.ok &&
      (result.status === 0 || result.status >= 500 || isRateLimited(result.response));
    if (!transient) break;
    await sleep(Math.min(8000, 500 * 2 ** (n - 1)) + jitter(0, 250));
    result = await attempt();
  }
  return result;
}
