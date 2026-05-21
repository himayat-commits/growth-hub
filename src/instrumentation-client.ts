// Browser-side Sentry init. Loaded automatically by Next.js when present.
// No DSN → no-op, so previews and local dev don't ship telemetry.

import * as Sentry from '@sentry/nextjs';

const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN;

if (dsn) {
  Sentry.init({
    dsn,
    environment: process.env.NEXT_PUBLIC_VERCEL_ENV ?? 'development',
    release: process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA,
    tracesSampleRate: process.env.NEXT_PUBLIC_VERCEL_ENV === 'production' ? 0.05 : 0,
    sendDefaultPii: false,
    // Session replay is intentionally disabled — cost + noise outweigh value
    // until we have a specific debugging need.
    replaysSessionSampleRate: 0,
    replaysOnErrorSampleRate: 0,
    beforeSend(event) {
      // Belt-and-suspenders: strip cookies/auth from browser events too.
      if (event.request?.headers) {
        delete event.request.headers['cookie'];
        delete event.request.headers['authorization'];
      }
      if (event.user) {
        delete event.user.email;
        delete event.user.ip_address;
      }
      return event;
    },
  });
}

// Required for Next.js App Router router-transition error capture.
export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
