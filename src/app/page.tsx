'use client';

import { useEffect, useRef, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { useTaskStore } from '@/stores/taskStore';
import { useThemeStore } from '@/stores/themeStore';
import { Sidebar } from '@/components/Sidebar';
import { TaskList } from '@/components/TaskList';
import { Toaster, toast } from 'sonner';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { getSocket, joinListRoom, leaveListRoom } from '@/lib/socket-client';
import { useUIStore } from '@/stores/uiStore';
import { useHotkeys } from '@/lib/hooks';
import { Task } from '@/types';

function HomeContent() {
  const searchParams = useSearchParams();
  const { 
    setTasks, setLists, setLabels, setSubtasks, setAttachments, setActivityLogs, 
    setIsLoading, selectedListId, setSelectedListId, addTask, updateTask, deleteTask,
    setSelectedView
  } = useTaskStore();
  const { 
    setTaskFormOpen, setSearchFocused, toggleFocusMode 
  } = useUIStore();
  const { theme } = useThemeStore();
  const prevListId = useRef<string | null>(null);

  // Keyboard Shortcuts
  useHotkeys('n', () => setTaskFormOpen(true));
  useHotkeys('/', (e) => {
    e.preventDefault();
    setSearchFocused(true);
  });
  useHotkeys('f', () => toggleFocusMode());
  useHotkeys('Escape', () => {
    setTaskFormOpen(false);
    setSearchFocused(false);
    if (document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
    }
  });
  useHotkeys('1', () => {
    setSelectedView('today');
    setSelectedListId(null);
  });
  useHotkeys('2', () => {
    setSelectedView('next7days');
    setSelectedListId(null);
  });
  useHotkeys('3', () => {
    setSelectedView('upcoming');
    setSelectedListId(null);
  });
  useHotkeys('4', () => {
    setSelectedView('all');
    setSelectedListId(null);
  });
  useHotkeys('Meta+k', (e) => {
    e.preventDefault();
    setSearchFocused(true);
  });
  useHotkeys('Control+k', (e) => {
    e.preventDefault();
    setSearchFocused(true);
  });
  useHotkeys('?', () => {
    toast.info('Keyboard Shortcuts', {
      description: 'N: New Task | /: Search | F: Focus Mode | 1-4: Views | Esc: Close',
      duration: 5000,
    });
  });

  useEffect(() => {
    // Handle initial list ID from URL
    const listIdFromUrl = searchParams.get('listId');
    if (listIdFromUrl) {
      setSelectedListId(listIdFromUrl);
      toast.success('Joined Squad Board', {
        description: 'You are now collaborating in real-time.',
      });
    }
  }, [searchParams, setSelectedListId]);

  useEffect(() => {
    // Socket.io event listeners
    const socket = getSocket();
    
    socket.on('task-updated', (data: { type: string; task: Task }) => {
      console.log('Received socket update:', data);
      switch (data.type) {
        case 'add':
          addTask(data.task);
          toast.info(`New task added: ${data.task.name}`);
          break;
        case 'update':
          updateTask(data.task.id, data.task);
          break;
        case 'delete':
          deleteTask(data.task.id);
          break;
      }
    });

    return () => {
      socket.off('task-updated');
    };
  }, [addTask, updateTask, deleteTask]);

  useEffect(() => {
    // Handle room joining/leaving
    if (prevListId.current) {
      leaveListRoom(prevListId.current);
    }
    
    if (selectedListId) {
      joinListRoom(selectedListId);
      prevListId.current = selectedListId;
    } else {
      prevListId.current = null;
    }
  }, [selectedListId]);

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
    <div className="mx-auto max-w-7xl p-6 h-screen">
      <div className="flex h-full rounded-2xl glass overflow-hidden">
        <Sidebar />
        <main id="main-content" className="flex-1 flex flex-col bg-transparent outline-none" tabIndex={-1}>
          <TaskList />
        </main>
      </div>
      <Toaster theme={theme === 'system' ? undefined : theme} position="bottom-right" richColors />
    </div>
  );
}

export default function Home() {
  return (
    <ErrorBoundary>
      <Suspense fallback={<div className="h-screen w-screen flex items-center justify-center">Loading...</div>}>
        <HomeContent />
      </Suspense>
    </ErrorBoundary>
  );
}
