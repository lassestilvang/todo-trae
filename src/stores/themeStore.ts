import { create } from 'zustand';

interface ThemeStore {
  theme: 'light' | 'dark' | 'system';
  isDarkMode: boolean;
  
  // Actions
  setTheme: (theme: 'light' | 'dark' | 'system') => void;
  toggleDarkMode: () => void;
}

export const useThemeStore = create<ThemeStore>((set, get) => ({
  theme: 'system',
  isDarkMode: false,
  
  setTheme: (theme) => {
    set({ theme, isDarkMode: theme === 'dark' ? true : theme === 'light' ? false : get().isDarkMode });
    updateTheme(theme);
    try { localStorage.setItem('theme', theme); } catch {}
  },
  
  toggleDarkMode: () => {
    const current = get().isDarkMode;
    const newTheme = current ? 'light' : 'dark';
    set({ theme: newTheme, isDarkMode: !current });
    updateTheme(newTheme);
    try { localStorage.setItem('theme', newTheme); } catch {}
  },
}));

function updateTheme(theme: 'light' | 'dark' | 'system') {
  const isBrowser = typeof window !== 'undefined';
  if (theme === 'system') {
    const systemIsDark = isBrowser ? window.matchMedia('(prefers-color-scheme: dark)').matches : false;
    if (isBrowser) {
      const root = window.document.documentElement;
      root.classList.toggle('dark', systemIsDark);
    }
    useThemeStore.setState({ isDarkMode: systemIsDark });
  } else {
    if (isBrowser) {
      const root = window.document.documentElement;
      root.classList.toggle('dark', theme === 'dark');
    }
    useThemeStore.setState({ isDarkMode: theme === 'dark' });
  }
}

// Initialize theme on client side
if (typeof window !== 'undefined') {
  const storedTheme = localStorage.getItem('theme') as 'light' | 'dark' | 'system' | null;
  const initialTheme = storedTheme || 'system';
  
  useThemeStore.setState({ theme: initialTheme });
  updateTheme(initialTheme);
  
  // Listen for system theme changes
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
    const currentTheme = useThemeStore.getState().theme;
    if (currentTheme === 'system') {
      updateTheme('system');
    }
  });
}