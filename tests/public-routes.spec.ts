import { test, expect } from '@playwright/test';

const BASE = 'https://hall-meal-management.vercel.app';

const publicRoutes = [
  '/',
  '/login',
  '/signup',
  '/forgot-password',
  '/reset-password',
  '/pending-approval',
  '/deactivated',
];

for (const route of publicRoutes) {
  test(`${route} is publicly accessible`, async ({ page }) => {
    const response = await page.goto(`${BASE}${route}`);
    expect(response?.status()).toBeLessThan(500);
    await expect(page).not.toHaveURL(/login.*callbackUrl/);
  });

  test(`${route} has no console errors`, async ({ page }) => {
    const errors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') errors.push(msg.text());
    });
    await page.goto(`${BASE}${route}`);
    await page.waitForLoadState('networkidle');
    expect(errors).toHaveLength(0);
  });
}
