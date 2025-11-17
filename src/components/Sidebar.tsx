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
  Home,
  Star
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

export function Sidebar() {
  const { lists, selectedListId, selectedView, setSelectedListId, setSelectedView, setSearchQuery } = useTaskStore();
  const { isDarkMode, toggleDarkMode } = useThemeStore();
  const [searchOpen, setSearchOpen] = useState(false);
  const [showProjects, setShowProjects] = useState(true);

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
  };

  const handleViewSelect = (view: ViewType) => {
    setSelectedView(view);
    setSelectedListId(null);
    setSearchQuery('');
  };

  const handleListSelect = (listId: string) => {
    setSelectedListId(listId);
    setSelectedView('all');
    setSearchQuery('');
  };

  return (
    <div className="w-72 border-r border-border flex flex-col bg-background/70 backdrop-blur-md">
      {/* Header */}
      <div className="p-5 border-b border-border">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <span className="text-lg font-semibold text-foreground">n0rd</span>
            <ChevronDown className="w-4 h-4 text-muted-foreground" />
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0 rounded-full">
              <Bell className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0 rounded-full" onClick={toggleDarkMode}>
              {isDarkMode ? '🌙' : '☀️'}
            </Button>
          </div>
        </div>
        <Button className="w-full justify-start gap-2 mb-3 rounded-xl shadow-sm">
          <Plus className="w-4 h-4" />
          Add task
        </Button>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search"
            className="pl-9 rounded-xl"
            onChange={(e) => handleSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Navigation */}
      <div className="flex-1 overflow-y-auto">
        {/* Views */}
        <div className="p-4">
          <h3 className="text-xs font-semibold text-muted-foreground uppercase mb-2">Views</h3>
          {views.map((view) => (
            <button
              key={view.id}
              onClick={() => handleViewSelect(view.id)}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-sm transition-colors ${
                selectedView === view.id && !selectedListId
                  ? 'bg-accent text-accent-foreground shadow-sm'
                  : 'hover:bg-accent/50 text-foreground'
              }`}
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
          <h3 className="text-xs font-semibold text-muted-foreground uppercase mb-2">Lists</h3>
          {lists.map((list) => (
            <button
              key={list.id}
              onClick={() => handleListSelect(list.id)}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-sm transition-colors ${
                selectedListId === list.id
                  ? 'bg-accent text-accent-foreground shadow-sm'
                  : 'hover:bg-accent/50 text-foreground'
              }`}
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

        {/* Projects */}
        <div className="p-4 border-t border-border">
          <button
            onClick={() => setShowProjects(!showProjects)}
            className="w-full flex items-center justify-between text-xs font-semibold text-muted-foreground uppercase mb-2 hover:text-foreground"
          >
            <span>My Projects</span>
            <ChevronDown className={`w-3 h-3 transition-transform ${showProjects ? '' : '-rotate-90'}`} />
          </button>
          
          {showProjects && (
            <div className="space-y-1">
              <button className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-sm hover:bg-accent/50 text-foreground">
                <div className="flex items-center gap-3">
                  <Home className="w-4 h-4" />
                  <span>Home</span>
                </div>
                <span className="text-xs text-muted-foreground">6</span>
              </button>
              <button className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-sm hover:bg-accent/50 text-foreground">
                <div className="flex items-center gap-3">
                  <Hash className="w-4 h-4" />
                  <span>n0rd</span>
                </div>
                <span className="text-xs text-muted-foreground">1</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}