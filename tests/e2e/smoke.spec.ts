import { test, expect } from "@playwright/test";

// Public-surface smoke tests: the marketing pages render, the retired member
// portal / shop URLs redirect instead of 404ing, and the removed portal API
// routes are gone. No sign-in and no database needed.
//
// The member portal, shop, ops console, WorkOS sign-in and Stripe billing were
// removed in Oct 2026 (tag archive/member-portal-and-shop-2026-10).

const PUBLIC_PAGES = [
  "/",
  "/events",
  "/sites",
  "/partners",
  "/about",
  "/privacy",
  "/community-guidelines",
];

for (const path of PUBLIC_PAGES) {
  test(`${path} renders`, async ({ page }) => {
    const response = await page.goto(path);
    expect(response?.status()).toBeLessThan(400);
    await expect(page.locator("body")).toContainText(/growth hub/i);
  });
}

// Retired entry points → where next.config.ts sends them (308, permanent).
const RETIRED_REDIRECTS: Array<[string, string]> = [
  ["/sign-in", "/sites"],
  ["/sign-up", "/sites"],
  ["/portal", "/sites"],
  ["/dashboard", "/sites"],
  ["/plan", "/sites"],
  ["/shop", "/"],
  ["/shop/cart", "/"],
];

for (const [from, to] of RETIRED_REDIRECTS) {
  test(`${from} redirects to ${to}`, async ({ request }) => {
    const res = await request.get(from, { maxRedirects: 0 });
    expect(res.status()).toBe(308);
    expect(new URL(res.headers()["location"], "http://x").pathname).toBe(to);
  });
}

// Removed API routes now fall through to Payload's REST catch-all, which
// answers 404 for anything it doesn't know.
for (const path of ["/api/checkout", "/api/stripe/webhook", "/api/shop/checkout"]) {
  test(`POST ${path} is gone (404)`, async ({ request }) => {
    const res = await request.post(path, { data: {} });
    expect(res.status()).toBe(404);
  });
}
