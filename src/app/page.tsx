'use client';

import { useEffect } from 'react';
import { useTaskStore } from '@/stores/taskStore';
import { useThemeStore } from '@/stores/themeStore';
import { Sidebar } from '@/components/Sidebar';
import { TaskList } from '@/components/TaskList';
import { Toaster } from 'sonner';

export default function Home() {
  const setTasks = useTaskStore(s => s.setTasks);
  const setLists = useTaskStore(s => s.setLists);
  const setLabels = useTaskStore(s => s.setLabels);
  const setSubtasks = useTaskStore(s => s.setSubtasks);
  const setAttachments = useTaskStore(s => s.setAttachments);
  const setActivityLogs = useTaskStore(s => s.setActivityLogs);
  const isLoading = useTaskStore(s => s.isLoading);
  const setIsLoading = useTaskStore(s => s.setIsLoading);
  const { theme } = useThemeStore();

  useEffect(() => {
    async function loadData() {
      setIsLoading(true);
      try {
        const [tasksResponse, listsResponse, labelsResponse] = await Promise.all([
          fetch('/api/tasks'),
          fetch('/api/lists'),
          fetch('/api/labels')
        ]);
        
        const [tasksData, listsData, labelsData] = await Promise.all([
          tasksResponse.json(),
          listsResponse.json(),
          labelsResponse.json()
        ]);
        
        // For now, initialize subtasks and attachments as empty
        // These would be loaded through separate API calls in a real app
        setTasks(tasksData);
        setLists(listsData);
        setLabels(labelsData);
        setSubtasks([]);
        setAttachments([]);
        setActivityLogs([]);
      } catch (error) {
        console.error('Failed to load data:', error);
      } finally {
        setIsLoading(false);
      }
    }

    loadData();
  }, [setTasks, setLists, setLabels, setSubtasks, setAttachments, setActivityLogs, setIsLoading]);

  return (
    <div className="mx-auto max-w-7xl p-4 md:p-6 h-screen">
      <div className="grid grid-cols-1 md:grid-cols-[18rem_1fr] gap-4 h-full">
        <aside className="glass rounded-lg h-full" aria-label="Sidebar">
          <Sidebar />
        </aside>
        <main className="glass rounded-lg h-full flex flex-col" role="main" aria-label="Tasks">
          <TaskList />
        </main>
      </div>
      <Toaster theme={theme === 'system' ? undefined : theme} />
    </div>
  );
}
