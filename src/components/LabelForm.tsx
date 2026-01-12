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
      <DialogContent className="sm:max-w-[450px] p-0 overflow-hidden border-border/30 bg-background/80 backdrop-blur-2xl">
        <DialogHeader className="px-6 py-4 border-b border-border/20">
          <DialogTitle className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-br from-foreground to-foreground/70">
            {label ? 'Edit Label' : 'Create New Label'}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <label 
                htmlFor="label-name"
                className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest px-1"
              >
                Label Name
              </label>
              <Input
                id="label-name"
                placeholder="e.g. Urgent, Home, Research"
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
                  htmlFor="label-icon"
                  className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest px-1"
                >
                  Label Icon
                </label>
                <Input
                  id="label-icon"
                  placeholder="🏷️"
                  value={formData.icon}
                  onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
                  className="h-11 bg-background/40 backdrop-blur-md border-border/30 focus:bg-background/60 transition-all rounded-xl font-medium text-center text-xl"
                  aria-label="Label icon"
                />
              </div>
              <div className="space-y-2">
                <label 
                  htmlFor="label-color"
                  className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest px-1"
                >
                  Label Color
                </label>
                <div className="flex items-center gap-2 h-11 px-3 bg-background/40 backdrop-blur-md border border-border/30 rounded-xl">
                  <input
                    id="label-color"
                    type="color"
                    value={formData.color}
                    onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                    className="w-6 h-6 rounded-md overflow-hidden bg-transparent cursor-pointer"
                    aria-label="Select label color"
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
              {label ? 'Update Label' : 'Create Label'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
