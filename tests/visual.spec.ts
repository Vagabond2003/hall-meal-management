import { test, expect } from '@playwright/test';

const BASE = 'https://hall-meal-management.vercel.app';

const pages = [
  { name: 'login', url: '/login' },
  { name: 'signup', url: '/signup' },
  { name: 'forgot-password', url: '/forgot-password' },
  { name: 'pending-approval', url: '/pending-approval' },
  { name: 'deactivated', url: '/deactivated' },
];

for (const p of pages) {
  test(`${p.name} - desktop looks correct`, async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto(`${BASE}${p.url}`);
    await page.waitForLoadState('networkidle');
    await expect(page).toHaveScreenshot(`${p.name}-desktop.png`, {
      fullPage: true,
      maxDiffPixelRatio: 0.02,
    });
  });

  test(`${p.name} - mobile looks correct`, async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto(`${BASE}${p.url}`);
    await page.waitForLoadState('networkidle');
    await expect(page).toHaveScreenshot(`${p.name}-mobile.png`, {
      fullPage: true,
      maxDiffPixelRatio: 0.02,
    });
  });
}
