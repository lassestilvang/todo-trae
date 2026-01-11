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
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{list ? 'Edit List' : 'Create New List'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">List Name</label>
            <Input
              placeholder="List name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              autoFocus
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Emoji</label>
              <Input
                placeholder="Emoji (e.g. 📁)"
                value={formData.emoji}
                onChange={(e) => setFormData({ ...formData, emoji: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Color</label>
              <Input
                type="color"
                value={formData.color}
                onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                className="h-10 p-1"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit">
              {list ? 'Update List' : 'Create List'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
