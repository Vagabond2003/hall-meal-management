import { test, expect } from '@playwright/test';

const BASE = 'https://hall-meal-management.vercel.app';

test('GET /api/student/daily-menu rejects unauthenticated request', async ({ request }) => {
  const res = await request.get(`${BASE}/api/student/daily-menu`);
  expect(res.status()).not.toBe(200);
  expect([401, 403, 302, 307, 308]).toContain(res.status());
});
