// Next.js instrumentation hook. Fires once per server runtime startup.
// We use it to initialise Sentry for the Node and Edge runtimes.
// If SENTRY_DSN is unset, both init calls are no-ops — dev and preview
// environments don't need a Sentry project to run.

import * as Sentry from '@sentry/nextjs';

export async function register() {
  // Config-coherence warnings, once per server start. Import lazily — the
  // check lib is server-only and irrelevant on the edge runtime.
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    try {
      const { runProvisioningHealthChecks } = await import('@/lib/ops/config-health');
      for (const check of runProvisioningHealthChecks()) {
        if (check.level !== 'pass') {
          console.warn(`[config-health] ${check.level.toUpperCase()} ${check.name}: ${check.detail}`);
        }
      }
    } catch (e) {
      console.warn('[config-health] checks failed to run', e);
    }
  }

  const dsn = process.env.SENTRY_DSN;
  if (!dsn) return;

  if (process.env.NEXT_RUNTIME === 'nodejs') {
    Sentry.init({
      dsn,
      environment: process.env.VERCEL_ENV ?? process.env.NODE_ENV,
      release: process.env.VERCEL_GIT_COMMIT_SHA,
      tracesSampleRate: process.env.VERCEL_ENV === 'production' ? 0.1 : 0,
      sendDefaultPii: false,
      beforeSend: scrub,
    });
  }

  if (process.env.NEXT_RUNTIME === 'edge') {
    Sentry.init({
      dsn,
      environment: process.env.VERCEL_ENV ?? process.env.NODE_ENV,
      release: process.env.VERCEL_GIT_COMMIT_SHA,
      tracesSampleRate: process.env.VERCEL_ENV === 'production' ? 0.05 : 0,
      sendDefaultPii: false,
      beforeSend: scrub,
    });
  }
}

// Required for Next.js's request error reporting to reach Sentry.
export const onRequestError = Sentry.captureRequestError;

// Strip data that should never leave our infrastructure:
//   - request body and form data (wizard collects business PII)
//   - cookies and auth headers
//   - any query string values beyond a known-safe allowlist
const SAFE_QUERY_KEYS = new Set(['plan', 'interval', 'tab', 'step', 'sort']);

function scrub(event: Sentry.ErrorEvent): Sentry.ErrorEvent | null {
  const req = event.request;
  if (req) {
    delete req.data;
    delete req.cookies;
    if (req.headers) {
      delete req.headers['cookie'];
      delete req.headers['Cookie'];
      delete req.headers['authorization'];
      delete req.headers['Authorization'];
      delete req.headers['stripe-signature'];
    }
    if (req.query_string && typeof req.query_string === 'string') {
      req.query_string = req.query_string
        .split('&')
        .map((p) => {
          const [k, v] = p.split('=');
          return SAFE_QUERY_KEYS.has(k) ? `${k}=${v}` : `${k}=[Filtered]`;
        })
        .join('&');
    }
  }
  if (event.user) {
    delete event.user.email;
    delete event.user.username;
    delete event.user.ip_address;
  }
  return event;
}
