import { test, expect } from '@playwright/test';

test('login page loads', async ({ page }) => {
  await page.goto('https://hall-meal-management.vercel.app/login');
  await expect(page.locator('body')).toContainText(/ONLINE HALL MEAL MANAGER/i);
});

test('login page has email input', async ({ page }) => {
  await page.goto('https://hall-meal-management.vercel.app/login');
  const email = page.locator('input[type="email"]').first();
  await expect(email).toBeVisible();
});

test('login page has password input', async ({ page }) => {
  await page.goto('https://hall-meal-management.vercel.app/login');
  const password = page.locator('input[type="password"]').first();
  await expect(password).toBeVisible();
});

test('login page has submit button', async ({ page }) => {
  await page.goto('https://hall-meal-management.vercel.app/login');
  const button = page.locator('button[type="submit"]').first();
  await expect(button).toBeVisible();
});
