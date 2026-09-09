import { defineConfig, devices } from "@playwright/test";

// Public-surface smoke run against production (or any BASE_URL) — used by
// `npm run test:e2e:smoke:prod`.
//
// Differences from playwright.config.ts, on purpose:
//   • only tests/e2e/smoke.spec.ts — the wizard/shop specs need the
//     PLAYWRIGHT_TEST_TOKEN bypass, which is disabled in production (404).
//   • no globalSetup/globalTeardown — those seed/delete the test user in
//     DATABASE_URL, which must never happen against production (and
//     scripts/_guard.mjs would refuse anyway). Smoke tests need no DB.
//   • baseURL defaults to production; override with BASE_URL as usual
//     (see the note in playwright.config.ts for per-shell syntax).
export default defineConfig({
  testDir: "./tests/e2e",
  testMatch: /smoke\.spec\.ts$/,
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: [["list"], ["html", { open: "never" }]],
  use: {
    baseURL: process.env.BASE_URL ?? "https://thegrowthhub.com.au",
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
});
