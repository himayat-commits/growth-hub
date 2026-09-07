import { test, expect, type Page } from '@playwright/test';

// Shop (merch) smoke tests.
//
// Two tiers:
//   - Always: /shop and /shop/cart render, empty states, API validation,
//     /orders and /ops routes are gated, /shop/success guards its param.
//   - With a published product (SHOP_TEST_SLUG env, default `growth-hub-tee`
//     from `npm run shop:seed-demo`): variant picking, add-to-cart persistence,
//     cart quantity/remove, and the checkout hand-off to Stripe (mocked so no
//     session is created in CI; the real route is additionally exercised when
//     STRIPE_SHIPPING_RATE_STANDARD is configured).

const SLUG = process.env.SHOP_TEST_SLUG ?? 'growth-hub-tee';

async function productExists(page: Page): Promise<boolean> {
  const res = await page.goto(`/shop/${SLUG}`);
  return !!res && res.status() < 400 && (await page.getByTestId('add-to-cart').count()) > 0;
}

test.describe('shop — always', () => {
  test('/shop renders the storefront', async ({ page }) => {
    const res = await page.goto('/shop');
    expect(res?.status()).toBeLessThan(400);
    await expect(page.getByRole('heading', { level: 1 })).toContainText(/community/i);
    await expect(page.getByRole('link', { name: /^shop$/i }).first()).toBeVisible();
    await expect(page.getByTestId('nav-cart')).toBeVisible();
  });

  test('/shop/cart shows the empty state', async ({ page }) => {
    await page.goto('/shop/cart');
    await expect(page.getByTestId('cart-empty')).toContainText(/empty/i);
    await expect(page.getByRole('link', { name: /browse the shop/i })).toBeVisible();
  });

  test('POST /api/shop/checkout rejects an invalid body', async ({ request }) => {
    const res = await request.post('/api/shop/checkout', { data: { items: [] } });
    expect(res.status()).toBe(400);
  });

  test('POST /api/shop/checkout 409s for an unknown SKU (or 503 when shipping rates are not configured)', async ({ request }) => {
    const res = await request.post('/api/shop/checkout', {
      data: { items: [{ sku: 'NOPE-DOES-NOT-EXIST', qty: 1 }], email: 'guest@example.com' },
    });
    expect([409, 503]).toContain(res.status());
  });

  test('GET /api/shop/products reports unknown SKUs as missing', async ({ request }) => {
    const res = await request.get('/api/shop/products?skus=NOPE-1,NOPE-2');
    expect(res.ok()).toBeTruthy();
    const body = (await res.json()) as { items: unknown[]; missing: string[] };
    expect(body.items).toHaveLength(0);
    expect(body.missing).toEqual(['NOPE-1', 'NOPE-2']);
  });

  test('/shop/success without a session id bounces to /shop', async ({ page }) => {
    await page.goto('/shop/success');
    await page.waitForURL(/\/shop$/);
  });

  test('/orders redirects unauthenticated visitor to sign-in', async ({ page }) => {
    await page.goto('/orders');
    await page.waitForURL(/sign-in|workos|authkit/i, { timeout: 10_000 });
  });

  test('PATCH /api/ops/orders/:id is forbidden without ops auth', async ({ request }) => {
    const res = await request.patch('/api/ops/orders/999999', { data: { status: 'shipped' } });
    expect([401, 403]).toContain(res.status());
  });

  test('PATCH /api/ops/inventory/:sku is forbidden without ops auth', async ({ request }) => {
    const res = await request.patch('/api/ops/inventory/GH-TEE-M-TEAL', { data: { delta: 1 } });
    expect([401, 403]).toContain(res.status());
  });
});

test.describe('shop — with a published product', () => {
  test.beforeEach(async ({ page }) => {
    test.skip(!(await productExists(page)), `No published product at /shop/${SLUG} — run npm run shop:seed-demo`);
  });

  test('product card appears on /shop', async ({ page }) => {
    await page.goto('/shop');
    await expect(page.getByTestId('product-card').first()).toBeVisible();
  });

  test('variant picking, add to cart, badge persists across reload', async ({ page }) => {
    await page.goto(`/shop/${SLUG}`);
    // Pick the first enabled chip in every axis (sold-out chips are disabled).
    for (const group of await page.getByRole('radiogroup').all()) {
      const enabled = group.getByRole('radio').and(page.locator(':not([disabled])'));
      if ((await enabled.count()) > 0) await enabled.first().click();
    }
    const add = page.getByTestId('add-to-cart');
    await expect(add).toBeEnabled();
    await add.click();
    await expect(page.getByTestId('nav-cart-count')).toHaveText('1');
    await page.reload();
    await expect(page.getByTestId('nav-cart-count')).toHaveText('1');
  });

  test('cart: quantity stepper and remove', async ({ page }) => {
    await page.goto(`/shop/${SLUG}`);
    for (const group of await page.getByRole('radiogroup').all()) {
      const enabled = group.getByRole('radio').and(page.locator(':not([disabled])'));
      if ((await enabled.count()) > 0) await enabled.first().click();
    }
    await page.getByTestId('add-to-cart').click();
    await page.goto('/shop/cart');
    const line = page.getByTestId('cart-line').first();
    await expect(line).toBeVisible();
    await line.getByRole('button', { name: /increase quantity/i }).click();
    await expect(page.getByTestId('nav-cart-count')).toHaveText('2');
    await line.getByRole('button', { name: /^remove$/i }).click();
    await expect(page.getByTestId('cart-empty')).toBeVisible();
  });

  test('checkout hands off to Stripe (mocked)', async ({ page }) => {
    await page.goto(`/shop/${SLUG}`);
    for (const group of await page.getByRole('radiogroup').all()) {
      const enabled = group.getByRole('radio').and(page.locator(':not([disabled])'));
      if ((await enabled.count()) > 0) await enabled.first().click();
    }
    await page.getByTestId('add-to-cart').click();
    await page.goto('/shop/cart');

    await page.route('**/api/shop/checkout', (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ url: 'https://checkout.stripe.com/c/pay/cs_test_mock' }) }),
    );
    await page.route('https://checkout.stripe.com/**', (route) => route.fulfill({ status: 200, body: 'mock' }));
    const nav = page.waitForRequest(/checkout\.stripe\.com/);
    await page.getByTestId('checkout').click();
    await nav;
  });

  test('real checkout route returns a Stripe URL when configured', async ({ request }) => {
    test.skip(!process.env.STRIPE_SHIPPING_RATE_STANDARD, 'Stripe shipping rates not configured in this environment');
    const products = (await (await request.get('/api/shop/products?skus=GH-TEE-M-TEAL')).json()) as {
      items: Array<{ sku: string; stock: number }>;
    };
    test.skip(!products.items[0] || products.items[0].stock < 1, 'Demo SKU not in stock');
    const res = await request.post('/api/shop/checkout', {
      data: { items: [{ sku: 'GH-TEE-M-TEAL', qty: 1 }], email: 'playwright@test.himayat.com.au' },
    });
    expect(res.status()).toBe(200);
    const body = (await res.json()) as { url: string };
    expect(body.url).toMatch(/^https:\/\/checkout\.stripe\.com\//);
  });
});
