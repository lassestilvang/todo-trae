import { create } from 'zustand';

interface UIStore {
  isTaskFormOpen: boolean;
  isSearchFocused: boolean;
  isFocusModeOpen: boolean;
  
  setTaskFormOpen: (open: boolean) => void;
  setSearchFocused: (focused: boolean) => void;
  setFocusModeOpen: (open: boolean) => void;
  
  toggleFocusMode: () => void;
}

export const useUIStore = create<UIStore>((set) => ({
  isTaskFormOpen: false,
  isSearchFocused: false,
  isFocusModeOpen: false,
  
  setTaskFormOpen: (open) => set({ isTaskFormOpen: open }),
  setSearchFocused: (focused) => set({ isSearchFocused: focused }),
  setFocusModeOpen: (open) => set({ isFocusModeOpen: open }),
  
  toggleFocusMode: () => set((state) => ({ isFocusModeOpen: !state.isFocusModeOpen })),
}));
