'use client';

import { useEffect } from 'react';
import { useTaskStore } from '@/stores/taskStore';
import { useThemeStore } from '@/stores/themeStore';
import { Sidebar } from '@/components/Sidebar';
import { TaskList } from '@/components/TaskList';
import { Toaster, toast } from 'sonner';
import { ErrorBoundary } from '@/components/ErrorBoundary';

export default function Home() {
  const { setTasks, setLists, setLabels, setSubtasks, setAttachments, setActivityLogs, setIsLoading } = useTaskStore();
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
        
        if (!tasksResponse.ok || !listsResponse.ok || !labelsResponse.ok) {
          throw new Error('Failed to fetch data from the server');
        }

        const [tasksData, listsData, labelsData] = await Promise.all([
          tasksResponse.json(),
          listsResponse.json(),
          labelsResponse.json()
        ]);
        
        setTasks(tasksData);
        setLists(listsData);
        setLabels(labelsData);
        setSubtasks([]);
        setAttachments([]);
        setActivityLogs([]);
      } catch (error) {
        console.error('Failed to load data:', error);
        toast.error('Failed to load data. Please check your connection.');
      } finally {
        setIsLoading(false);
      }
    }

    loadData();
  }, [setTasks, setLists, setLabels, setSubtasks, setAttachments, setActivityLogs, setIsLoading]);

  return (
    <ErrorBoundary>
      <div className="mx-auto max-w-7xl p-6 h-screen">
        <div className="flex h-full rounded-2xl glass overflow-hidden">
          <Sidebar />
          <main id="main-content" className="flex-1 flex flex-col bg-transparent outline-none" tabIndex={-1}>
            <TaskList />
          </main>
        </div>
        <Toaster theme={theme === 'system' ? undefined : theme} position="bottom-right" richColors />
      </div>
    </ErrorBoundary>
  );
}
