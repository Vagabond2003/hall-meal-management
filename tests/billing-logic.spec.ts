import { test, expect } from '@playwright/test';
const BASE = 'https://hall-meal-management.vercel.app';

test.describe('Billing API Security', () => {
  test('GET /api/admin/billing-summary rejects unauthenticated', async ({ request }) => {
    const res = await request.get(`${BASE}/api/admin/billing-summary`);
    expect(res.status()).not.toBe(200);
    expect([401, 403, 302, 307, 308]).toContain(res.status());
  });
  test('POST /api/admin/billing/recalculate rejects unauthenticated', async ({ request }) => {
    const res = await request.post(`${BASE}/api/admin/billing/recalculate`, { data: {} });
    expect(res.status()).not.toBe(200);
    expect([401, 403, 302, 307, 308]).toContain(res.status());
  });
  test('GET /api/student/billing rejects unauthenticated', async ({ request }) => {
    const res = await request.get(`${BASE}/api/student/billing`);
    expect(res.status()).not.toBe(200);
    expect([401, 403, 302, 307, 308]).toContain(res.status());
  });
  test('GET /api/student/bill-pdf rejects unauthenticated', async ({ request }) => {
    const res = await request.get(`${BASE}/api/student/bill-pdf`);
    expect(res.status()).not.toBe(200);
    expect([401, 403, 302, 307, 308]).toContain(res.status());
  });
  test('PATCH /api/admin/billing/[id] rejects unauthenticated', async ({ request }) => {
    const res = await request.patch(`${BASE}/api/admin/billing/test-id`, { data: { is_paid: true } });
    expect(res.status()).not.toBe(200);
    expect([401, 403, 302, 307, 308]).toContain(res.status());
  });
});

test.describe('Billing Pages', () => {
  test('student billing page loads without 500', async ({ page }) => {
    const response = await page.goto(`${BASE}/student/billing`);
    expect(response?.status()).toBeLessThan(500);
  });
  test('student billing page redirects to login when not authenticated', async ({ page }) => {
    await page.goto(`${BASE}/student/billing`);
    await expect(page).toHaveURL(/login/);
  });
  test('admin billing routes redirect to login when not authenticated', async ({ page }) => {
    await page.goto(`${BASE}/admin/students`);
    await expect(page).toHaveURL(/login/);
  });
});
