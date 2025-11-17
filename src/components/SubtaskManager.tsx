'use client';

import { useState } from 'react';
import { useTaskStore } from '@/stores/taskStore';
import { Subtask } from '@/types';
import { Circle, CheckCircle2, Plus, X } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

interface SubtaskManagerProps {
  taskId: string;
  subtasks: Subtask[];
}

export function SubtaskManager({ taskId, subtasks }: SubtaskManagerProps) {
  const { addSubtask, updateSubtask, deleteSubtask, toggleSubtaskComplete } = useTaskStore();
  const [newSubtaskName, setNewSubtaskName] = useState('');
  const [isAdding, setIsAdding] = useState(false);

  const handleAddSubtask = () => {
    if (!newSubtaskName.trim()) return;

    const newSubtask: Subtask = {
      id: crypto.randomUUID(),
      taskId,
      name: newSubtaskName.trim(),
      completed: false,
      order: subtasks.length,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    addSubtask(newSubtask);
    setNewSubtaskName('');
    setIsAdding(false);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddSubtask();
    } else if (e.key === 'Escape') {
      setIsAdding(false);
      setNewSubtaskName('');
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-medium">Subtasks</h4>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsAdding(true)}
          className="h-6 px-2"
        >
          <Plus className="w-3 h-3 mr-1" />
          Add
        </Button>
      </div>

      {subtasks.length > 0 && (
        <div className="space-y-1">
          {subtasks.map((subtask) => (
            <div key={subtask.id} className="flex items-center gap-2 group">
              <button
                onClick={() => toggleSubtaskComplete(subtask.id)}
                className="flex-shrink-0"
              >
                {subtask.completed ? (
                  <CheckCircle2 className="w-4 h-4 text-green-500" />
                ) : (
                  <Circle className="w-4 h-4 text-muted-foreground hover:text-primary" />
                )}
              </button>
              
              <span className={`flex-1 text-sm ${subtask.completed ? 'line-through text-muted-foreground' : ''}`}>
                {subtask.name}
              </span>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={() => deleteSubtask(subtask.id)}
                className="h-5 w-5 p-0 opacity-0 group-hover:opacity-100"
              >
                <X className="w-3 h-3" />
              </Button>
            </div>
          ))}
        </div>
      )}

      {isAdding && (
        <div className="flex items-center gap-2">
          <Circle className="w-4 h-4 text-muted-foreground" />
          <Input
            value={newSubtaskName}
            onChange={(e) => setNewSubtaskName(e.target.value)}
            onKeyDown={handleKeyPress}
            placeholder="Enter subtask name"
            className="flex-1 h-8 text-sm"
            autoFocus
          />
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setIsAdding(false);
              setNewSubtaskName('');
            }}
            className="h-8 w-8 p-0"
          >
            <X className="w-3 h-3" />
          </Button>
        </div>
      )}
    </div>
  );
}