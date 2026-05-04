import { test, expect } from '@playwright/test';

const BASE = 'https://hall-meal-management.vercel.app';

const adminRoutes = [
  '/admin/dashboard',
  '/admin/analytics',
  '/admin/announcements',
  '/admin/invite-codes',
  '/admin/meal-attendance',
  '/admin/settings',
  '/admin/students',
  '/admin/weekly-menu',
];

const studentRoutes = [
  '/student/dashboard',
  '/student/announcements',
  '/student/billing',
  '/student/history',
  '/student/meal-selection',
];

for (const route of adminRoutes) {
  test(`admin route ${route} redirects to login when not authenticated`, async ({ page }) => {
    await page.goto(`${BASE}${route}`);
    await expect(page).toHaveURL(/login/);
  });
}

for (const route of studentRoutes) {
  test(`student route ${route} redirects to login when not authenticated`, async ({ page }) => {
    await page.goto(`${BASE}${route}`);
    await expect(page).toHaveURL(/login/);
  });
}
