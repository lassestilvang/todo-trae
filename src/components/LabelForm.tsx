'use client';

import { useState, useEffect } from 'react';
import { useTaskStore } from '@/stores/taskStore';
import { Label } from '@/types';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/Dialog';
import { toast } from 'sonner';

interface LabelFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  label?: Label;
}

export function LabelForm({ open, onOpenChange, label }: LabelFormProps) {
  const { addLabel, updateLabel } = useTaskStore();
  const [formData, setFormData] = useState({
    name: label?.name || '',
    color: label?.color || '#3b82f6',
    icon: label?.icon || '🏷️',
  });

  useEffect(() => {
    if (label) {
      setFormData({
        name: label.name,
        color: label.color || '#3b82f6',
        icon: label.icon || '🏷️',
      });
    } else {
      setFormData({
        name: '',
        color: '#3b82f6',
        icon: '🏷️',
      });
    }
  }, [label, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      toast.error('Label name is required');
      return;
    }

    try {
      if (label) {
        // Update existing label
        const response = await fetch(`/api/labels/${label.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData),
        });

        if (!response.ok) throw new Error('Failed to update label');
        
        const updatedLabel = await response.json();
        updateLabel(label.id, updatedLabel);
        toast.success('Label updated successfully');
      } else {
        // Create new label
        const response = await fetch('/api/labels', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...formData,
            id: crypto.randomUUID(),
          }),
        });

        if (!response.ok) throw new Error('Failed to create label');
        
        const newLabel = await response.json();
        addLabel(newLabel);
        toast.success('Label created successfully');
      }
      onOpenChange(false);
    } catch (error) {
      console.error('Error saving label:', error);
      toast.error('Failed to save label');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{label ? 'Edit Label' : 'Create New Label'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Label Name</label>
            <Input
              placeholder="Label name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              autoFocus
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
          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit">
              {label ? 'Update Label' : 'Create Label'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
