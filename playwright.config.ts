import { defineConfig, devices } from "@playwright/test";

// Playwright config for Growth Hub smoke tests.
//
// Tests run against a deployed URL by default — set BASE_URL to the
// Vercel preview URL for PRs (or to thegrowthhub.com.au for prod).
// Locally you can also point at http://localhost:3000 and run with
// `npm run dev` in another terminal.

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
