import { test, expect } from '@playwright/test';

const BASE = 'https://hall-meal-management.vercel.app';

// These APIs should all reject unauthenticated requests
const protectedApis = [
  { method: 'GET',  url: '/api/student/settings' },
  { method: 'GET',  url: '/api/student/weekly-menu?startDate=2025-01-01&endDate=2025-01-07' },
  { method: 'GET',  url: '/api/student/selections?startDate=2025-01-01&endDate=2025-01-07' },
  { method: 'POST', url: '/api/student/selections' },
  { method: 'POST', url: '/api/student/bulk-selection' },
  { method: 'GET',  url: '/api/admin/meal-slots' },
];

for (const api of protectedApis) {
  test(`${api.method} ${api.url} rejects unauthenticated request`, async ({ request }) => {
    const res = await request[api.method.toLowerCase() as 'get' | 'post'](
      `${BASE}${api.url}`,
      api.method === 'POST' ? { data: {} } : undefined
    );
    expect(res.status()).not.toBe(200);
    expect([401, 403, 302, 307, 308]).toContain(res.status());
  });
}
