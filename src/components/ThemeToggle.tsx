'use client';

import { useThemeStore } from '@/stores/themeStore';
import { Button } from '@/components/ui/Button';

export function ThemeToggle() {
  const { theme, setTheme, isDarkMode } = useThemeStore();
  return (
    <div aria-label="Theme" role="group" className="flex items-center gap-1">
      <Button aria-label="Light mode" variant={theme === 'light' ? 'secondary' : 'outline'} size="sm" className="h-8 rounded-full" onClick={() => setTheme('light')}>☀️</Button>
      <Button aria-label="System mode" variant={theme === 'system' ? 'secondary' : 'outline'} size="sm" className="h-8 rounded-full" onClick={() => setTheme('system')}>💻</Button>
      <Button aria-label="Dark mode" variant={theme === 'dark' ? 'secondary' : 'outline'} size="sm" className="h-8 rounded-full" onClick={() => setTheme('dark')}>{isDarkMode ? '🌙' : '🌚'}</Button>
    </div>
  );
}