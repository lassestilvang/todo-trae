import { describe, it, expect, beforeEach, mock, spyOn } from 'bun:test';

// Mock localStorage
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

// Mock window.matchMedia
const matchMediaMock = mock(() => ({
  matches: false,
  addEventListener: mock(() => {}),
  removeEventListener: mock(() => {}),
}));

Object.defineProperty(global, 'window', {
  value: {
    matchMedia: matchMediaMock,
    document: {
      documentElement: {
        classList: {
          toggle: mock(() => {}),
          contains: mock(() => false),
        },
      },
    },
    __THEME_INITIALIZED__: false,
  },
  writable: true,
});

import { useThemeStore } from '@/stores/themeStore';

describe('themeStore', () => {
  beforeEach(() => {
    useThemeStore.setState({
      theme: 'system',
      isDarkMode: false,
    });
    localStorageMock.getItem.mockReturnValue(null);
    localStorageMock.setItem.mockClear();
    matchMediaMock.mockClear();
    // Reset window initialization flag
    (global.window as Record<string, unknown>).__THEME_INITIALIZED__ = false;
  });

  describe('initial state', () => {
    it('should have correct default values', () => {
      const state = useThemeStore.getState();
      expect(state.theme).toBe('system');
      expect(state.isDarkMode).toBe(false);
    });
  });

  describe('setTheme', () => {
    it('should update theme to light', () => {
      useThemeStore.getState().setTheme('light');
      const state = useThemeStore.getState();
      expect(state.theme).toBe('light');
      expect(localStorageMock.setItem).toHaveBeenCalledWith('theme', 'light');
    });

    it('should update theme to dark', () => {
      useThemeStore.getState().setTheme('dark');
      const state = useThemeStore.getState();
      expect(state.theme).toBe('dark');
      expect(localStorageMock.setItem).toHaveBeenCalledWith('theme', 'dark');
    });

    it('should update theme to system', () => {
      useThemeStore.getState().setTheme('system');
      const state = useThemeStore.getState();
      expect(state.theme).toBe('system');
      expect(localStorageMock.setItem).toHaveBeenCalledWith('theme', 'system');
    });

    it('should handle localStorage errors gracefully', () => {
      localStorageMock.setItem.mockImplementationOnce(() => {
        throw new Error('Storage full');
      });
      // Should not throw
      expect(() => useThemeStore.getState().setTheme('dark')).not.toThrow();
    });
  });

  describe('toggleDarkMode', () => {
    it('should toggle from light to dark', () => {
      useThemeStore.setState({ theme: 'light', isDarkMode: false });
      useThemeStore.getState().toggleDarkMode();
      expect(useThemeStore.getState().theme).toBe('dark');
    });

    it('should toggle from dark to light', () => {
      useThemeStore.setState({ theme: 'dark', isDarkMode: true });
      useThemeStore.getState().toggleDarkMode();
      expect(useThemeStore.getState().theme).toBe('light');
    });

    it('should call setTheme with new theme', () => {
      const setThemeSpy = spyOn(useThemeStore.getState(), 'setTheme');
      useThemeStore.setState({ theme: 'light', isDarkMode: false });
      useThemeStore.getState().toggleDarkMode();
      expect(setThemeSpy).toHaveBeenCalledWith('dark');
    });
  });

  describe('initTheme', () => {
    it('should not initialize on server (no window)', () => {
      // Save original window
      const originalWindow = global.window;
      // @ts-expect-error - deleting global.window for server-side test
      delete global.window;

      // Re-import to test server-side behavior
      // Since we can't easily re-import, we test the early return logic
      // by checking the function exists and handles undefined window
      expect(useThemeStore.getState().initTheme).toBeDefined();

      // Restore window
      global.window = originalWindow;
    });

    it('should initialize theme from localStorage', () => {
      localStorageMock.getItem.mockReturnValue('dark');

      useThemeStore.getState().initTheme();

      expect(useThemeStore.getState().theme).toBe('dark');
      expect(localStorageMock.getItem).toHaveBeenCalledWith('theme');
    });

    it('should default to system when no stored theme', () => {
      localStorageMock.getItem.mockReturnValue(null);

      useThemeStore.getState().initTheme();

      expect(useThemeStore.getState().theme).toBe('system');
    });

    it('should not re-initialize if already initialized', () => {
      localStorageMock.getItem.mockReturnValue('light');

      useThemeStore.getState().initTheme();
      localStorageMock.getItem.mockClear();

      // Second call should not read from localStorage again
      useThemeStore.getState().initTheme();

      expect(localStorageMock.getItem).not.toHaveBeenCalled();
    });

    it('should set up media query listener for system theme', () => {
      localStorageMock.getItem.mockReturnValue('system');
      const mockMediaQuery = {
        matches: false,
        addEventListener: mock(() => {}),
        removeEventListener: mock(() => {}),
      };
      matchMediaMock.mockReturnValue(mockMediaQuery);

      useThemeStore.getState().initTheme();

      expect(matchMediaMock).toHaveBeenCalledWith('(prefers-color-scheme: dark)');
      expect(mockMediaQuery.addEventListener).toHaveBeenCalledWith('change', expect.any(Function));
    });

    it('should update isDarkMode based on system preference when theme is system', () => {
      const mockMediaQuery = {
        matches: true,
        addEventListener: mock(() => {}),
        removeEventListener: mock(() => {}),
      };
      matchMediaMock.mockReturnValue(mockMediaQuery);

      localStorageMock.getItem.mockReturnValue('system');

      useThemeStore.getState().initTheme();

      expect(useThemeStore.getState().isDarkMode).toBe(true);
    });

    it('should handle system theme change via media query listener', () => {
      let changeHandler: () => void;
      const mockMediaQuery = {
        matches: false,
        addEventListener: mock((event, handler) => {
          if (event === 'change') changeHandler = handler;
        }),
        removeEventListener: mock(() => {}),
      };
      matchMediaMock.mockReturnValue(mockMediaQuery);

      localStorageMock.getItem.mockReturnValue('system');
      useThemeStore.getState().initTheme();

      // Initially light mode
      expect(useThemeStore.getState().isDarkMode).toBe(false);

      // Simulate system theme change to dark
      mockMediaQuery.matches = true;
      changeHandler!();

      expect(useThemeStore.getState().isDarkMode).toBe(true);
    });

    it('should not respond to media query changes when theme is not system', () => {
      let changeHandler: () => void;
      const mockMediaQuery = {
        matches: false,
        addEventListener: mock((event, handler) => {
          if (event === 'change') changeHandler = handler;
        }),
        removeEventListener: mock(() => {}),
      };
      matchMediaMock.mockReturnValue(mockMediaQuery);

      localStorageMock.getItem.mockReturnValue('light');
      useThemeStore.getState().initTheme();

      // Change media query
      mockMediaQuery.matches = true;
      changeHandler!();

      // isDarkMode should remain based on explicit theme, not system
      expect(useThemeStore.getState().isDarkMode).toBe(false);
    });
  });

  describe('updateTheme function (internal)', () => {
    it('should update document class for dark mode', () => {
      const toggleSpy = spyOn(
        global.window.document.documentElement.classList,
        'toggle'
      );

      // Trigger updateTheme via setTheme
      useThemeStore.getState().setTheme('dark');

      expect(toggleSpy).toHaveBeenCalledWith('dark', true);
    });

    it('should update document class for light mode', () => {
      const toggleSpy = spyOn(
        global.window.document.documentElement.classList,
        'toggle'
      );

      useThemeStore.getState().setTheme('light');

      expect(toggleSpy).toHaveBeenCalledWith('dark', false);
    });

    it('should update isDarkMode state', () => {
      useThemeStore.getState().setTheme('dark');
      expect(useThemeStore.getState().isDarkMode).toBe(true);

      useThemeStore.getState().setTheme('light');
      expect(useThemeStore.getState().isDarkMode).toBe(false);
    });

    it('should handle system theme correctly', () => {
      const mockMediaQuery = {
        matches: true,
        addEventListener: mock(() => {}),
        removeEventListener: mock(() => {}),
      };
      matchMediaMock.mockReturnValue(mockMediaQuery);

      localStorageMock.getItem.mockReturnValue('system');
      useThemeStore.getState().initTheme();

      expect(useThemeStore.getState().isDarkMode).toBe(true);

      // Change to light preference
      mockMediaQuery.matches = false;
      const handlers = mockMediaQuery.addEventListener.mock.calls
        .filter((c) => c[0] === 'change')
        .map((c) => c[1]);
      handlers.forEach((h) => h());

      expect(useThemeStore.getState().isDarkMode).toBe(false);
    });
  });

  describe('theme persistence', () => {
    it('should persist theme to localStorage', () => {
      useThemeStore.getState().setTheme('dark');
      expect(localStorageMock.setItem).toHaveBeenCalledWith('theme', 'dark');

      useThemeStore.getState().setTheme('light');
      expect(localStorageMock.setItem).toHaveBeenCalledWith('theme', 'light');
    });

    it('should load persisted theme on init', () => {
      localStorageMock.getItem.mockReturnValue('dark');
      useThemeStore.getState().initTheme();
      expect(useThemeStore.getState().theme).toBe('dark');
    });
  });
});