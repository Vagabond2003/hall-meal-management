import { test, expect } from '@playwright/test';

const BASE = 'https://hall-meal-management.vercel.app';

const unprotectedAdminApis = [
  { method: 'GET',  url: '/api/admin/weekly-menu' },
  { method: 'POST', url: '/api/admin/weekly-menu' },
  { method: 'POST', url: '/api/admin/weekly-menu/copy' },
];

for (const api of unprotectedAdminApis) {
  test(`${api.method} ${api.url} rejects unauthenticated request`, async ({ request }) => {
    const res = await request[api.method.toLowerCase() as 'get' | 'post'](
      `${BASE}${api.url}`,
      api.method === 'POST' ? { data: {} } : undefined
    );
    expect(res.status()).not.toBe(200);
    expect([401, 403, 302, 307, 308]).toContain(res.status());
  });
}
