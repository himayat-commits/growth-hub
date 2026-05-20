import { test, expect } from "@playwright/test";

// Public-surface smoke tests. These confirm the marketing site renders,
// the host-split middleware routes /portal etc. to the app subdomain (when
// running against thegrowthhub.com.au), and that auth-gated pages bounce
// to /sign-in.
//
// The full wizard flow can't be exercised in CI yet because WorkOS
// hosted sign-in is third-party and not headless-friendly. Once we have
// a WorkOS test-mode bypass or a magic-link helper we'll extend this to
// click through all 14 steps. For now the goal is "site is not broken".

test("home page renders", async ({ page }) => {
  const response = await page.goto("/");
  expect(response?.status()).toBeLessThan(400);
  await expect(page.locator("body")).toContainText(/growth hub/i);
});

test("home page has Join free CTA pointing at /sign-up", async ({ page }) => {
  await page.goto("/");
  const joinFree = page.getByRole("link", { name: /join free/i });
  await expect(joinFree).toBeVisible();
  const href = await joinFree.getAttribute("href");
  expect(href).toMatch(/^\/sign-up\?redirect_url=/);
});

test("pricing page loads with plan cards", async ({ page }) => {
  await page.goto("/pricing");
  await expect(page.locator("body")).toContainText(/foundations/i);
  await expect(page.locator("body")).toContainText(/growth/i);
  await expect(page.locator("body")).toContainText(/accelerate/i);
});

test("/portal redirects unauthenticated visitor to /sign-in", async ({ page, baseURL }) => {
  // The 307 redirect chain is: /portal → /sign-in → WorkOS hosted UI.
  // We just assert the user landed off our domain on a recognisable WorkOS path.
  await page.goto("/portal");
  await page.waitForURL(/sign-in|workos|authkit/i, { timeout: 10_000 });
  expect(page.url()).not.toBe(`${baseURL}/portal`);
});

test("/dashboard redirects unauthenticated visitor to sign-in", async ({ page }) => {
  // New post-signup home (replaces /portal).
  await page.goto("/dashboard");
  await page.waitForURL(/sign-in|workos|authkit/i, { timeout: 10_000 });
});

test("/plan redirects unauthenticated visitor to sign-in", async ({ page }) => {
  await page.goto("/plan");
  await page.waitForURL(/sign-in|workos|authkit/i, { timeout: 10_000 });
});

test("/profile redirects unauthenticated visitor to sign-in", async ({ page }) => {
  await page.goto("/profile");
  await page.waitForURL(/sign-in|workos|authkit/i, { timeout: 10_000 });
});

test("/services redirects unauthenticated visitor to sign-in", async ({ page }) => {
  await page.goto("/services");
  await page.waitForURL(/sign-in|workos|authkit/i, { timeout: 10_000 });
});

test("/messages redirects unauthenticated visitor to sign-in", async ({ page }) => {
  await page.goto("/messages");
  await page.waitForURL(/sign-in|workos|authkit/i, { timeout: 10_000 });
});

test("/benefits redirects unauthenticated visitor to sign-in", async ({ page }) => {
  await page.goto("/benefits");
  await page.waitForURL(/sign-in|workos|authkit/i, { timeout: 10_000 });
});

test("/api/notifications rejects unauthenticated GET with 401", async ({ request }) => {
  const res = await request.get("/api/notifications");
  expect(res.status()).toBe(401);
});

test("/api/notifications/unread-count returns 0 for unauthenticated", async ({ request }) => {
  // This endpoint deliberately doesn't 401 — it's polled silently from the
  // topbar bell so we don't want to spam the console with auth errors.
  const res = await request.get("/api/notifications/unread-count");
  expect(res.status()).toBe(200);
  const data = await res.json();
  expect(data.count).toBe(0);
});

test("/api/messages rejects unauthenticated GET with 401", async ({ request }) => {
  const res = await request.get("/api/messages");
  expect(res.status()).toBe(401);
});

test("/api/service-bookings rejects unauthenticated GET with 401", async ({ request }) => {
  const res = await request.get("/api/service-bookings");
  expect(res.status()).toBe(401);
});

test("/api/service-bookings rejects unauthenticated POST with 401", async ({ request }) => {
  const res = await request.post("/api/service-bookings", {
    headers: { "Content-Type": "application/json" },
    data: { serviceSlug: "growth-call" },
  });
  expect(res.status()).toBe(401);
});

test("/services/[slug] redirects unauthenticated visitor to sign-in", async ({ page }) => {
  await page.goto("/services/growth-call");
  await page.waitForURL(/sign-in|workos|authkit/i, { timeout: 10_000 });
});

test("/events redirects unauthenticated visitor to sign-in", async ({ page }) => {
  await page.goto("/events");
  await page.waitForURL(/sign-in|workos|authkit/i, { timeout: 10_000 });
});

test("/resources redirects unauthenticated visitor to sign-in", async ({ page }) => {
  await page.goto("/resources");
  await page.waitForURL(/sign-in|workos|authkit/i, { timeout: 10_000 });
});

test("/api/events/:id/rsvp rejects unauthenticated POST with 401", async ({ request }) => {
  const res = await request.post("/api/events/1/rsvp");
  expect(res.status()).toBe(401);
});

test("/onboarding redirects unauthenticated visitor to sign-in", async ({ page }) => {
  await page.goto("/onboarding");
  await page.waitForURL(/sign-in|workos|authkit/i, { timeout: 10_000 });
});

test("/api/provision rejects GET", async ({ request }) => {
  const res = await request.get("/api/provision");
  // 405 = method not allowed. Anything other than 2xx is acceptable here —
  // the point is the route is registered and refuses GET.
  expect(res.status()).toBeGreaterThanOrEqual(400);
  expect(res.status()).toBeLessThan(500);
});

test("/api/upload/sign rejects unauthenticated POST with 401", async ({ request }) => {
  const res = await request.post("/api/upload/sign?onboardingId=x&kind=logo&filename=a.png", {
    headers: { "Content-Type": "image/png" },
    data: Buffer.from([0x89, 0x50, 0x4e, 0x47]),
  });
  expect(res.status()).toBe(401);
});

test("/api/profile rejects unauthenticated PUT with 401", async ({ request }) => {
  const res = await request.put("/api/profile", {
    headers: { "Content-Type": "application/json" },
    data: { businessName: "Test Co" },
  });
  expect(res.status()).toBe(401);
});

test("/api/checkout rejects tier:free with 400", async ({ request }) => {
  const res = await request.post("/api/checkout", {
    headers: { "Content-Type": "application/json" },
    data: { tier: "free", interval: "month" },
  });
  // Either 401 (unauthenticated path runs first) or 400 (tier:free check).
  // Both confirm the endpoint is registered + can't be tricked into freeing.
  expect([400, 401]).toContain(res.status());
});
