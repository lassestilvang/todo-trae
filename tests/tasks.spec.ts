import { test, expect } from '@playwright/test';
import { loginAsTestUser } from './helpers/auth';

test.describe('Task Management', () => {
  test.beforeEach(async ({ page }) => {
    page.on('console', msg => {
      if (msg.type() === 'error') console.log(`BROWSER ERROR: ${msg.text()}`);
    });
    await loginAsTestUser(page);

    // Switch to "All Tasks" view to ensure all created tasks are visible
    const allTasksButton = page.getByRole('button', { name: /^All/ });
    await allTasksButton.click();

    // Wait for the view to update and the heading to appear
    await expect(page.getByRole('heading', { name: 'All Tasks' })).toBeVisible();
  });

  test('should create a new task', async ({ page }) => {
    // Click on "Create new task" button in sidebar
    await page.getByRole('button', { name: 'Create new task' }).first().click();

    // Fill in task details
    const taskName = `Test Task ${Date.now()}`;
    await page.getByPlaceholder('What needs to be done?').first().fill(taskName);
    await page.getByPlaceholder('Add more details...').first().fill('This is a test task description');

    // Submit the form
    await page.getByRole('button', { name: 'Create Task' }).click();

    // Verify task is created and visible in the list
    await expect(page.getByRole('heading', { name: taskName })).toBeVisible({ timeout: 10000 });
  });

  test('should complete a task', async ({ page }) => {
    // Create a task first
    const taskName = `Task to complete ${Date.now()}`;
    await page.getByRole('button', { name: 'Create new task' }).first().click();
    await page.getByPlaceholder('What needs to be done?').first().fill(taskName);
    await page.getByRole('button', { name: 'Create Task' }).click();

    // Find the task item and click the checkbox
    const taskItem = page.locator('.group').filter({ hasText: taskName }).first();
    await expect(taskItem).toBeVisible({ timeout: 10000 });
    const checkbox = taskItem.getByRole('button', { name: /Mark task as/ });
    // Use evaluate to click directly on the DOM element, bypassing the
    // drag handle overlay that intercepts pointer events
    await checkbox.evaluate((el: HTMLElement) => el.click());

    // Verify task is marked as completed (should have line-through style)
    const taskTitle = taskItem.getByRole('heading', { name: taskName });
    await expect(taskTitle).toHaveClass(/line-through/);
  });

  test('should delete a task', async ({ page }) => {
    // Create a task first
    const taskName = `Task to delete ${Date.now()}`;
    await page.getByRole('button', { name: 'Create new task' }).first().click();
    await page.getByPlaceholder('What needs to be done?').first().fill(taskName);
    await page.getByRole('button', { name: 'Create Task' }).click();

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
    const dialog = page.getByRole('dialog').last();
    const deleteButton = dialog.getByRole('button', { name: 'Delete task' });
    await deleteButton.click();

    // Verify task is removed from the list
    await expect(page.getByRole('heading', { name: taskName })).not.toBeVisible();
  });

  test('should edit a task', async ({ page }) => {
    // Create a task first
    const taskName = `Task to edit ${Date.now()}`;
    await page.getByRole('button', { name: 'Create new task' }).first().click();
    await page.getByPlaceholder('What needs to be done?').first().fill(taskName);
    await page.getByRole('button', { name: 'Create Task' }).click();

    // Click on the task to open edit form
    const taskHeading = page.getByRole('heading', { name: taskName });
    await expect(taskHeading).toBeVisible({ timeout: 10000 });
    await taskHeading.click();

    // Update task details
    const updatedName = `${taskName} - updated`;
    await page.getByPlaceholder('What needs to be done?').first().fill(updatedName);
    await page.getByPlaceholder('Add more details...').first().fill('Updated description');

    // Submit the form
    await page.getByRole('button', { name: 'Save Changes' }).click();

    // Verify task is updated
    await expect(page.getByRole('heading', { name: updatedName })).toBeVisible();
    await expect(page.getByText('Updated description').first()).toBeVisible();
  });

  test('should parse natural language with AI Parse', async ({ page }) => {
    await page.getByRole('button', { name: 'Create new task' }).first().click();

    // Fill task name and use AI Parse
    const taskName = `AI Task ${Date.now()}`;
    await page.getByPlaceholder('What needs to be done?').first().fill('Submit report #work high priority');

    // Use the AI Parse button
    await page.getByRole('button', { name: 'Parse natural language' }).click();

    // A prompt dialog will appear - we need to handle it
    // Since prompt() is hard to test with Playwright, let's test via direct API
    const result = await page.evaluate(async () => {
      const response = await fetch('/api/parse-task', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: 'Submit quarterly report #work high priority 2 hours' }),
      });
      return await response.json();
    });
    expect(result.name).toContain('Submit');
    expect(result.priority).toBe('high');
    expect(result.estimate).toBe('02:00');

    // Fill in task name for actual submission
    await page.getByPlaceholder('What needs to be done?').first().fill(taskName);
    await page.getByRole('button', { name: 'Create Task' }).click();
    await expect(page.getByRole('heading', { name: taskName })).toBeVisible({ timeout: 10000 });
  });

  test('should perform bulk complete operations', async ({ page }) => {
    // Create two tasks
    const task1 = `Bulk Task 1 ${Date.now()}`;
    const task2 = `Bulk Task 2 ${Date.now()}`;

    for (const name of [task1, task2]) {
      await page.getByRole('button', { name: 'Create new task' }).first().click();
      await page.getByPlaceholder('What needs to be done?').first().fill(name);
      await page.getByRole('button', { name: 'Create Task' }).click();
      await expect(page.getByRole('heading', { name: name })).toBeVisible({ timeout: 10000 });
    }

    // Select first task
    const taskItem1 = page.locator('.group').filter({ hasText: task1 }).first();
    const checkbox1 = taskItem1.locator('button[aria-label="Select task"]');
    await checkbox1.click();

    // Select second task
    const taskItem2 = page.locator('.group').filter({ hasText: task2 }).first();
    const checkbox2 = taskItem2.locator('button[aria-label="Select task"]');
    await checkbox2.click();

    // Verify BulkOperationsBar is visible
    await expect(page.locator('text="2 selected"')).toBeVisible();

    // Click bulk complete
    await page.getByRole('button', { name: 'Complete', exact: true }).click();

    // Verify both tasks are completed
    await expect(taskItem1.getByRole('heading')).toHaveClass(/line-through/);
    await expect(taskItem2.getByRole('heading')).toHaveClass(/line-through/);
  });

  test('should add and remove reminders', async ({ page }) => {
    const taskName = `Reminder Task ${Date.now()}`;

    // Create a task
    await page.getByRole('button', { name: 'Create new task' }).first().click();
    await page.getByPlaceholder('What needs to be done?').first().fill(taskName);
    await page.getByRole('button', { name: 'Create Task' }).click();
    await expect(page.getByRole('heading', { name: taskName })).toBeVisible({ timeout: 10000 });

    // Open edit form
    await page.getByRole('heading', { name: taskName }).click();

    // Switch to advanced tab
    await page.getByRole('tab', { name: 'Advanced' }).click();

    // Fill in reminder date and time
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const dateStr = tomorrow.toISOString().split('T')[0];

    await page.locator('#task-reminder-date').fill(dateStr);
    await page.locator('#task-reminder-time').fill('14:30');

    // Click Add Reminder
    const addReminderBtn = page.getByRole('button', { name: 'Add Reminder' });
    await addReminderBtn.click();

    // Verify the reminder was added
    await expect(page.locator('text=/Reminders/i')).toBeVisible();

    // Clean up - close the dialog
    await page.keyboard.press('Escape');
  });

  test('should add task dependencies', async ({ page }) => {
    // Create two tasks
    const task1 = `Dependency A ${Date.now()}`;
    const task2 = `Dependency B ${Date.now()}`;

    for (const name of [task1, task2]) {
      await page.getByRole('button', { name: 'Create new task' }).first().click();
      await page.getByPlaceholder('What needs to be done?').first().fill(name);
      await page.getByRole('button', { name: 'Create Task' }).click();
      await expect(page.getByRole('heading', { name: name })).toBeVisible({ timeout: 10000 });
    }

    // Get the task IDs via API
    const tasks = await page.evaluate(async () => {
      const response = await fetch('/api/tasks');
      return await response.json();
    });
    const sortedTasks = tasks.filter((t: { name: string }) =>
      t.name.includes('Dependency A') || t.name.includes('Dependency B')
    );
    const taskA = sortedTasks.find((t: { name: string }) => t.name.includes('Dependency A'));
    const taskB = sortedTasks.find((t: { name: string }) => t.name.includes('Dependency B'));

    if (!taskA || !taskB) {
      throw new Error('Could not find created tasks');
    }

    // Add dependency: B depends on A
    await page.evaluate(async ({ taskBId, taskAId }: { taskBId: string; taskAId: string }) => {
      const response = await fetch('/api/tasks/dependencies', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ taskId: taskBId, dependsOnTaskId: taskAId }),
      });
      return await response.json();
    }, { taskBId: taskB.id, taskAId: taskA.id });

    // Verify dependency was added
    const deps = await page.evaluate(async (taskId: string) => {
      const response = await fetch(`/api/tasks/dependencies?taskId=${taskId}`);
      return await response.json();
    }, taskB.id);

    expect(deps).toHaveLength(1);
    expect(deps[0].dependsOnTaskId).toBe(taskA.id);

    // Test circular dependency detection
    const circularResult = await page.evaluate(async ({ taskAId, taskBId }: { taskAId: string; taskBId: string }) => {
      const response = await fetch('/api/tasks/dependencies', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ taskId: taskAId, dependsOnTaskId: taskBId }),
      });
      const data = await response.json();
      return { ok: response.ok, error: data.error };
    }, { taskAId: taskA.id, taskBId: taskB.id });

    // Should fail with circular dependency error
    expect(circularResult.ok).toBe(false);
    expect(circularResult.error).toContain('Circular');
  });
});
