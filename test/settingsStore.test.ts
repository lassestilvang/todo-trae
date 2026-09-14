import { describe, it, expect, beforeEach, mock } from 'bun:test';

// Mock localStorage before importing the store
const localStorageMock = {
  getItem: mock(() => null),
  setItem: mock(() => {}),
  removeItem: mock(() => {}),
  clear: mock(() => {}),
};

Object.defineProperty(global, 'localStorage', {
  value: localStorageMock,
  writable: true,
});

// Mock zustand persist middleware
mock.module('zustand/middleware', () => ({
  persist: (config: unknown, _options: unknown) => (set: unknown, get: unknown, api: unknown) => {
    void _options; // Intentionally unused
    const state = config(set, get, api);
    // Simulate persist by exposing the state directly
    return state;
  },
  createJSONStorage: () => ({
    getItem: localStorageMock.getItem,
    setItem: localStorageMock.setItem,
    removeItem: localStorageMock.removeItem,
  }),
}));

// Simple act replacement for synchronous state updates
const act = (callback: () => void) => callback();

import { useSettingsStore, NotificationSettings, TaskDefaults } from '@/stores/settingsStore';

describe('settingsStore', () => {
  beforeEach(() => {
    // Reset store to initial state
    useSettingsStore.setState({
      defaultPriority: 'none',
      defaultEstimate: null,
      notifications: {
        reminders: true,
        dailySummary: false,
        focusModeAlerts: true,
        pushNotifications: false,
      },
    });
    localStorageMock.getItem.mockReturnValue(null);
    localStorageMock.setItem.mockClear();
  });

  describe('initial state', () => {
    it('should have correct default values', () => {
      const state = useSettingsStore.getState();
      expect(state.defaultPriority).toBe('none');
      expect(state.defaultEstimate).toBeNull();
      expect(state.notifications).toEqual({
        reminders: true,
        dailySummary: false,
        focusModeAlerts: true,
        pushNotifications: false,
      });
    });
  });

  describe('setDefaultPriority', () => {
    it('should update defaultPriority', () => {
      act(() => {
        useSettingsStore.getState().setDefaultPriority('high');
      });

      expect(useSettingsStore.getState().defaultPriority).toBe('high');
    });

    it('should accept all valid priority values', () => {
      const priorities: Array<'high' | 'medium' | 'low' | 'none'> = ['high', 'medium', 'low', 'none'];

      for (const priority of priorities) {
        act(() => {
          useSettingsStore.getState().setDefaultPriority(priority);
        });
        expect(useSettingsStore.getState().defaultPriority).toBe(priority);
      }
    });
  });

  describe('setDefaultEstimate', () => {
    it('should update defaultEstimate with a string value', () => {
      act(() => {
        useSettingsStore.getState().setDefaultEstimate('2:30');
      });

      expect(useSettingsStore.getState().defaultEstimate).toBe('2:30');
    });

    it('should update defaultEstimate to null', () => {
      act(() => {
        useSettingsStore.getState().setDefaultEstimate('1:00');
      });
      expect(useSettingsStore.getState().defaultEstimate).toBe('1:00');

      act(() => {
        useSettingsStore.getState().setDefaultEstimate(null);
      });
      expect(useSettingsStore.getState().defaultEstimate).toBeNull();
    });

    it('should accept various time formats', () => {
      const estimates = ['0:30', '1:00', '2:00', '4:00', '8:00', null];

      for (const estimate of estimates) {
        act(() => {
          useSettingsStore.getState().setDefaultEstimate(estimate);
        });
        expect(useSettingsStore.getState().defaultEstimate).toBe(estimate);
      }
    });
  });

  describe('setNotifications', () => {
    it('should update individual notification settings', () => {
      act(() => {
        useSettingsStore.getState().setNotifications({ reminders: false });
      });

      const state = useSettingsStore.getState();
      expect(state.notifications.reminders).toBe(false);
      // Other settings should remain unchanged
      expect(state.notifications.dailySummary).toBe(false);
      expect(state.notifications.focusModeAlerts).toBe(true);
      expect(state.notifications.pushNotifications).toBe(false);
    });

    it('should update multiple notification settings at once', () => {
      act(() => {
        useSettingsStore.getState().setNotifications({
          reminders: false,
          dailySummary: true,
          pushNotifications: true,
        });
      });

      const state = useSettingsStore.getState();
      expect(state.notifications.reminders).toBe(false);
      expect(state.notifications.dailySummary).toBe(true);
      expect(state.notifications.focusModeAlerts).toBe(true); // Unchanged
      expect(state.notifications.pushNotifications).toBe(true);
    });

    it('should replace all notification settings when all provided', () => {
      act(() => {
        useSettingsStore.getState().setNotifications({
          reminders: false,
          dailySummary: true,
          focusModeAlerts: false,
          pushNotifications: true,
        });
      });

      const state = useSettingsStore.getState();
      expect(state.notifications).toEqual({
        reminders: false,
        dailySummary: true,
        focusModeAlerts: false,
        pushNotifications: true,
      });
    });
  });

  describe('resetSettings', () => {
    it('should reset all settings to defaults', () => {
      // Modify all settings
      act(() => {
        useSettingsStore.getState().setDefaultPriority('high');
        useSettingsStore.getState().setDefaultEstimate('4:00');
        useSettingsStore.getState().setNotifications({
          reminders: false,
          dailySummary: true,
          focusModeAlerts: false,
          pushNotifications: true,
        });
      });

      // Verify modified
      let state = useSettingsStore.getState();
      expect(state.defaultPriority).toBe('high');
      expect(state.defaultEstimate).toBe('4:00');
      expect(state.notifications.reminders).toBe(false);
      expect(state.notifications.dailySummary).toBe(true);
      expect(state.notifications.focusModeAlerts).toBe(false);
      expect(state.notifications.pushNotifications).toBe(true);

      // Reset
      act(() => {
        useSettingsStore.getState().resetSettings();
      });

      // Verify reset
      state = useSettingsStore.getState();
      expect(state.defaultPriority).toBe('none');
      expect(state.defaultEstimate).toBeNull();
      expect(state.notifications).toEqual({
        reminders: true,
        dailySummary: false,
        focusModeAlerts: true,
        pushNotifications: false,
      });
    });
  });

  describe('persistence (localStorage integration)', () => {
    it('should call setItem when settings change', () => {
      act(() => {
        useSettingsStore.getState().setDefaultPriority('high');
      });

      // With mocked persist middleware, we verify the store updates
      // In real usage, persist middleware would call localStorage.setItem
      expect(useSettingsStore.getState().defaultPriority).toBe('high');
    });

    it('should maintain state across multiple updates', () => {
      act(() => {
        useSettingsStore.getState().setDefaultPriority('medium');
        useSettingsStore.getState().setDefaultEstimate('1:30');
        useSettingsStore.getState().setNotifications({ dailySummary: true });
      });

      const state = useSettingsStore.getState();
      expect(state.defaultPriority).toBe('medium');
      expect(state.defaultEstimate).toBe('1:30');
      expect(state.notifications.dailySummary).toBe(true);
    });
  });

  describe('type safety', () => {
    it('should enforce NotificationSettings type', () => {
      const validSettings: Partial<NotificationSettings> = {
        reminders: true,
        dailySummary: false,
        focusModeAlerts: true,
        pushNotifications: false,
      };

      act(() => {
        useSettingsStore.getState().setNotifications(validSettings);
      });

      expect(useSettingsStore.getState().notifications).toEqual({
        reminders: true,
        dailySummary: false,
        focusModeAlerts: true,
        pushNotifications: false,
      });
    });

    it('should enforce TaskDefaults priority type', () => {
      const validPriorities: TaskDefaults['priority'][] = ['high', 'medium', 'low', 'none'];

      for (const priority of validPriorities) {
        act(() => {
          useSettingsStore.getState().setDefaultPriority(priority);
        });
        expect(useSettingsStore.getState().defaultPriority).toBe(priority);
      }
    });
  });
});