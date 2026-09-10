import { Page } from '@playwright/test';

/**
 * Logs in as the test user via the Credentials provider.
 * Assumes a test user with email 'test@example.com' and password 'password123'
 * has been created in the database.
 */
export async function loginAsTestUser(page: Page): Promise<void> {
  await page.goto('/login');

  await page.getByLabel('Email address').fill('test@example.com');
  await page.getByLabel('Password').fill('password123');
  await page.getByRole('button', { name: 'Sign in' }).click();

  // Wait for redirect to home page after successful login
  await page.waitForURL('http://localhost:3000/', { timeout: 15000 });
  // Wait for the app to finish loading data and stabilize
  await page.waitForLoadState('networkidle', { timeout: 10000 });
}

