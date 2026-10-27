import { defineConfig, devices } from "@playwright/test";

// Playwright config for the Growth Hub public-site smoke tests.
//
// Tests run against a deployed URL by default — set BASE_URL to the
// Vercel preview URL for PRs. Locally you can also point at
// http://localhost:3000 and run with `npm run dev` in another terminal.
//
// Setting BASE_URL: there is no cross-env in this repo, so set it per shell —
//   PowerShell : $env:BASE_URL="https://<preview>.vercel.app"; npm run test:e2e
//   bash/zsh   : BASE_URL=https://<preview>.vercel.app npm run test:e2e
// Against production use `npm run test:e2e:smoke:prod`
// (playwright.smoke.config.ts — defaults to thegrowthhub.com.au).
//
// The member-portal wizard and shop specs (and the global setup that seeded a
// test user into DATABASE_URL) were removed with those features in Oct 2026;
// they're at tag archive/member-portal-and-shop-2026-10. The smoke tests need
// no database.

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: process.env.CI ? 2 : undefined,
  reporter: [["list"], ["html", { open: "never" }]],
  use: {
    baseURL: process.env.BASE_URL ?? "http://localhost:3000",
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  projects: [
    { name: "chromium", use: { ...devices["Desktop Chrome"] } },
  ],
});
