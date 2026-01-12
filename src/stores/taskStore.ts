import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { Task, TaskList, Label, ViewType, Subtask, Attachment, ActivityLog } from '@/types';

interface TaskStore {
  tasks: Task[];
  lists: TaskList[];
  labels: Label[];
  subtasks: Subtask[];
  attachments: Attachment[];
  activityLogs: ActivityLog[];
  selectedListId: string | null;
  selectedView: ViewType;
  searchQuery: string;
  showCompleted: boolean;
  isLoading: boolean;
  
  // Actions
  setTasks: (tasks: Task[]) => void;
  setLists: (lists: TaskList[]) => void;
  setLabels: (labels: Label[]) => void;
  setSubtasks: (subtasks: Subtask[]) => void;
  setAttachments: (attachments: Attachment[]) => void;
  setActivityLogs: (logs: ActivityLog[]) => void;
  setSelectedListId: (listId: string | null) => void;
  setSelectedView: (view: ViewType) => void;
  setSearchQuery: (query: string) => void;
  setShowCompleted: (show: boolean) => void;
  setIsLoading: (loading: boolean) => void;
  
  // Task operations
  addTask: (task: Task) => void;
  updateTask: (taskId: string, updates: Partial<Task>) => void;
  deleteTask: (taskId: string) => void;
  toggleTaskComplete: (taskId: string) => void;
  
  // Subtask operations
  addSubtask: (subtask: Subtask) => void;
  updateSubtask: (subtaskId: string, updates: Partial<Subtask>) => void;
  deleteSubtask: (subtaskId: string) => void;
  toggleSubtaskComplete: (subtaskId: string) => void;
  
  // Attachment operations
  addAttachment: (attachment: Attachment) => void;
  deleteAttachment: (attachmentId: string) => void;
  
  // Activity log operations
  addActivityLog: (log: ActivityLog) => void;
  
  // List operations
  addList: (list: TaskList) => void;
  updateList: (listId: string, updates: Partial<TaskList>) => void;
  deleteList: (listId: string) => void;
  
  // Label operations
  addLabel: (label: Label) => void;
  updateLabel: (labelId: string, updates: Partial<Label>) => void;
  deleteLabel: (labelId: string) => void;
}

export const useTaskStore = create<TaskStore>()(
  persist(
    (set) => ({
      tasks: [],
      lists: [],
      labels: [],
      subtasks: [],
      attachments: [],
      activityLogs: [],
      selectedListId: null,
      selectedView: 'today',
      searchQuery: '',
      showCompleted: true,
      isLoading: false,
      
      setTasks: (tasks) => set({ tasks }),
      setLists: (lists) => set({ lists }),
      setLabels: (labels) => set({ labels }),
      setSubtasks: (subtasks) => set({ subtasks }),
      setAttachments: (attachments) => set({ attachments }),
      setActivityLogs: (logs) => set({ activityLogs: logs }),
      setSelectedListId: (listId) => set({ selectedListId: listId }),
      setSelectedView: (view) => set({ selectedView: view }),
      setSearchQuery: (query) => set({ searchQuery: query }),
      setShowCompleted: (show) => set({ showCompleted: show }),
      setIsLoading: (loading) => set({ isLoading: loading }),
      
      addTask: (task) => {
        set((state) => ({ 
          tasks: [...state.tasks, task] 
        }));
      },
      
      updateTask: (taskId, updates) => set((state) => {
        const updatedTasks = state.tasks.map(task => 
          task.id === taskId ? { ...task, ...updates, updatedAt: new Date() } : task
        );
        
        return { tasks: updatedTasks };
      }),
      
      deleteTask: (taskId) => {
        set((state) => {
          return {
            tasks: state.tasks.filter(task => task.id !== taskId),
            subtasks: state.subtasks.filter(subtask => subtask.taskId !== taskId),
            attachments: state.attachments.filter(attachment => attachment.taskId !== taskId)
          };
        });
      },
      
      toggleTaskComplete: (taskId) => set((state) => {
        const task = state.tasks.find(task => task.id === taskId);
        const newCompleted = !task?.completed;
        
        return {
          tasks: state.tasks.map(task => 
            task.id === taskId 
              ? { 
                  ...task, 
                  completed: newCompleted, 
                  completedAt: newCompleted ? new Date() : undefined 
                } 
              : task
          )
        };
      }),
      
      // Subtask operations
      addSubtask: (subtask) => set((state) => ({ 
        subtasks: [...state.subtasks, subtask] 
      })),
      
      updateSubtask: (subtaskId, updates) => set((state) => ({
         subtasks: state.subtasks.map(subtask => 
           subtask.id === subtaskId ? { ...subtask, ...updates, updatedAt: new Date() } : subtask
         )
       })),
      
      deleteSubtask: (subtaskId) => set((state) => ({
        subtasks: state.subtasks.filter(subtask => subtask.id !== subtaskId)
      })),
      
      toggleSubtaskComplete: (subtaskId) => set((state) => ({
        subtasks: state.subtasks.map(subtask => 
          subtask.id === subtaskId 
            ? { ...subtask, completed: !subtask.completed, updatedAt: new Date() }
            : subtask
        )
      })),
      
      // Attachment operations
      addAttachment: (attachment) => set((state) => ({ 
        attachments: [...state.attachments, attachment] 
      })),
      
      deleteAttachment: (attachmentId) => set((state) => ({
        attachments: state.attachments.filter(attachment => attachment.id !== attachmentId)
      })),
      
      // Activity log operations
      addActivityLog: (log) => set((state) => ({ 
        activityLogs: [log, ...state.activityLogs] 
      })),
      
      // List operations
      addList: (list) => set((state) => ({ 
        lists: [...state.lists, list] 
      })),
      
      updateList: (listId, updates) => set((state) => ({
        lists: state.lists.map(list => 
          list.id === listId ? { ...list, ...updates, updatedAt: new Date() } : list
        )
      })),
      
      deleteList: (listId) => set((state) => ({
        lists: state.lists.filter(list => list.id !== listId),
        tasks: state.tasks.filter(task => task.listId !== listId),
        subtasks: state.subtasks.filter(subtask => {
          const task = state.tasks.find(t => t.id === subtask.taskId);
          return task?.listId !== listId;
        }),
        attachments: state.attachments.filter(attachment => {
          const task = state.tasks.find(t => t.id === attachment.taskId);
          return task?.listId !== listId;
        })
      })),
      
      // Label operations
      addLabel: (label) => set((state) => ({ 
        labels: [...state.labels, label] 
      })),
      
      updateLabel: (labelId, updates) => set((state) => ({
        labels: state.labels.map(label => 
          label.id === labelId ? { ...label, ...updates, updatedAt: new Date() } : label
        )
      })),
      
      deleteLabel: (labelId) => set((state) => ({
        labels: state.labels.filter(label => label.id !== labelId)
      })),
    }),
    {
      name: 'daily-task-planner-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ 
        selectedListId: state.selectedListId,
        selectedView: state.selectedView,
        showCompleted: state.showCompleted,
      }),
    }
  )
);