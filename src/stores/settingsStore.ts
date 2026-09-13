import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

export interface NotificationSettings {
  reminders: boolean;
  dailySummary: boolean;
  focusModeAlerts: boolean;
  pushNotifications: boolean;
}

export interface TaskDefaults {
  priority: 'high' | 'medium' | 'low' | 'none';
  estimate: string | null;
}

interface SettingsStore {
  // Task defaults
  defaultPriority: TaskDefaults['priority'];
  defaultEstimate: string | null;

  // Notification preferences
  notifications: NotificationSettings;

  // Actions
  setDefaultPriority: (priority: TaskDefaults['priority']) => void;
  setDefaultEstimate: (estimate: string | null) => void;
  setNotifications: (settings: Partial<NotificationSettings>) => void;
  resetSettings: () => void;
}

export const useSettingsStore = create<SettingsStore>()(
  persist(
    (set) => ({
      defaultPriority: 'none',
      defaultEstimate: null,

      notifications: {
        reminders: true,
        dailySummary: false,
        focusModeAlerts: true,
        pushNotifications: false,
      },

      setDefaultPriority: (priority) => set({ defaultPriority: priority }),
      setDefaultEstimate: (estimate) => set({ defaultEstimate: estimate }),
      setNotifications: (settings) =>
        set((state) => ({
          notifications: { ...state.notifications, ...settings },
        })),
      resetSettings: () =>
        set({
          defaultPriority: 'none',
          defaultEstimate: null,
          notifications: {
            reminders: true,
            dailySummary: false,
            focusModeAlerts: true,
            pushNotifications: false,
          },
        }),
    }),
    {
      name: 'settings-storage',
      storage: createJSONStorage(() => localStorage),
    }
  )
);
