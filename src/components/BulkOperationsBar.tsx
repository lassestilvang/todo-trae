import { CheckCircle, Trash2, Archive, Tag, AlertCircle, X } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Select } from '@/components/ui/Select';
import { useTaskStore } from '@/stores/taskStore';
import { toast } from 'sonner';
import { logger } from '@/lib/logger';

interface BulkOperationsBarProps {
  listId: string | null;
  labels: { id: string; name: string; color: string }[];
  lists: { id: string; name: string; color: string }[];
  onBulkAction: () => void;
}

export function BulkOperationsBar({ listId, labels, lists, onBulkAction }: BulkOperationsBarProps) {
  const { selectedTaskIds, clearSelection, tasks } = useTaskStore();
  const selectedCount = selectedTaskIds.size;

  if (selectedCount === 0) return null;

  const handleBulkComplete = async () => {
    const selectedIds = Array.from(selectedTaskIds);
    try {
      const response = await fetch('/api/tasks/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'complete', taskIds: selectedIds }),
      });
      if (!response.ok) throw new Error('Failed to complete tasks');
      const store = useTaskStore.getState();
      selectedIds.forEach(id => {
        store.updateTask(id, { completed: true, completedAt: new Date() });
      });
      clearSelection();
      onBulkAction();
      toast.success(`${selectedCount} task${selectedCount > 1 ? 's' : ''} marked complete`);
    } catch (error) {
      logger.error('Bulk complete failed', { error });
      toast.error('Failed to complete tasks');
    }
  };

  const handleBulkUncomplete = async () => {
    const selectedIds = Array.from(selectedTaskIds);
    try {
      const response = await fetch('/api/tasks/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'uncomplete', taskIds: selectedIds }),
      });
      if (!response.ok) throw new Error('Failed to update tasks');
      const store = useTaskStore.getState();
      selectedIds.forEach(id => {
        store.updateTask(id, { completed: false, completedAt: undefined });
      });
      clearSelection();
      onBulkAction();
      toast.success(`${selectedCount} task${selectedCount > 1 ? 's' : ''} marked incomplete`);
    } catch (error) {
      logger.error('Bulk uncomplete failed', { error });
      toast.error('Failed to update tasks');
    }
  };

  const handleBulkDelete = async () => {
    const selectedIds = Array.from(selectedTaskIds);
    if (!confirm(`Delete ${selectedCount} task${selectedCount > 1 ? 's' : ''}?`)) return;
    try {
      const response = await fetch('/api/tasks/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'delete', taskIds: selectedIds }),
      });
      if (!response.ok) throw new Error('Failed to delete tasks');
      const store = useTaskStore.getState();
      selectedIds.forEach(id => store.deleteTask(id));
      clearSelection();
      onBulkAction();
      toast.success(`${selectedCount} task${selectedCount > 1 ? 's' : ''} deleted`);
    } catch (error) {
      logger.error('Bulk delete failed', { error });
      toast.error('Failed to delete tasks');
    }
  };

  const handleBulkMove = async (targetListId: string) => {
    if (targetListId === listId) {
      clearSelection();
      return;
    }
    const selectedIds = Array.from(selectedTaskIds);
    try {
      const response = await fetch('/api/tasks/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'move', taskIds: selectedIds, listId: targetListId }),
      });
      if (!response.ok) throw new Error('Failed to move tasks');
      const store = useTaskStore.getState();
      selectedIds.forEach(id => {
        store.updateTask(id, { listId: targetListId });
      });
      clearSelection();
      onBulkAction();
      toast.success(`${selectedCount} task${selectedCount > 1 ? 's' : ''} moved`);
    } catch (error) {
      logger.error('Bulk move failed', { error });
      toast.error('Failed to move tasks');
    }
  };

  const handleBulkSetPriority = async (priority: 'low' | 'medium' | 'high') => {
    const selectedIds = Array.from(selectedTaskIds);
    try {
      const response = await fetch('/api/tasks/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'setPriority', taskIds: selectedIds, priority }),
      });
      if (!response.ok) throw new Error('Failed to set priority');
      const store = useTaskStore.getState();
      selectedIds.forEach(id => {
        store.updateTask(id, { priority });
      });
      onBulkAction();
      toast.success(`Priority set to ${priority} for ${selectedCount} task${selectedCount > 1 ? 's' : ''}`);
    } catch (error) {
      logger.error('Bulk set priority failed', { error });
      toast.error('Failed to set priority');
    }
  };

  const handleSelectAll = () => {
    const listTasks = listId
      ? tasks.filter(t => t.listId === listId)
      : tasks;
    const visibleTaskIds = listTasks.map(t => t.id);
    const allSelected = visibleTaskIds.every(id => selectedTaskIds.has(id));

    if (allSelected) {
      // Invert: deselect all visible tasks
      const newSelection = new Set(
        Array.from(selectedTaskIds).filter(id => !visibleTaskIds.includes(id))
      );
      useTaskStore.setState({ selectedTaskIds: newSelection });
    } else {
      // Select all visible tasks
      useTaskStore.setState({ selectedTaskIds: new Set([...selectedTaskIds, ...visibleTaskIds]) });
    }
  };

  const listOptions = lists.map(l => ({ value: l.id, label: l.name }));
  const visibleTasks = listId
    ? tasks.filter(t => t.listId === listId)
    : tasks;
  const isAllSelected = visibleTasks.length > 0
    ? visibleTasks.every(t => selectedTaskIds.has(t.id))
    : false;

  return (
    <div className="glass-card p-4 rounded-2xl border-border/20 mb-4 animate-in fade-in slide-down-4">
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm font-medium text-foreground">
          {selectedCount} selected
        </span>
        <button
          type="button"
          onClick={clearSelection}
          className="p-1 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
          aria-label="Clear selection"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="flex flex-wrap gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={handleBulkComplete}
          className="rounded-xl border-border/30 text-green-500 hover:bg-green-500/10"
        >
          <CheckCircle className="w-4 h-4 mr-1" />
          Complete
        </Button>

        <Button
          variant="outline"
          size="sm"
          onClick={handleBulkUncomplete}
          className="rounded-xl border-border/30 text-blue-500 hover:bg-blue-500/10"
        >
          <AlertCircle className="w-4 h-4 mr-1" />
          Uncomplete
        </Button>

        <Select
          value=""
          onChange={(e) => {
            if (e.target.value) handleBulkMove(e.target.value);
          }}
          className="w-40 rounded-xl border-border/30 bg-background/40 backdrop-blur-md text-sm"
        >
          <option value="" disabled>Move to...</option>
          {listOptions.map(l => (
            <option key={l.value} value={l.value}>{l.label}</option>
          ))}
        </Select>

        <Select
          value=""
          onChange={(e) => {
            if (e.target.value) handleBulkSetPriority(e.target.value as 'low' | 'medium' | 'high');
          }}
          className="w-40 rounded-xl border-border/30 bg-background/40 backdrop-blur-md text-sm"
        >
          <option value="" disabled>Priority</option>
          <option value="low">Low Priority</option>
          <option value="medium">Medium Priority</option>
          <option value="high">High Priority</option>
        </Select>

        <Button
          variant="outline"
          size="sm"
          onClick={handleBulkDelete}
          className="rounded-xl border-border/30 text-red-500 hover:bg-red-500/10"
        >
          <Trash2 className="w-4 h-4 mr-1" />
          Delete
        </Button>

        <Button
          variant="ghost"
          size="sm"
          onClick={handleSelectAll}
          className="rounded-xl text-xs"
        >
          {isAllSelected ? 'Deselect all' : 'Select all'}
        </Button>
      </div>
    </div>
  );
}
