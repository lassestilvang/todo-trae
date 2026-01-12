'use client';

import { useState } from 'react';
import { useTaskStore } from '@/stores/taskStore';
import { useThemeStore } from '@/stores/themeStore';
import { useUIStore } from '@/stores/uiStore';
import { useTemplateStore } from '@/stores/templateStore';
import { ViewType } from '@/types';
import { 
  Plus, 
  Search, 
  Bell, 
  Check,
  ChevronDown, 
  Calendar,
  Clock,
  CheckCircle2,
  Hash,
  Home,
  Tag,
  Sun,
  Moon,
  Monitor,
  Share2,
  TrendingUp,
  LayoutTemplate,
  Trash2,
  LogOut,
  User,
  Settings
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { isToday } from 'date-fns';
import { Button } from '@/components/ui/Button';
import { toast } from 'sonner';
import { Input } from '@/components/ui/Input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/DropdownMenu';
import { TaskForm } from './TaskForm';
import { ListForm } from './ListForm';
import { LabelForm } from './LabelForm';
import { useRef, useEffect } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';

export function Sidebar() {
  const { data: session } = useSession();
  const router = useRouter();
  const pathname = usePathname();
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
  const { theme, setTheme } = useThemeStore();
  const { isSearchFocused, setSearchFocused, isTaskFormOpen, setTaskFormOpen } = useUIStore();
  const { templates, deleteTemplate } = useTemplateStore();
  const [showProjects, setShowProjects] = useState(true);
  const [showTemplates, setShowTemplates] = useState(false);
  const [listFormOpen, setListFormOpen] = useState(false);
  const [labelFormOpen, setLabelFormOpen] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isSearchFocused && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isSearchFocused]);

  const getThemeIcon = () => {
    if (theme === 'system') return <Monitor className="w-4 h-4" />;
    if (theme === 'light') return <Sun className="w-4 h-4" />;
    return <Moon className="w-4 h-4" />;
  };

  const getThemeLabel = () => {
    if (theme === 'system') return 'System Theme';
    if (theme === 'light') return 'Light Theme';
    return 'Dark Theme';
  };

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
    if (pathname !== '/') router.push('/');
  };

  const handleViewSelect = (view: ViewType) => {
    setSelectedView(view);
    setSelectedListId(null);
    setSearchQuery('');
    if (pathname !== '/') router.push('/');
  };

  const handleListSelect = (listId: string) => {
    setSelectedListId(listId);
    setSelectedView('all');
    setSearchQuery('');
    if (pathname !== '/') router.push('/');
  };

  const handleShareList = (e: React.MouseEvent, listId: string) => {
    e.stopPropagation();
    const shareUrl = `${window.location.origin}?listId=${listId}`;
    navigator.clipboard.writeText(shareUrl);
    toast.success('Squad link copied to clipboard!', {
      description: 'Share this link with your squad to collaborate in real-time.',
    });
  };

  return (
    <nav 
      className="w-72 border-r border-border/30 flex flex-col bg-background/20 backdrop-blur-md"
      aria-label="Main Navigation"
    >
      {/* Header */}
      <div className="p-5 border-b border-border/30">
        <div className="flex items-center justify-between mb-6">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <div 
                className="flex items-center gap-2 group cursor-pointer"
                role="button"
                data-cursor="hover"
                tabIndex={0}
                aria-label="Account Settings"
              >
                <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-primary-foreground font-bold shadow-lg shadow-primary/20 group-hover:scale-110 transition-transform overflow-hidden" aria-hidden="true">
                  {session?.user?.image ? (
                    <img src={session.user.image} alt={session.user.name || ''} className="w-full h-full object-cover" />
                  ) : (
                    (session?.user?.name?.[0] || 'U').toUpperCase()
                  )}
                </div>
                <div className="flex flex-col">
                  <span className="text-sm font-bold text-foreground leading-tight truncate max-w-[120px]">
                    {session?.user?.name || 'User'}
                  </span>
                  <span className="text-[10px] text-muted-foreground">Personal Workspace</span>
                </div>
                <ChevronDown className="w-3 h-3 text-muted-foreground ml-1" aria-hidden="true" />
              </div>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-56 rounded-xl shadow-xl border-border/40">
              <div className="px-2 py-2 border-b border-border/30 mb-1">
                <p className="text-xs font-semibold text-muted-foreground px-2 pb-1">Account</p>
                <div className="flex items-center gap-2 px-2 py-1">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary text-xs font-bold">
                    {(session?.user?.name?.[0] || 'U').toUpperCase()}
                  </div>
                  <div className="flex flex-col overflow-hidden">
                    <p className="text-sm font-medium truncate">{session?.user?.name}</p>
                    <p className="text-[10px] text-muted-foreground truncate">{session?.user?.email}</p>
                  </div>
                </div>
              </div>
              <DropdownMenuItem className="gap-2 rounded-lg py-2 cursor-pointer">
                <User className="w-4 h-4 text-muted-foreground" />
                <span>Profile</span>
              </DropdownMenuItem>
              <DropdownMenuItem className="gap-2 rounded-lg py-2 cursor-pointer">
                <Settings className="w-4 h-4 text-muted-foreground" />
                <span>Settings</span>
              </DropdownMenuItem>
              <div className="h-px bg-border/30 my-1" />
              <DropdownMenuItem 
                className="gap-2 rounded-lg py-2 cursor-pointer text-destructive focus:text-destructive focus:bg-destructive/10"
                onClick={() => signOut()}
              >
                <LogOut className="w-4 h-4" />
                <span>Log out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <div className="flex items-center gap-1">
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0 rounded-xl hover:bg-accent/50" aria-label="Notifications">
              <Bell className="w-4 h-4" />
            </Button>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="h-8 w-8 p-0 rounded-xl hover:bg-accent/50" 
                  aria-label={`Current theme: ${getThemeLabel()}. Click to change.`}
                >
                  {getThemeIcon()}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-40">
                <DropdownMenuItem onClick={() => setTheme('light')} className="gap-2">
                  <Sun className="w-4 h-4" />
                  <span>Light</span>
                  {theme === 'light' && <Check className="w-3.5 h-3.5 ml-auto text-primary" />}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setTheme('dark')} className="gap-2">
                  <Moon className="w-4 h-4" />
                  <span>Dark</span>
                  {theme === 'dark' && <Check className="w-3.5 h-3.5 ml-auto text-primary" />}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setTheme('system')} className="gap-2">
                  <Monitor className="w-4 h-4" />
                  <span>System</span>
                  {theme === 'system' && <Check className="w-3.5 h-3.5 ml-auto text-primary" />}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
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

        <TaskForm open={isTaskFormOpen} onOpenChange={setTaskFormOpen} />
        <ListForm open={listFormOpen} onOpenChange={setListFormOpen} />
        <LabelForm open={labelFormOpen} onOpenChange={setLabelFormOpen} />

        <div className="relative group">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" aria-hidden="true" />
          <Input
            ref={searchInputRef}
            type="text"
            placeholder="Search tasks..."
            className="pl-9 rounded-xl bg-background/40 border-border/50 focus:bg-background/80 transition-all h-10 text-sm"
            onChange={(e) => handleSearch(e.target.value)}
            onFocus={() => setSearchFocused(true)}
            onBlur={() => setSearchFocused(false)}
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
              aria-current={selectedView === view.id && !selectedListId && pathname === '/' ? 'page' : undefined}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
                selectedView === view.id && !selectedListId && pathname === '/'
                  ? 'bg-primary/10 text-primary shadow-sm'
                  : 'hover:bg-accent/40 text-muted-foreground hover:text-foreground'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className={`p-1.5 rounded-lg transition-colors ${
                  selectedView === view.id && !selectedListId && pathname === '/' ? 'bg-primary/20' : 'bg-transparent'
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

        {/* Analytics Link */}
        <div className="px-4 py-2 space-y-1">
          <h3 className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-2 px-3">Insights</h3>
          <Link
            href="/analytics"
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
              pathname === '/analytics'
                ? 'bg-primary/10 text-primary shadow-sm'
                : 'hover:bg-accent/40 text-muted-foreground hover:text-foreground'
            }`}
          >
            <div className={`p-1.5 rounded-lg transition-colors ${
              pathname === '/analytics' ? 'bg-primary/20' : 'bg-transparent'
            }`}>
              <TrendingUp className="w-4 h-4" />
            </div>
            <span>Analytics</span>
          </Link>
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
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 rounded-lg hover:bg-primary/20 text-muted-foreground hover:text-primary opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={(e) => handleShareList(e, list.id)}
                  aria-label="Share list"
                >
                  <Share2 className="w-3.5 h-3.5" />
                </Button>
                {(list.isDefault || tasks.filter(t => t.listId === list.id && !t.completed).length > 0) && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-primary/20 text-primary" aria-label={`${tasks.filter(t => t.listId === list.id && !t.completed).length} tasks`}>
                    {tasks.filter(t => t.listId === list.id && !t.completed).length || '0'}
                  </span>
                )}
              </div>
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

      {/* Templates Section */}
      <div className="px-4 py-4 border-t border-border/10">
        <div 
          className="flex items-center justify-between px-2 mb-3 cursor-pointer group"
          onClick={() => setShowTemplates(!showTemplates)}
        >
          <h2 className="text-[11px] font-bold text-muted-foreground uppercase tracking-[0.2em] flex items-center gap-2">
            <LayoutTemplate className="w-3 h-3" />
            Templates
          </h2>
          <ChevronDown className={`w-3.5 h-3.5 text-muted-foreground transition-transform duration-300 ${showTemplates ? '' : '-rotate-90'}`} />
        </div>
        
        <AnimatePresence initial={false}>
          {showTemplates && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2, ease: "easeInOut" }}
              className="overflow-hidden space-y-1"
            >
              {templates.map((template) => (
                <div
                  key={template.id}
                  className="group flex items-center justify-between px-3 py-2 rounded-xl text-sm transition-all hover:bg-muted/40 text-muted-foreground hover:text-foreground"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full bg-primary/40 group-hover:bg-primary transition-colors" />
                    <span className="font-medium truncate max-w-[120px]">{template.name}</span>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={async (e) => {
                      e.stopPropagation();
                      if (confirm('Are you sure you want to delete this template?')) {
                        try {
                          await fetch(`/api/templates/${template.id}`, { method: 'DELETE' });
                          deleteTemplate(template.id);
                          toast.success('Template deleted');
                        } catch {
                          toast.error('Failed to delete template');
                        }
                      }
                    }}
                  >
                    <Trash2 className="h-3.5 w-3.5 text-destructive" />
                  </Button>
                </div>
              ))}
              {templates.length === 0 && (
                <p className="px-3 py-2 text-xs text-muted-foreground italic">No templates yet. Save a task as a template to see it here.</p>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </nav>
  );
}