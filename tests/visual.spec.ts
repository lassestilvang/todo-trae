import { test, expect } from '@playwright/test';

async function setTheme(page: any, theme: 'light' | 'dark' | 'system') {
  await page.addInitScript((t) => {
    try { localStorage.setItem('theme', t); } catch {}
  }, theme);
}

test.describe('Visual smoke', () => {
test('Home light and dark screenshots', async ({ page, browserName }) => {
    const dir = process.env.SCREENSHOT_DIR || 'screenshots';
    await setTheme(page, 'light');
    await page.goto('/');
    await expect(page.locator('main')).toBeVisible();
    await page.screenshot({ path: `${dir}/${browserName}-light.png`, fullPage: true });

    await setTheme(page, 'dark');
    await page.reload();
    await expect(page.locator('main')).toBeVisible();
    await page.screenshot({ path: `${dir}/${browserName}-dark.png`, fullPage: true });
  });
});