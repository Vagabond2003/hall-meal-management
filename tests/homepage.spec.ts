import { test, expect } from '@playwright/test';

test('homepage loads with correct title', async ({ page }) => {
  await page.goto('https://hall-meal-management.vercel.app');
  await expect(page).toHaveTitle(/Online Hall Meal/);
});

test('homepage shows brand name somewhere', async ({ page }) => {
  await page.goto('https://hall-meal-management.vercel.app');
  await expect(page.locator('body')).toContainText(/ONLINE HALL MEAL MANAGER/i);
});

test('signup page loads', async ({ page }) => {
  await page.goto('https://hall-meal-management.vercel.app/signup');
  await expect(page.locator('body')).toContainText('Get Started in 3 Steps');
});

test('login page loads', async ({ page }) => {
  await page.goto('https://hall-meal-management.vercel.app/login');
  await expect(page.locator('body')).toContainText(/ONLINE HALL MEAL MANAGER/i);
});

test('homepage has no console errors', async ({ page }) => {
  const errors = [];
  page.on('console', msg => {
    if (msg.type() === 'error') errors.push(msg.text());
  });
  await page.goto('https://hall-meal-management.vercel.app');
  await page.waitForLoadState('networkidle');
  expect(errors).toHaveLength(0);
});

test('homepage looks good on mobile', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 667 });
  await page.goto('https://hall-meal-management.vercel.app');
  const bodyWidth = await page.evaluate(() => document.body.scrollWidth);
  const viewportWidth = await page.evaluate(() => window.innerWidth);
  expect(bodyWidth).toBeLessThanOrEqual(viewportWidth + 1);
});
