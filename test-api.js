
import { createList, getAllLists, createLabel, getAllLabels, createTask, getAllTasks } from './src/lib/api';

try {
  console.log('Testing List API...');
  const listId = crypto.randomUUID();
  const list = createList({
    id: listId,
    name: 'Test List',
    color: '#FF0000',
    emoji: '📁',
    isDefault: false
  });
  console.log('Created List:', list);
  const lists = getAllLists();
  console.log('All Lists:', lists.length);

  console.log('\nTesting Label API...');
  const labelId = crypto.randomUUID();
  const label = createLabel({
    id: labelId,
    name: 'Test Label ' + Date.now(),
    color: '#00FF00',
    icon: '🏷️'
  });
  console.log('Created Label:', label);
  const labels = getAllLabels();
  console.log('All Labels:', labels.length);

  console.log('\nTesting Task API...');
  const taskId = crypto.randomUUID();
  const task = createTask({
    id: taskId,
    listId: listId,
    name: 'Test Task',
    priority: 'high',
    completed: false,
    order: 0
  });
  console.log('Created Task:', task);
  const tasks = getAllTasks();
  console.log('All Tasks:', tasks.length);

  console.log('\nAll tests passed!');
} catch (error) {
  console.error('Test failed:', error);
  process.exit(1);
}
