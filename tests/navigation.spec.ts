import { test, expect } from '@playwright/test';

test('all main routes return 200', async ({ page }) => {
  const routes = ['/', '/login', '/signup', '/admin', '/student'];
  for (const route of routes) {
    const response = await page.goto(`https://hall-meal-management.vercel.app${route}`);
    expect(response?.status()).toBeLessThan(500);
  }
});

test('signup page has 3-step text', async ({ page }) => {
  await page.goto('https://hall-meal-management.vercel.app/signup');
  await expect(page.locator('body')).toContainText('Verify Email');
  await expect(page.locator('body')).toContainText('Complete Profile');
  await expect(page.locator('body')).toContainText('Wait for Approval');
});

test('signup page has Join the Hall text', async ({ page }) => {
  await page.goto('https://hall-meal-management.vercel.app/signup');
  await expect(page.locator('body')).toContainText('Join the Hall');
});
