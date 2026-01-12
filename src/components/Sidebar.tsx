'use client';

import { useState } from 'react';
import { useTaskStore } from '@/stores/taskStore';
import { useThemeStore } from '@/stores/themeStore';
import { TaskList as TaskListType, ViewType, Label } from '@/types';
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
  Star,
  Tag
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { isToday } from 'date-fns';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { TaskForm } from './TaskForm';
import { ListForm } from './ListForm';
import { LabelForm } from './LabelForm';

export function Sidebar() {
  const { 
    tasks,
    lists, 
    labels,
    selectedListId, 
    selectedView, 
    setSelectedListId, 
    setSelectedView, 
    setSearchQuery 
  } = useTaskStore();
  const { isDarkMode, toggleDarkMode } = useThemeStore();
  const [searchOpen, setSearchOpen] = useState(false);
  const [showProjects, setShowProjects] = useState(true);
  const [taskFormOpen, setTaskFormOpen] = useState(false);
  const [listFormOpen, setListFormOpen] = useState(false);
  const [labelFormOpen, setLabelFormOpen] = useState(false);

  const views: Array<{ id: ViewType; name: string; icon: React.ReactNode; badge?: number }> = [
    { 
      id: 'today', 
      name: 'Today', 
      icon: <Calendar className="w-4 h-4" />, 
      badge: tasks.filter(t => {
        if (!t.date || t.completed) return false;
        const date = new Date(t.date);
        return !isNaN(date.getTime()) && isToday(date);
      }).length || undefined 
    },
    { id: 'next7days', name: 'Next 7 Days', icon: <Clock className="w-4 h-4" /> },
    { id: 'upcoming', name: 'Upcoming', icon: <Calendar className="w-4 h-4" /> },
    { id: 'all', name: 'All', icon: <CheckCircle2 className="w-4 h-4" />, badge: tasks.filter(t => !t.completed).length || undefined },
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
    <nav 
      className="w-72 border-r border-border/30 flex flex-col bg-background/20 backdrop-blur-md"
      aria-label="Main Navigation"
    >
      {/* Header */}
      <div className="p-5 border-b border-border/30">
        <div className="flex items-center justify-between mb-6">
          <div 
            className="flex items-center gap-2 group cursor-pointer"
            role="button"
            data-cursor="hover"
            tabIndex={0}
            aria-label="Account Settings"
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                // Account settings logic would go here
              }
            }}
          >
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-primary-foreground font-bold shadow-lg shadow-primary/20 group-hover:scale-110 transition-transform" aria-hidden="true">
              N
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-bold text-foreground leading-tight">n0rd Planner</span>
              <span className="text-[10px] text-muted-foreground">Personal Workspace</span>
            </div>
            <ChevronDown className="w-3 h-3 text-muted-foreground ml-1" aria-hidden="true" />
          </div>
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0 rounded-xl hover:bg-accent/50" aria-label="Notifications">
              <Bell className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0 rounded-xl hover:bg-accent/50" onClick={toggleDarkMode} aria-label={isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'}>
              {isDarkMode ? '🌙' : '☀️'}
            </Button>
          </div>
        </div>
        
        <Button 
          className="w-full justify-start gap-2 mb-4 rounded-xl shadow-lg shadow-primary/20 h-11 text-sm font-medium transition-all hover:scale-[1.02] active:scale-[0.98]"
          onClick={() => setTaskFormOpen(true)}
          aria-label="Create new task"
        >
          <div className="w-5 h-5 rounded-md bg-white/20 flex items-center justify-center" aria-hidden="true">
            <Plus className="w-3.5 h-3.5" />
          </div>
          Add new task
        </Button>

        <TaskForm open={taskFormOpen} onOpenChange={setTaskFormOpen} />
        <ListForm open={listFormOpen} onOpenChange={setListFormOpen} />
        <LabelForm open={labelFormOpen} onOpenChange={setLabelFormOpen} />

        <div className="relative group">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" aria-hidden="true" />
          <Input
            type="text"
            placeholder="Search tasks..."
            className="pl-9 rounded-xl bg-background/40 border-border/50 focus:bg-background/80 transition-all h-10 text-sm"
            onChange={(e) => handleSearch(e.target.value)}
            aria-label="Search tasks"
          />
        </div>
      </div>

      {/* Navigation */}
      <div className="flex-1 overflow-y-auto custom-scrollbar">
        {/* Views */}
        <div className="p-4 space-y-1" role="group" aria-labelledby="views-heading">
          <h3 id="views-heading" className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-2 px-3">Main</h3>
          {views.map((view) => (
            <button
              key={view.id}
              onClick={() => handleViewSelect(view.id)}
              aria-current={selectedView === view.id && !selectedListId ? 'page' : undefined}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
                selectedView === view.id && !selectedListId
                  ? 'bg-primary/10 text-primary shadow-sm'
                  : 'hover:bg-accent/40 text-muted-foreground hover:text-foreground'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className={`p-1.5 rounded-lg transition-colors ${
                  selectedView === view.id && !selectedListId ? 'bg-primary/20' : 'bg-transparent'
                }`} aria-hidden="true">
                  {view.icon}
                </div>
                <span>{view.name}</span>
              </div>
              {view.badge && (
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm ${
                  view.id === 'today' ? 'bg-red-500 text-white' : 'bg-muted text-muted-foreground'
                }`} aria-label={`${view.badge} tasks`}>
                  {view.badge}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Lists */}
        <div className="p-4 border-t border-border/30" role="group" aria-labelledby="lists-heading">
          <div className="flex items-center justify-between mb-3 px-3">
            <h3 id="lists-heading" className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">My Lists</h3>
            <Button 
              variant="ghost" 
              size="sm" 
              className="h-6 w-6 p-0 rounded-lg hover:bg-primary/10 hover:text-primary transition-colors"
              onClick={() => setListFormOpen(true)}
              aria-label="Add new list"
            >
              <Plus className="w-3.5 h-3.5" />
            </Button>
          </div>
          <div className="space-y-1">
            {lists.map((list) => (
              <button
                key={list.id}
                onClick={() => handleListSelect(list.id)}
                aria-current={selectedListId === list.id ? 'page' : undefined}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
                  selectedListId === list.id
                    ? 'bg-primary/10 text-primary shadow-sm'
                    : 'hover:bg-accent/40 text-muted-foreground hover:text-foreground'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="text-base" aria-hidden="true">{list.emoji}</span>
                  <span>{list.name}</span>
                </div>
                {(list.isDefault || tasks.filter(t => t.listId === list.id && !t.completed).length > 0) && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-primary/20 text-primary" aria-label={`${tasks.filter(t => t.listId === list.id && !t.completed).length} tasks`}>
                    {tasks.filter(t => t.listId === list.id && !t.completed).length || '0'}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Labels */}
        <div className="p-4 border-t border-border/30" role="group" aria-labelledby="labels-heading">
          <div className="flex items-center justify-between mb-3 px-3">
            <h3 id="labels-heading" className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Labels</h3>
            <Button 
              variant="ghost" 
              size="sm" 
              className="h-6 w-6 p-0 rounded-lg hover:bg-primary/10 hover:text-primary transition-colors"
              onClick={() => setLabelFormOpen(true)}
              aria-label="Add new label"
            >
              <Plus className="w-3.5 h-3.5" />
            </Button>
          </div>
          <div className="flex flex-wrap gap-2 px-1">
            {labels.map((label) => (
              <button
                key={label.id}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-[11px] font-bold border transition-all hover:scale-105 active:scale-95"
                aria-label={`Filter by label: ${label.name}`}
                style={{ 
                  color: label.color, 
                  borderColor: `${label.color}30`,
                  backgroundColor: `${label.color}10`
                }}
              >
                <Tag className="w-3 h-3" aria-hidden="true" />
                {label.name}
              </button>
            ))}
          </div>
        </div>

        {/* Projects */}
        <div className="p-4 border-t border-border/30" role="group" aria-labelledby="projects-heading">
          <button
            onClick={() => setShowProjects(!showProjects)}
            aria-expanded={showProjects}
            aria-controls="projects-container"
            className="w-full flex items-center justify-between text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-3 hover:text-foreground transition-colors px-3"
          >
            <span id="projects-heading">My Projects</span>
            <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${showProjects ? '' : '-rotate-90'}`} aria-hidden="true" />
          </button>
          
          <AnimatePresence>
            {showProjects && (
              <motion.div
                id="projects-container"
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="space-y-1 overflow-hidden"
              >
                <button className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-sm font-medium hover:bg-accent/40 text-muted-foreground hover:text-foreground transition-all">
                  <div className="flex items-center gap-3">
                    <div className="p-1.5 rounded-lg bg-blue-500/10 text-blue-500" aria-hidden="true">
                      <Home className="w-4 h-4" />
                    </div>
                    <span>Home</span>
                  </div>
                  <span className="text-[10px] font-bold text-muted-foreground bg-muted px-2 py-0.5 rounded-full" aria-label="6 tasks">6</span>
                </button>
                <button className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-sm font-medium hover:bg-accent/40 text-muted-foreground hover:text-foreground transition-all">
                  <div className="flex items-center gap-3">
                    <div className="p-1.5 rounded-lg bg-purple-500/10 text-purple-500" aria-hidden="true">
                      <Hash className="w-4 h-4" />
                    </div>
                    <span>n0rd</span>
                  </div>
                  <span className="text-[10px] font-bold text-muted-foreground bg-muted px-2 py-0.5 rounded-full" aria-label="1 task">1</span>
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </nav>
  );
}