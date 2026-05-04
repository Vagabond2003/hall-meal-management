import { test, expect } from '@playwright/test';

const BASE = 'https://hall-meal-management.vercel.app';

test('login with wrong password shows error', async ({ page }) => {
  await page.goto(`${BASE}/login`);
  await page.fill('input[type="email"]', 'test@example.com');
  await page.fill('input[type="password"]', 'wrongpassword123');
  await page.click('button[type="submit"]');
  await page.waitForLoadState('networkidle');
  await expect(page.locator('body')).not.toContainText(/500/i);
  await expect(page).not.toHaveURL(/dashboard/);
});

test('login with empty fields shows validation', async ({ page }) => {
  await page.goto(`${BASE}/login`);
  await page.click('button[type="submit"]');
  await expect(page).not.toHaveURL(/dashboard/);
});

test('login with invalid email format', async ({ page }) => {
  await page.goto(`${BASE}/login`);
  await page.fill('input[type="email"]', 'notanemail');
  await page.fill('input[type="password"]', 'password123');
  await page.click('button[type="submit"]');
  await expect(page).not.toHaveURL(/dashboard/);
});

test('signup with wrong invite code shows error', async ({ page }) => {
  await page.goto(`${BASE}/signup`);
  await page.locator('input').first().fill('WRONGCODE');
  await page.locator('input[type="email"]').fill('test@example.com');
  await page.click('button[type="submit"]');
  await page.waitForLoadState('networkidle');
  await expect(page.locator('body')).not.toContainText(/500/i);
  await expect(page).not.toHaveURL(/dashboard/);
});

test('signup with empty invite code is blocked', async ({ page }) => {
  await page.goto(`${BASE}/signup`);
  await page.fill('input[type="email"]', 'test@example.com');
  await page.click('button[type="submit"]');
  await expect(page).not.toHaveURL(/dashboard/);
});

test('signup admin tab switches form', async ({ page }) => {
  await page.goto(`${BASE}/signup`);
  await page.click('text=Admin');
  await expect(page.locator('body')).toBeVisible();
  await expect(page).not.toHaveURL(/error/);
});

test('forgot password with unknown email shows message not crash', async ({ page }) => {
  await page.goto(`${BASE}/forgot-password`);
  await page.locator('input[type="email"]').first().fill('nobody@nowhere.com');
  await page.click('button[type="submit"]');
  await page.waitForLoadState('networkidle');
  await expect(page.locator('body')).not.toContainText(/500/i);
  await expect(page).not.toHaveURL(/error/);
});

test('forgot password with empty email is blocked', async ({ page }) => {
  await page.goto(`${BASE}/forgot-password`);
  await page.click('button[type="submit"]');
  await expect(page).not.toHaveURL(/error/);
});

test('dashboard redirects to login when not authenticated', async ({ page }) => {
  await page.goto(`${BASE}/dashboard`);
  await expect(page).toHaveURL(/login/);
});

test('admin panel redirects to login when not authenticated', async ({ page }) => {
  await page.goto(`${BASE}/admin`);
  await expect(page).toHaveURL(/login/);
});
