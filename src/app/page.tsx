'use client';

import { useEffect } from 'react';
import { useTaskStore } from '@/stores/taskStore';
import { useThemeStore } from '@/stores/themeStore';
import { Sidebar } from '@/components/Sidebar';
import { TaskList } from '@/components/TaskList';
import { Toaster } from 'sonner';

export default function Home() {
  const { setTasks, setLists, setLabels, setSubtasks, setAttachments, setActivityLogs, isLoading, setIsLoading } = useTaskStore();
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
    <div className="mx-auto max-w-7xl p-6 h-screen">
      <div className="flex h-full rounded-2xl border border-border bg-background/60 backdrop-blur-md shadow-xl">
        <Sidebar />
        <main className="flex-1 flex flex-col">
          <TaskList />
        </main>
      </div>
      <Toaster theme={theme === 'system' ? undefined : theme} />
    </div>
  );
}
