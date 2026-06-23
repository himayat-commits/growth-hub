// Best-effort, in-memory sliding-window rate limiter for unauthenticated
// public endpoints (contact / newsletter / expo-apply).
//
// IMPORTANT: on serverless (Vercel) each instance has its own memory, so this
// throttles bursts that hit a single warm instance but is NOT a global limit.
// It's a cheap first layer that stops the obvious "script hammering one warm
// lambda" abuse with zero new infrastructure. For production-grade,
// cross-instance limiting, back this with a shared store (e.g. Upstash Redis)
// — keep the same call sites and swap the implementation here.
//
// Fails OPEN: any internal error allows the request rather than risk blocking
// legitimate traffic.

import 'server-only';

interface Bucket {
  count: number;
  resetAt: number;
}

const buckets = new Map<string, Bucket>();

export interface RateLimitResult {
  ok: boolean;
  remaining: number;
  retryAfterSec: number;
}

/**
 * Fixed-window limiter: at most `limit` hits per `windowMs` for a given key.
 * Returns ok=false (with a Retry-After hint) once the window is exhausted.
 */
export function rateLimit(key: string, limit = 5, windowMs = 60_000): RateLimitResult {
  try {
    const now = Date.now();
    const existing = buckets.get(key);

    if (!existing || existing.resetAt <= now) {
      buckets.set(key, { count: 1, resetAt: now + windowMs });
      // Opportunistic GC so the map can't grow unbounded across many IPs.
      if (buckets.size > 10_000) {
        for (const [k, v] of buckets) {
          if (v.resetAt <= now) buckets.delete(k);
        }
      }
      return { ok: true, remaining: limit - 1, retryAfterSec: 0 };
    }

    if (existing.count >= limit) {
      return { ok: false, remaining: 0, retryAfterSec: Math.ceil((existing.resetAt - now) / 1000) };
    }

    existing.count += 1;
    return { ok: true, remaining: limit - existing.count, retryAfterSec: 0 };
  } catch {
    return { ok: true, remaining: limit, retryAfterSec: 0 }; // fail open
  }
}

/** Best-effort client IP from standard proxy headers (Vercel sets x-forwarded-for). */
export function clientIp(req: Request): string {
  const xff = req.headers.get('x-forwarded-for');
  if (xff) return xff.split(',')[0]!.trim();
  return req.headers.get('x-real-ip') ?? 'unknown';
}

/** Standard 429 JSON response with a Retry-After header. */
export function tooManyRequests(retryAfterSec: number): Response {
  return new Response(
    JSON.stringify({ error: 'Too many requests. Please wait a moment and try again.' }),
    {
      status: 429,
      headers: {
        'Content-Type': 'application/json',
        'Retry-After': String(Math.max(1, retryAfterSec)),
      },
    },
  );
}
