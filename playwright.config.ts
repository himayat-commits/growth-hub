import { defineConfig, devices } from "@playwright/test";
import * as dotenv from "dotenv";
import * as path from "path";

// Load .env.local for local dev runs so DATABASE_URL and PLAYWRIGHT_TEST_TOKEN
// are available without having to export them manually. (process.cwd() rather
// than __dirname — the config is loaded as ESM where __dirname doesn't exist.)
dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });

// Playwright config for Growth Hub smoke tests + E2E wizard flow.
//
// Tests run against a deployed URL by default — set BASE_URL to the
// Vercel preview URL for PRs (or to thegrowthhub.com.au for prod).
// Locally you can also point at http://localhost:3000 and run with
// `npm run dev` in another terminal.
//
// The wizard.spec.ts test requires:
//   • PLAYWRIGHT_TEST_TOKEN — must match the env var on the running server
//   • DATABASE_URL          — used by global-setup to seed test user rows
//   • A running Next.js dev/preview server (npm run dev or deployed)

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: process.env.CI ? 2 : undefined,
  reporter: [["list"], ["html", { open: "never" }]],
  globalSetup:    "./tests/setup/global-setup.ts",
  globalTeardown: "./tests/setup/global-teardown.ts",
  use: {
    baseURL: process.env.BASE_URL ?? "http://localhost:3000",
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  projects: [
    { name: "chromium", use: { ...devices["Desktop Chrome"] } },
  ],
});
