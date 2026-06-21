'use client';

import { useState } from 'react';
import { useTaskStore } from '@/stores/taskStore';
import { useThemeStore } from '@/stores/themeStore';
import { TaskList as TaskListType, ViewType } from '@/types';
import { 
  Plus, 
  Search, 
  Bell, 
  ChevronDown, 
  Calendar,
  Clock,
  CheckCircle2,
  Hash,
  Home
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { ThemeToggle } from '@/components/ThemeToggle';
import { Input } from '@/components/ui/Input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/Dialog';

export function Sidebar() {
  const lists = useTaskStore(s => s.lists);
  const labels = useTaskStore(s => s.labels);
  const selectedListId = useTaskStore(s => s.selectedListId);
  const selectedView = useTaskStore(s => s.selectedView);
  const selectedLabelIds = useTaskStore(s => s.selectedLabelIds);
  const setSelectedListId = useTaskStore(s => s.setSelectedListId);
  const setSelectedView = useTaskStore(s => s.setSelectedView);
  const setSearchQuery = useTaskStore(s => s.setSearchQuery);
  const setSelectedLabelIds = useTaskStore(s => s.setSelectedLabelIds);
  const addList = useTaskStore(s => s.addList);
  const addLabel = useTaskStore(s => s.addLabel);
  const { isDarkMode, toggleDarkMode } = useThemeStore();
  
  const [showProjects, setShowProjects] = useState(true);
  const [addListOpen, setAddListOpen] = useState(false);
  const [addTagOpen, setAddTagOpen] = useState(false);
  const [newList, setNewList] = useState<{ name: string; color: string; emoji: string }>({ name: '', color: '#3B82F6', emoji: '📋' });
  const [newTag, setNewTag] = useState<{ name: string; color: string; icon: string }>({ name: '', color: '#6B7280', icon: '🏷️' });

  const views: Array<{ id: ViewType; name: string; icon: React.ReactNode; badge?: number }> = [
    { id: 'today', name: 'Today', icon: <Calendar className="w-4 h-4" />, badge: 2 },
    { id: 'next7days', name: 'Next 7 Days', icon: <Clock className="w-4 h-4" /> },
    { id: 'upcoming', name: 'Upcoming', icon: <Calendar className="w-4 h-4" /> },
    { id: 'all', name: 'All', icon: <CheckCircle2 className="w-4 h-4" />, badge: 12 },
  ];

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    setSelectedListId(null);
    setSelectedView('all');
    setSelectedLabelIds([]);
  };

  const handleViewSelect = (view: ViewType) => {
    setSelectedView(view);
    setSelectedListId(null);
    setSearchQuery('');
    setSelectedLabelIds([]);
  };

  const handleListSelect = (listId: string) => {
    setSelectedListId(listId);
    setSelectedView('all');
    setSearchQuery('');
    setSelectedLabelIds([]);
  };

  const toggleTagSelect = (labelId: string) => {
    const current = selectedLabelIds || [];
    const exists = current.includes(labelId);
    const next = exists ? current.filter(id => id !== labelId) : [...current, labelId];
    setSelectedLabelIds(next);
    setSelectedListId(null);
    setSelectedView('all');
  };

  const handleCreateList = async () => {
    if (!newList.name.trim()) return;
    const payload = {
      id: crypto.randomUUID(),
      name: newList.name,
      color: newList.color,
      emoji: newList.emoji,
      isDefault: false,
    } as TaskListType;
    const res = await fetch('/api/lists', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
    if (res.ok) {
      const created = await res.json();
      addList({ ...created, createdAt: new Date(), updatedAt: new Date() });
      setAddListOpen(false);
      setNewList({ name: '', color: '#3B82F6', emoji: '📋' });
    }
  };

  const handleCreateTag = async () => {
    if (!newTag.name.trim()) return;
    const payload = {
      id: crypto.randomUUID(),
      name: newTag.name,
      color: newTag.color,
      icon: newTag.icon,
    };
    const res = await fetch('/api/labels', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
    if (res.ok) {
      const created = await res.json();
      addLabel({ ...created, createdAt: new Date(), updatedAt: new Date() });
      setAddTagOpen(false);
      setNewTag({ name: '', color: '#6B7280', icon: '🏷️' });
    }
  };

  return (
    <div className="md:w-72 flex flex-col" role="navigation" aria-label="Main">
      {/* Header */}
      <div className="p-5 border-b border-border">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <span className="text-lg font-semibold text-foreground">n0rd</span>
            <ChevronDown className="w-4 h-4 text-muted-foreground" />
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0 rounded-full" aria-label="Notifications">
              <Bell className="w-4 h-4" />
            </Button>
            <ThemeToggle />
          </div>
        </div>
        <Button className="w-full justify-start gap-2 mb-3 rounded-md" aria-label="Add task">
          <Plus className="w-4 h-4" />
          Add task
        </Button>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search"
            className="pl-9 rounded-md"
            onChange={(e) => handleSearch(e.target.value)}
            aria-label="Search tasks"
          />
        </div>
      </div>

      {/* Navigation */}
      <div className="flex-1 overflow-y-auto">
        {/* Views */}
        <div className="p-4">
          <h3 className="text-xs font-medium text-muted-foreground mb-2">Views</h3>
          {views.map((view) => (
            <button
              key={view.id}
              onClick={() => handleViewSelect(view.id)}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-md text-sm transition-colors ${
                selectedView === view.id && !selectedListId
                  ? 'bg-accent text-accent-foreground shadow-sm'
                  : 'hover:bg-accent/50 text-foreground'
              }`}
              aria-pressed={selectedView === view.id && !selectedListId}
            >
              <div className="flex items-center gap-3">
                {view.icon}
                <span>{view.name}</span>
              </div>
              {view.badge && (
                <span className={`text-xs px-2 py-0.5 rounded-full ${
                  view.id === 'today' ? 'bg-red-500 text-white' : 'bg-muted text-muted-foreground'
                }`}>
                  {view.badge}
                </span>
              )}
            </button>
          ))}
        </div>

      {/* Lists */}
      <div className="p-4 border-t border-border">
        <h3 className="text-xs font-medium text-muted-foreground mb-2">Lists</h3>
        <Button variant="ghost" size="sm" className="w-full justify-start gap-2 mb-2 rounded-md" onClick={() => setAddListOpen(true)} aria-label="Add list">
          <Plus className="w-4 h-4" />
          Add list
        </Button>
        {lists.map((list) => (
          <button
            key={list.id}
            onClick={() => handleListSelect(list.id)}
            className={`w-full flex items-center justify-between px-3 py-2 rounded-md text-sm transition-colors ${
              selectedListId === list.id
                ? 'bg-accent text-accent-foreground shadow-sm'
                : 'hover:bg-accent/50 text-foreground'
            }`}
            aria-pressed={selectedListId === list.id}
          >
            <div className="flex items-center gap-3">
              <span>{list.emoji}</span>
              <span>{list.name}</span>
            </div>
            {list.isDefault && (
              <span className="text-xs px-2 py-0.5 rounded-full bg-red-500 text-white">5</span>
            )}
          </button>
        ))}
      </div>

      {/* Tags */}
      <div className="p-4 border-t border-border">
        <h3 className="text-xs font-medium text-muted-foreground mb-2">Tags</h3>
        <Button variant="ghost" size="sm" className="w-full justify-start gap-2 mb-2 rounded-md" onClick={() => setAddTagOpen(true)} aria-label="Add tag">
          <Plus className="w-4 h-4" />
          Add tag
        </Button>
        <div className="space-y-1">
          {labels.map((label) => {
            const active = selectedLabelIds?.includes(label.id);
            return (
              <button
                key={label.id}
                onClick={() => toggleTagSelect(label.id)}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-md text-sm transition-colors ${
                  active ? 'bg-accent text-accent-foreground shadow-sm' : 'hover:bg-accent/50 text-foreground'
                }`}
                aria-pressed={active}
              >
                <div className="flex items-center gap-3">
                  <span>{label.icon}</span>
                  <span>{label.name}</span>
                </div>
                <span className="text-xs px-2 py-0.5 rounded-full" style={{ backgroundColor: label.color + '20', color: label.color }}>
                  ●
                </span>
              </button>
            );
          })}
        </div>
      </div>
      
      </div>
      {/* Add List Dialog */}
      <Dialog open={addListOpen} onOpenChange={setAddListOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add List</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <Input placeholder="Name" value={newList.name} onChange={(e) => setNewList({ ...newList, name: e.target.value })} />
            <Input placeholder="#3B82F6" value={newList.color} onChange={(e) => setNewList({ ...newList, color: e.target.value })} />
            <Input placeholder="📋" value={newList.emoji} onChange={(e) => setNewList({ ...newList, emoji: e.target.value })} />
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setAddListOpen(false)}>Cancel</Button>
              <Button onClick={handleCreateList}>Create</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Add Tag Dialog */}
      <Dialog open={addTagOpen} onOpenChange={setAddTagOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Tag</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <Input placeholder="Name" value={newTag.name} onChange={(e) => setNewTag({ ...newTag, name: e.target.value })} />
            <Input placeholder="#6B7280" value={newTag.color} onChange={(e) => setNewTag({ ...newTag, color: e.target.value })} />
            <Input placeholder="🏷️" value={newTag.icon} onChange={(e) => setNewTag({ ...newTag, icon: e.target.value })} />
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setAddTagOpen(false)}>Cancel</Button>
              <Button onClick={handleCreateTag}>Create</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}