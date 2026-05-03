import { test, expect } from '@playwright/test';

test('signup page is responsive on mobile', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 667 });
  await page.goto('https://hall-meal-management.vercel.app/signup');
  const bodyWidth = await page.evaluate(() => document.body.scrollWidth);
  const viewportWidth = await page.evaluate(() => window.innerWidth);
  expect(bodyWidth).toBeLessThanOrEqual(viewportWidth + 1);
});

test('login page is responsive on mobile', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 667 });
  await page.goto('https://hall-meal-management.vercel.app/login');
  const bodyWidth = await page.evaluate(() => document.body.scrollWidth);
  const viewportWidth = await page.evaluate(() => window.innerWidth);
  expect(bodyWidth).toBeLessThanOrEqual(viewportWidth + 1);
});

test('signup page has no console errors', async ({ page }) => {
  const errors = [];
  page.on('console', msg => {
    if (msg.type() === 'error') errors.push(msg.text());
  });
  await page.goto('https://hall-meal-management.vercel.app/signup');
  await page.waitForLoadState('networkidle');
  expect(errors).toHaveLength(0);
});

test('login page has no console errors', async ({ page }) => {
  const errors = [];
  page.on('console', msg => {
    if (msg.type() === 'error') errors.push(msg.text());
  });
  await page.goto('https://hall-meal-management.vercel.app/login');
  await page.waitForLoadState('networkidle');
  expect(errors).toHaveLength(0);
});
