import { test, expect } from '@playwright/test';

test.describe('Task Management', () => {
  test.beforeEach(async ({ page }) => {
    page.on('console', msg => {
      console.log(`BROWSER ${msg.type().toUpperCase()}: ${msg.text()}`);
    });
    await page.goto('/');
    // Wait for the page to load and lists to be fetched
    await page.waitForSelector('button:has-text("Add task")');
    
    // Switch to "All Tasks" view to ensure all created tasks are visible
    // We use getByRole for better accessibility and reliability
    const allTasksButton = page.getByRole('button', { name: /^All/ });
    await allTasksButton.click();
    
    // Wait for the view to update and the heading to appear
    await expect(page.getByRole('heading', { name: 'All Tasks' })).toBeVisible();
  });

  test('should create a new task', async ({ page }) => {
    // Click on "Add task" button
    await page.getByRole('button', { name: 'Add task' }).first().click();

    // Fill in task details
    const taskName = `Test Task ${Date.now()}`;
    await page.getByPlaceholder('Task name').fill(taskName);
    await page.getByPlaceholder('Description (optional)').fill('This is a test task description');

    // Submit the form
    await page.getByRole('button', { name: 'Add Task' }).click();

    // Verify task is created and visible in the list
    await expect(page.getByRole('heading', { name: taskName })).toBeVisible({ timeout: 10000 });
  });

  test('should complete a task', async ({ page }) => {
    // Create a task first
    const taskName = `Task to complete ${Date.now()}`;
    await page.getByRole('button', { name: 'Add task' }).first().click();
    await page.getByPlaceholder('Task name').fill(taskName);
    await page.getByRole('button', { name: 'Add Task' }).click();

    // Find the task item and click the checkbox
    const taskItem = page.locator('.group').filter({ hasText: taskName });
    await expect(taskItem).toBeVisible({ timeout: 10000 });
    const checkbox = taskItem.getByRole('button', { name: /Mark task as/ });
    await checkbox.click();

    // Verify task is marked as completed (should have line-through style)
    const taskTitle = taskItem.getByRole('heading', { name: taskName });
    await expect(taskTitle).toHaveClass(/line-through/);
  });

  test('should delete a task', async ({ page }) => {
    // Create a task first
    const taskName = `Task to delete ${Date.now()}`;
    await page.getByRole('button', { name: 'Add task' }).first().click();
    await page.getByPlaceholder('Task name').fill(taskName);
    await page.getByRole('button', { name: 'Add Task' }).click();

    // Click on the task to open edit form
    const taskHeading = page.getByRole('heading', { name: taskName });
    await expect(taskHeading).toBeVisible({ timeout: 10000 });
    await taskHeading.click();

    // Handle the confirmation dialog
    page.on('dialog', async dialog => {
      expect(dialog.message()).toBe('Are you sure you want to delete this task?');
      await dialog.accept();
    });

    // Find and click delete button in the dialog header
    const dialog = page.getByRole('dialog');
    const deleteButton = dialog.locator('button:has(svg.lucide-trash2)');
    await deleteButton.click();

    // Verify task is removed from the list
    await expect(page.getByRole('heading', { name: taskName })).not.toBeVisible();
  });

  test('should edit a task', async ({ page }) => {
    // Create a task first
    const taskName = `Task to edit ${Date.now()}`;
    await page.getByRole('button', { name: 'Add task' }).first().click();
    await page.getByPlaceholder('Task name').fill(taskName);
    await page.getByRole('button', { name: 'Add Task' }).click();

    // Click on the task to open edit form
    const taskHeading = page.getByRole('heading', { name: taskName });
    await expect(taskHeading).toBeVisible({ timeout: 10000 });
    await taskHeading.click();

    // Update task details
    const updatedName = `${taskName} - updated`;
    await page.getByPlaceholder('Task name').fill(updatedName);
    await page.getByPlaceholder('Description (optional)').fill('Updated description');
    
    // Submit the form
    await page.getByRole('button', { name: 'Update Task' }).click();

    // Verify task is updated
    await expect(page.getByRole('heading', { name: updatedName })).toBeVisible();
    await expect(page.getByText('Updated description')).toBeVisible();
  });
});
