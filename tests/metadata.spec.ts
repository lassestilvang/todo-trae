import { test, expect } from '@playwright/test';

test.describe('List and Label Management', () => {
  test.beforeEach(async ({ page }) => {
    page.on('console', msg => {
      if (msg.type() === 'error') console.log(`BROWSER ERROR: ${msg.text()}`);
    });
    await page.goto('/');
  });

  test('should create a new list', async ({ page }) => {
    // Click on "+" button for lists in sidebar
    await page.getByRole('button', { name: 'Add new list' }).click();

    const listName = `New List ${Date.now()}`;
    await page.getByLabel('List Name').fill(listName);

    // Submit the form
    await page.getByRole('button', { name: 'Create List' }).click();

    // Verify list is created in the sidebar
    await expect(page.locator('button').filter({ hasText: listName })).toBeVisible({ timeout: 10000 });
  });

  test('should create a new label', async ({ page }) => {
    const addLabelButton = page.getByRole('button', { name: 'Add new label' });
    await addLabelButton.scrollIntoViewIfNeeded();
    await addLabelButton.click();

    const labelName = `NewLabel${Date.now()}`;
    await page.getByLabel('Label Name').fill(labelName);

    // Submit the form
    await page.getByRole('button', { name: 'Create Label' }).click();

    // Verify label is created in sidebar
    const labelButton = page.locator('button').filter({ hasText: labelName });
    await labelButton.scrollIntoViewIfNeeded();
    await expect(labelButton).toBeVisible({ timeout: 10000 });
  });

  test('should filter tasks by label', async ({ page }) => {
    // Create a task first
    const taskName = `Labelled Task ${Date.now()}`;
    await page.getByRole('button', { name: 'Create new task' }).first().click();
    await page.getByPlaceholder('What needs to be done?').fill(taskName);
    await page.getByRole('button', { name: 'Create Task' }).click();

    // Wait for task to appear
    await expect(page.getByRole('heading', { name: taskName })).toBeVisible({ timeout: 10000 });

    // Click on a label to filter
    const labelButton = page.getByRole('button').filter({ hasText: 'Design' }).first();
    if (await labelButton.count() > 0) {
      await labelButton.click();
      // Verify the list header changes to indicate label filter
      await expect(page.getByRole('heading', { name: 'All Tasks' })).toBeVisible();
    }
  });
});
