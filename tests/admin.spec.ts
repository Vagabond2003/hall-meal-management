import { test, expect } from '@playwright/test';

test('admin page loads without 500 error', async ({ page }) => {
  const response = await page.goto('https://hall-meal-management.vercel.app/admin');
  expect(response?.status()).toBeLessThan(500);
});

test('admin page shows brand', async ({ page }) => {
  await page.goto('https://hall-meal-management.vercel.app/admin');
  await expect(page.locator('body')).toContainText(/ONLINE HALL MEAL MANAGER/i);
});

test('admin page has no console errors', async ({ page }) => {
  const errors = [];
  page.on('console', msg => {
    if (msg.type() === 'error') errors.push(msg.text());
  });
  await page.goto('https://hall-meal-management.vercel.app/admin');
  await page.waitForLoadState('networkidle');
  expect(errors).toHaveLength(0);
});

test('admin page is responsive', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 667 });
  await page.goto('https://hall-meal-management.vercel.app/admin');
  const bodyWidth = await page.evaluate(() => document.body.scrollWidth);
  const viewportWidth = await page.evaluate(() => window.innerWidth);
  expect(bodyWidth).toBeLessThanOrEqual(viewportWidth + 1);
});
