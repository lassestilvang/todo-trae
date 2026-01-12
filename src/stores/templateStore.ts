import { create } from 'zustand';
import { TaskTemplate } from '@/types';

interface TemplateStore {
  templates: TaskTemplate[];
  isLoading: boolean;
  
  setTemplates: (templates: TaskTemplate[]) => void;
  addTemplate: (template: TaskTemplate) => void;
  updateTemplate: (id: string, template: Partial<TaskTemplate>) => void;
  deleteTemplate: (id: string) => void;
  fetchTemplates: () => Promise<void>;
}

export const useTemplateStore = create<TemplateStore>((set) => ({
  templates: [],
  isLoading: false,
  
  setTemplates: (templates) => set({ templates }),
  
  addTemplate: (template) => set((state) => ({ 
    templates: [...state.templates, template] 
  })),
  
  updateTemplate: (id, updatedTemplate) => set((state) => ({
    templates: state.templates.map((t) => 
      t.id === id ? { ...t, ...updatedTemplate, updatedAt: new Date() } : t
    )
  })),
  
  deleteTemplate: (id) => set((state) => ({
    templates: state.templates.filter((t) => t.id !== id)
  })),
  
  fetchTemplates: async () => {
    set({ isLoading: true });
    try {
      const response = await fetch('/api/templates');
      if (response.ok) {
        const templates = await response.json();
        set({ templates });
      }
    } catch (error) {
      console.error('Failed to fetch templates:', error);
    } finally {
      set({ isLoading: false });
    }
  }
}));
