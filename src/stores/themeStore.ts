import { create } from 'zustand';

interface ThemeStore {
  theme: 'light' | 'dark' | 'system';
  isDarkMode: boolean;
  
  // Actions
  setTheme: (theme: 'light' | 'dark' | 'system') => void;
  initTheme: () => void;
}

export const useThemeStore = create<ThemeStore>((set, get) => ({
  theme: 'system',
  isDarkMode: false,
  
  setTheme: (theme) => {
    set({ theme });
    updateTheme(theme);
    try { localStorage.setItem('theme', theme); } catch {}
  },

  initTheme: () => {
    if (typeof window === 'undefined') return;
    
    // Prevent multiple initializations
    if ((window as any).__THEME_INITIALIZED__) return;
    (window as any).__THEME_INITIALIZED__ = true;
    
    const storedTheme = localStorage.getItem('theme') as 'light' | 'dark' | 'system' | null;
    const initialTheme = storedTheme || 'system';
    
    set({ theme: initialTheme });
    updateTheme(initialTheme);

    // Listen for system theme changes
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = () => {
      if (get().theme === 'system') {
        updateTheme('system');
      }
    };

    mediaQuery.addEventListener('change', handleChange);
  }
}));

function updateTheme(theme: 'light' | 'dark' | 'system') {
  if (typeof window === 'undefined') return;

  const root = window.document.documentElement;
  let isDark = false;

  if (theme === 'system') {
    isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  } else {
    isDark = theme === 'dark';
  }

  root.classList.toggle('dark', isDark);
  useThemeStore.setState({ isDarkMode: isDark });
}
