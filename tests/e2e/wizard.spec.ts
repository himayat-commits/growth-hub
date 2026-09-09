// Playwright E2E — full 14-step Birdeye onboarding wizard.
//
// Prerequisites (all handled by global-setup + the test auth endpoint):
//   • PLAYWRIGHT_TEST_TOKEN must be set in the environment / .env.local
//   • DATABASE_URL must be set so global-setup can seed the test user rows
//   • The dev server must be running (BASE_URL=http://localhost:3000 by default)
//   • PROVISION_MODE defaults to mock (server-only; the old NEXT_PUBLIC_ var is
//     ignored), so no real Birdeye calls happen
//
// Strategy:
//   1. POST /api/test/auth to set the __gh_test_uid session cookie.
//   2. Inject a fully pre-filled wizard state into localStorage before the
//      first page load — this lets the wizard skip field-filling and go
//      straight to clicking Continue on every step.
//   3. Walk each step by clicking Continue →, verifying the URL advances.
//   4. On the review page, click "Launch my Birdeye account" and assert
//      that the stream completes and navigates to /onboarding/done.
//
// Why localStorage injection?
//   We're testing the wizard navigation, SSE provisioning stream, and done
//   page — not individual form fields (those are covered by unit tests).
//   Skipping UI-level field filling makes the test faster, cheaper to
//   maintain, and less brittle to label/placeholder changes.

import { test, expect, type Page } from '@playwright/test';

// ─── Constants ────────────────────────────────────────────────────────────────

const TEST_USER_ID = 'user_playwright_001';
const TEST_EMAIL   = 'playwright@test.himayat.com.au';
const LS_KEY       = `gh_wizard_${TEST_USER_ID}`;

// ─── Pre-filled wizard state ──────────────────────────────────────────────────
// All required fields are set. Using the 'foundations' package so the
// 'webchat' step is skipped (accelerate-only).

const FILLED_STATE = {
  onboardingId: TEST_USER_ID,
  packageId:    'foundations',
  status:       'draft',
  createdAt:    '2024-01-01T00:00:00.000Z',
  updatedAt:    '2024-01-01T00:00:00.000Z',
  adminUser: {
    firstName: 'Playwright',
    lastName:  'Test',
    email:     TEST_EMAIL,
    phone:     '0412345678',
    role:      'admin',
  },
  additionalUsers: [],
  business: {
    name:            'Playwright Test Business',
    alias:           '',
    abn:             '',
    establishedYear: undefined,
    timezone:        'Australia/Sydney',
    languages:       ['English'],
  },
  address: {
    address1:              '1 Test Street',
    address2:              '',
    subLocality:           '',
    city:                  'Sydney',
    state:                 'NSW',
    zip:                   '2000',
    countryCode:           'AU',
    phone:                 '+61212345678',
    localPhoneNumber:      '',
    tollFreePhoneNumber:   '',
    fax:                   '',
    emailId:               TEST_EMAIL,
    websiteUrl:            'https://example.com',
    isAddressHidden:       false,
    isServiceAreaProvider: false,
    serviceAreas:          [],
  },
  hours: {
    is24x7: false,
    status: 'Open',
    weekly: [
      { index: 0, label: 'Monday',    isOpen: true,  windows: [{ start: '09:00', end: '17:00' }] },
      { index: 1, label: 'Tuesday',   isOpen: true,  windows: [{ start: '09:00', end: '17:00' }] },
      { index: 2, label: 'Wednesday', isOpen: true,  windows: [{ start: '09:00', end: '17:00' }] },
      { index: 3, label: 'Thursday',  isOpen: true,  windows: [{ start: '09:00', end: '17:00' }] },
      { index: 4, label: 'Friday',    isOpen: true,  windows: [{ start: '09:00', end: '17:00' }] },
      { index: 5, label: 'Saturday',  isOpen: false, windows: [{ start: '10:00', end: '14:00' }] },
      { index: 6, label: 'Sunday',    isOpen: false, windows: [{ start: '10:00', end: '14:00' }] },
    ],
    special:    [],
    reopenDate: undefined,
  },
  about: {
    vision:             'To deliver reliable software solutions.',
    offerings:          'Software testing, automation, and QA services.',
    usp:                'End-to-end Playwright-driven testing.',
    idealCustomer:      'Software development teams who value quality.',
    competitorEdge:     'Faster feedback cycles via automated E2E coverage.',
    benefits:           'Fewer regressions, more confidence in deployments.',
    cta:                'Book a free audit today.',
    competitors:        '',
    marketingBudget:    '',
    marketingPainPoints:'',
  },
  descriptions: {
    birdeye:  'Playwright Test Business is a software testing consultancy based in Sydney, specialising in end-to-end automation.',
    google:   '',
    facebook: '',
    apple:    '',
  },
  taxonomy: {
    gmbPrimary:       'Software Testing Company',
    gmbAdditional:    [],
    birdeyeCategory:  'Software',
    // Array per taxonomySchema — a bare string here crashes the taxonomy
    // page's birdeyeSubs.join() once the seeded state is adopted.
    birdeyeSubs:      [],
    appleCategories:  [],
    fbCategories:     [],
    services:         '',
    keywords:         'playwright, e2e, testing, automation',
    products:         '',
    payment:          ['EFTPOS', 'Bank Transfer'],
    appointmentLink:  '',
    reservationLink:  '',
    menuLink:         '',
    orderAheadLink:   '',
  },
  assets: {
    logoUrl:          'https://placehold.co/100x100.png',
    birdeyeCoverUrl:  'https://placehold.co/1110x374.png',
    googleCoverUrl:   '',
    facebookCoverUrl: '',
    showcase:         [],
  },
  social: {
    google:    '',
    facebook:  '',
    instagram: '',
    x:         '',
    linkedin:  '',
    youtube:   '',
    pinterest: '',
  },
  faqs:     [],
  contacts: [],
  webchat:  undefined,
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Call the test auth endpoint to establish the session cookie. */
async function loginAsTestUser(page: Page) {
  const token = process.env.PLAYWRIGHT_TEST_TOKEN;
  if (!token) throw new Error('PLAYWRIGHT_TEST_TOKEN is not set');

  // Need to visit the domain first so we can set cookies for it.
  await page.goto('/');

  const res = await page.request.post('/api/test/auth', {
    data: { token },
  });
  expect(res.status(), 'POST /api/test/auth should return 200').toBe(200);
}

/** Inject pre-filled wizard state into localStorage. */
async function seedWizardState(page: Page) {
  await page.evaluate(
    ([key, state]) => { localStorage.setItem(key, JSON.stringify(state)); },
    [LS_KEY, FILLED_STATE] as [string, typeof FILLED_STATE],
  );
}

/** Click Continue → and wait for URL to change. */
async function clickContinue(page: Page) {
  const btn = page.getByRole('button', { name: /continue/i });
  await expect(btn).toBeEnabled({ timeout: 10_000 });
  await btn.click();
}

/** Neon client for direct DB assertions/cleanup — same driver + env that
 *  tests/setup/global-setup.ts uses (playwright.config loads .env.local). */
async function neonSql() {
  if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL is not set');
  const { neon } = await import('@neondatabase/serverless');
  return neon(process.env.DATABASE_URL);
}

/** Wipe the test user's provisioning footprint so a test starts from "never
 *  launched". global-teardown removes the same rows at the very end. */
async function resetProvisioningRows() {
  const sql = await neonSql();
  await sql`DELETE FROM provisioning_logs  WHERE user_id = ${TEST_USER_ID}`;
  await sql`DELETE FROM provisioning_tasks WHERE user_id = ${TEST_USER_ID}`;
  await sql`DELETE FROM onboarding_states  WHERE user_id = ${TEST_USER_ID}`;
}

// ─── The tests ────────────────────────────────────────────────────────────────

test.describe('Onboarding wizard (mock provisioning)', () => {
  // Both provisioning tests act on the SAME seeded user (one onboarding row,
  // one rate-limit bucket), so they cannot overlap — the double-launch test
  // resets the row it needs and the wizard walk expects an un-launched user.
  test.describe.configure({ mode: 'serial' });

  test('walks all steps and completes provisioning', async ({ page }) => {
    // ── 1. Establish session ─────────────────────────────────────────────────
    await loginAsTestUser(page);

    // ── 2. Seed localStorage with pre-filled state ───────────────────────────
    // Navigate to the first wizard page so the domain is established, then
    // seed localStorage and reload so the WizardContext picks it up.
    await page.goto('/onboarding/confirm');
    await seedWizardState(page);
    await page.reload();
    await expect(page).toHaveURL(/\/onboarding\/confirm/);

    // ── 3. Step 01 — Confirm package & contact ───────────────────────────────
    await clickContinue(page);
    await expect(page).toHaveURL(/\/onboarding\/business/, { timeout: 10_000 });

    // ── 4. Step 02 — Business identity ──────────────────────────────────────
    await clickContinue(page);
    await expect(page).toHaveURL(/\/onboarding\/address/, { timeout: 10_000 });

    // ── 5. Step 03 — Address & contact ──────────────────────────────────────
    await clickContinue(page);
    await expect(page).toHaveURL(/\/onboarding\/hours/, { timeout: 10_000 });

    // ── 6. Step 04 — Hours of operation ─────────────────────────────────────
    // Default state has Mon–Fri open, so Continue is already enabled.
    await clickContinue(page);
    await expect(page).toHaveURL(/\/onboarding\/about/, { timeout: 10_000 });

    // ── 7. Step 05 — About & descriptions ───────────────────────────────────
    await clickContinue(page);
    await expect(page).toHaveURL(/\/onboarding\/taxonomy/, { timeout: 10_000 });

    // ── 8. Step 06 — Categories & keywords ──────────────────────────────────
    await clickContinue(page);
    await expect(page).toHaveURL(/\/onboarding\/assets/, { timeout: 10_000 });

    // ── 9. Step 07 — Brand assets ────────────────────────────────────────────
    // logoUrl + birdeyeCoverUrl are pre-seeded so Continue is enabled.
    await clickContinue(page);
    await expect(page).toHaveURL(/\/onboarding\/social/, { timeout: 10_000 });

    // ── 10. Step 08 — Social profiles (all optional) ─────────────────────────
    await clickContinue(page);
    await expect(page).toHaveURL(/\/onboarding\/faqs/, { timeout: 10_000 });

    // ── 11. Step 09 — FAQs (optional for foundations) ───────────────────────
    await clickContinue(page);
    // webchat is accelerate-only — foundations goes straight to contacts.
    await expect(page).toHaveURL(/\/onboarding\/contacts/, { timeout: 10_000 });

    // ── 12. Step 10 — Initial contacts (optional) ───────────────────────────
    await clickContinue(page);
    await expect(page).toHaveURL(/\/onboarding\/review/, { timeout: 10_000 });

    // ── 13. Review & launch ──────────────────────────────────────────────────
    const launchBtn = page.getByRole('button', { name: /launch/i });
    await expect(launchBtn).toBeVisible();
    await launchBtn.click();

    // The streaming checklist replaces the summary the moment Launch is
    // clicked — first phase row should appear immediately.
    await expect(page.getByText('Creating your Birdeye account')).toBeVisible({
      timeout: 10_000,
    });

    // Mock provisioning takes ~400–1200 ms per step (5–6 steps = 2–7 s).
    // We give it 45 s to account for slow CI runners.
    await expect(page).toHaveURL(/\/onboarding\/done/, { timeout: 45_000 });
  });

  test('concurrent double-launch creates exactly one sub-account', async ({ page }) => {
    // A mock run is ~0.4–1.2 s per step; two racing POSTs + a third + DB
    // round-trips comfortably fit, with slack for slow CI.
    test.setTimeout(90_000);

    // ── Fresh slate: no onboarding row, no logs for this user ─────────────
    await resetProvisioningRows();

    // ── Session cookie (shared by page.request) ──────────────────────────
    await loginAsTestUser(page);

    // ── Two simultaneous launches with the same seeded state ─────────────
    // /api/provision seeds the onboarding row from the body when none exists
    // (provisioning block reset server-side), then races for the run lease.
    // Exactly one may win: it streams SSE; the other must 409 alreadyRunning
    // (either from the fresh-`running` fast path or the lease itself).
    const launch = () =>
      page.request.post('/api/provision', {
        data: { state: FILLED_STATE },
        // The winner's response is a stream that only ends when the run does.
        timeout: 60_000,
      });
    const [a, b] = await Promise.all([launch(), launch()]);

    const isStream = (r: typeof a) =>
      r.status() === 200 && (r.headers()['content-type'] ?? '').includes('text/event-stream');
    const streams = [a, b].filter(isStream);
    const rejected = [a, b].filter((r) => !isStream(r));
    expect(streams, 'exactly one launch should stream').toHaveLength(1);
    expect(rejected, 'exactly one launch should be turned away').toHaveLength(1);

    expect(rejected[0].status()).toBe(409);
    const rejectedBody = (await rejected[0].json()) as { alreadyRunning?: boolean };
    expect(rejectedBody.alreadyRunning).toBe(true);

    // The winner's stream must have reached the terminal "done" event.
    const streamText = await streams[0].text();
    expect(streamText).toContain('"type":"done"');
    expect(streamText).toContain('"mode":"mock"');

    // ── Third launch: idempotent short-circuit, no stream, no new run ────
    // Under PROVISION_MODE=mock the mock-provisioned row IS provisioned for
    // this caller (the test user is never on PROVISION_ALLOWLIST).
    const c = await page.request.post('/api/provision', { data: { state: FILLED_STATE } });
    expect(c.status()).toBe(200);
    expect(c.headers()['content-type'] ?? '').toContain('application/json');
    const third = (await c.json()) as { alreadyProvisioned?: boolean; businessNumber?: string };
    expect(third.alreadyProvisioned).toBe(true);
    expect(third.businessNumber).toBeTruthy();

    // ── The billable step ran exactly once ───────────────────────────────
    const sql = await neonSql();
    const rows = (await sql`
      SELECT count(*)::int AS c
      FROM provisioning_logs
      WHERE user_id = ${TEST_USER_ID} AND kind = 'create_subaccount'
    `) as Array<{ c: number }>;
    expect(rows[0]?.c, 'create_subaccount must be logged exactly once').toBe(1);

    // ── The persisted run is tagged with the mode it executed under ──────
    const state = (await sql`
      SELECT state->'provisioning'->>'mode'      AS mode,
             state->'provisioning'->>'runStatus' AS run_status
      FROM onboarding_states
      WHERE user_id = ${TEST_USER_ID}
    `) as Array<{ mode: string | null; run_status: string | null }>;
    expect(state[0]?.run_status).toBe('provisioned');
    expect(state[0]?.mode).toBe('mock');

    // Leave the user un-launched again for whichever test runs next.
    await resetProvisioningRows();
  });

  test('/api/test/auth returns 403 for wrong token', async ({ request }) => {
    const res = await request.post('/api/test/auth', {
      data: { token: 'definitely-not-the-right-token' },
    });
    expect(res.status()).toBe(403);
  });
});
