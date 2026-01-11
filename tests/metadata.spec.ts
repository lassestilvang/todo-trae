import { test, expect } from '@playwright/test';

test.describe('List and Label Management', () => {
  test.beforeEach(async ({ page }) => {
    page.on('console', msg => {
      if (msg.type() === 'error') console.log(`BROWSER ERROR: ${msg.text()}`);
    });
    await page.goto('/');
  });

  test('should create a new list', async ({ page }) => {
    // Open Sidebar if mobile (optional but good practice)
    
    // Click on "+" button for lists
    // Need to find the exact selector for the list creation button
    // Let's check Sidebar.tsx
    await page.getByRole('button', { name: 'Add List' }).click();

    const listName = `New List ${Date.now()}`;
    await page.getByPlaceholder('List name').fill(listName);
    
    // Submit the form
    await page.getByRole('button', { name: 'Create List' }).click();

    // Verify list is created
    // The list appears in the sidebar
    await expect(page.locator('button').filter({ hasText: listName })).toBeVisible({ timeout: 10000 });
  });

  test('should create a new label', async ({ page }) => {
    const addLabelButton = page.getByRole('button', { name: 'Add Label' });
    await addLabelButton.scrollIntoViewIfNeeded();
    await addLabelButton.click();

    const labelName = `NewLabel${Date.now()}`;
    await page.getByPlaceholder('Label name').fill(labelName);
    
    // Submit the form
    await page.getByRole('button', { name: 'Create Label' }).click();

    // Verify label is created
    const labelButton = page.locator('button').filter({ hasText: labelName });
    await labelButton.scrollIntoViewIfNeeded();
    await expect(labelButton).toBeVisible({ timeout: 10000 });
  });
});
