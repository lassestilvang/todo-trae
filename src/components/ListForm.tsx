'use client';

import { useState, useEffect } from 'react';
import { useTaskStore } from '@/stores/taskStore';
import { TaskList } from '@/types';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/Dialog';
import { toast } from 'sonner';

interface ListFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  list?: TaskList;
}

export function ListForm({ open, onOpenChange, list }: ListFormProps) {
  const { addList, updateList } = useTaskStore();
  const [formData, setFormData] = useState({
    name: list?.name || '',
    emoji: list?.emoji || '📁',
    color: list?.color || '#3b82f6',
  });

  useEffect(() => {
    if (list) {
      setFormData({
        name: list.name,
        emoji: list.emoji || '📁',
        color: list.color || '#3b82f6',
      });
    } else {
      setFormData({
        name: '',
        emoji: '📁',
        color: '#3b82f6',
      });
    }
  }, [list, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      toast.error('List name is required');
      return;
    }

    try {
      if (list) {
        // Update existing list
        const response = await fetch(`/api/lists/${list.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData),
        });

        if (!response.ok) throw new Error('Failed to update list');
        
        const updatedList = await response.json();
        updateList(list.id, updatedList);
        toast.success('List updated successfully');
      } else {
        // Create new list
        const response = await fetch('/api/lists', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...formData,
            id: crypto.randomUUID(),
            isDefault: false,
          }),
        });

        if (!response.ok) throw new Error('Failed to create list');
        
        const newList = await response.json();
        addList(newList);
        toast.success('List created successfully');
      }
      onOpenChange(false);
    } catch (error) {
      console.error('Error saving list:', error);
      toast.error('Failed to save list');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[450px] p-0 overflow-hidden border-border/30 bg-background/80 backdrop-blur-2xl">
        <DialogHeader className="px-6 py-4 border-b border-border/20">
          <DialogTitle className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-br from-foreground to-foreground/70">
            {list ? 'Edit List' : 'Create New List'}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <label 
                htmlFor="list-name"
                className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest px-1"
              >
                List Name
              </label>
              <Input
                id="list-name"
                placeholder="e.g. Work, Personal, Shopping"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="h-11 bg-background/40 backdrop-blur-md border-border/30 focus:bg-background/60 transition-all rounded-xl font-medium"
                autoFocus
                aria-required="true"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label 
                  htmlFor="list-emoji"
                  className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest px-1"
                >
                  Emoji Icon
                </label>
                <Input
                  id="list-emoji"
                  placeholder="📁"
                  value={formData.emoji}
                  onChange={(e) => setFormData({ ...formData, emoji: e.target.value })}
                  className="h-11 bg-background/40 backdrop-blur-md border-border/30 focus:bg-background/60 transition-all rounded-xl font-medium text-center text-xl"
                  aria-label="List emoji icon"
                />
              </div>
              <div className="space-y-2">
                <label 
                  htmlFor="list-color"
                  className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest px-1"
                >
                  List Color
                </label>
                <div className="flex items-center gap-2 h-11 px-3 bg-background/40 backdrop-blur-md border border-border/30 rounded-xl">
                  <input
                    id="list-color"
                    type="color"
                    value={formData.color}
                    onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                    className="w-6 h-6 rounded-md overflow-hidden bg-transparent cursor-pointer"
                    aria-label="Select list color"
                  />
                  <span className="text-xs font-mono font-medium text-muted-foreground uppercase" aria-hidden="true">{formData.color}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button
              type="button"
              variant="ghost"
              onClick={() => onOpenChange(false)}
              className="h-11 px-6 rounded-xl font-bold uppercase tracking-wider text-xs hover:bg-background/60"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="h-11 px-8 rounded-xl font-bold uppercase tracking-wider text-xs shadow-lg shadow-primary/20"
            >
              {list ? 'Update List' : 'Create List'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
