import { useEffect } from 'react';

type HotkeyCallback = (event: KeyboardEvent) => void;

export function useHotkeys(key: string, callback: HotkeyCallback, deps: unknown[] = []) {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Don't trigger shortcuts if user is typing in an input/textarea
      const activeElement = document.activeElement;
      const isInput = activeElement instanceof HTMLInputElement || 
                      activeElement instanceof HTMLTextAreaElement ||
                      (activeElement as HTMLElement)?.isContentEditable;

      // Allow Escape even in inputs to blur them
      if (isInput && event.key !== 'Escape') return;

      const keys = key.split('+').map(k => k.trim().toLowerCase());
      const pressedKey = event.key.toLowerCase();
      
      const ctrlRequired = keys.includes('ctrl') || keys.includes('control');
      const metaRequired = keys.includes('meta') || keys.includes('cmd') || keys.includes('command');
      const altRequired = keys.includes('alt');
      const shiftRequired = keys.includes('shift');
      
      const ctrlPressed = event.ctrlKey;
      const metaPressed = event.metaKey;
      const altPressed = event.altKey;
      const shiftPressed = event.shiftKey;

      const actualKey = keys.find(k => !['ctrl', 'control', 'meta', 'cmd', 'command', 'alt', 'shift'].includes(k));

      if (
        (ctrlRequired === ctrlPressed || (metaRequired && metaPressed)) &&
        altRequired === altPressed &&
        shiftRequired === shiftPressed &&
        pressedKey === actualKey
      ) {
        callback(event);
      } else if (!ctrlRequired && !metaRequired && !altRequired && !shiftRequired && pressedKey === keys[0]) {
        callback(event);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, callback, ...deps]);
}
