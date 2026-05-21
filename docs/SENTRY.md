# Sentry — error tracking

Sentry is wired via `@sentry/nextjs` and is **opt-in by environment variable**. If `SENTRY_DSN` is unset, `Sentry.init` is never called and the SDK is a no-op — local dev and preview builds work without any Sentry account.

## Wiring

| File | Role |
|---|---|
| `src/instrumentation.ts` | Server + Edge runtime init (Next.js `register` hook). Exports `onRequestError` for App Router request error capture. |
| `src/instrumentation-client.ts` | Browser init. Exports `onRouterTransitionStart` for client navigation error capture. |
| `src/app/global-error.tsx` | Root-layout error boundary. Reports to Sentry then renders Next's default error UI. |
| `next.config.ts` | Wrapped with `withSentryConfig` (over `withPayload`). Source map upload only fires when `SENTRY_AUTH_TOKEN` is present. |

## Env vars

| Variable | Where | Purpose |
|---|---|---|
| `SENTRY_DSN` | Server (all envs) | Server-side DSN. Unset → no-op. |
| `NEXT_PUBLIC_SENTRY_DSN` | Client (Vercel) | Browser DSN. Same value as `SENTRY_DSN` in practice. |
| `SENTRY_ORG` | Build only | Sentry org slug, e.g. `himayat`. |
| `SENTRY_PROJECT` | Build only | Sentry project slug, e.g. `growth-hub`. |
| `SENTRY_AUTH_TOKEN` | Build only (CI) | Source map upload token. Skip locally. |

## Sampling

- **Production** — 10% trace sample on Node, 5% on Edge and browser.
- **Preview / dev** — 0% traces. Only explicit `captureException` calls and unhandled errors are sent.
- Session replay is disabled.

## PII scrubbing

`beforeSend` in `src/instrumentation.ts` strips:

- request body (`event.request.data`) — wizard collects business PII
- cookies and `Cookie` headers
- `authorization` and `stripe-signature` headers
- user email, username, IP
- query string values for keys outside a known-safe allowlist (`plan`, `interval`, `tab`, `step`, `sort`)

`sendDefaultPii` is forced to `false`.

## Tagged paths

Server-side `Sentry.captureException` calls are tagged so they're filterable in the Sentry UI:

| Tag | Meaning |
|---|---|
| `area=stripe.webhook` + `phase=verify\|handle\|notification\|referral_credit` | Stripe webhook failures |
| `area=auth.callback` + `phase=welcome_seed\|referral` | Sign-in callback failures |
| `area=provision` + `step=create_subaccount\|notify_ops\|notification` | Birdeye provisioning failures |
| `area=referral_credit` + `phase=stripe_balance\|notification` | Referral credit issuance failures |

## Adding a new captured path

```ts
import * as Sentry from '@sentry/nextjs';

try {
  await thing();
} catch (e) {
  console.error('[area.subarea] human-readable label', e);
  Sentry.captureException(e, { tags: { area: 'feature', phase: 'step' } });
}
```

Keep the `console.error` alongside — Vercel logs are still the primary signal for live debugging; Sentry is for aggregation, alerting, and history.
