import { test, expect } from '@playwright/test';

test('signup page has invite code field', async ({ page }) => {
  await page.goto('https://hall-meal-management.vercel.app/signup');
  const inviteInput = page.locator('input').first();
  await expect(inviteInput).toBeVisible();
});

test('signup page has email field', async ({ page }) => {
  await page.goto('https://hall-meal-management.vercel.app/signup');
  const emailInput = page.locator('input[type="email"]').first();
  await expect(emailInput).toBeVisible();
});

test('signup page has submit button', async ({ page }) => {
  await page.goto('https://hall-meal-management.vercel.app/signup');
  const submitButton = page.locator('button[type="submit"]').first();
  await expect(submitButton).toBeVisible();
});
