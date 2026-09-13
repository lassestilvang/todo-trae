'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession, signOut } from 'next-auth/react';
import { motion } from 'framer-motion';
import {
  Sun,
  Moon,
  Monitor,
  Check,
  Bell,
  BellOff,
  FileDown,
  FileUp,
  LogOut,
  User,
  Shield,
  Database,
  Gauge,
  Save,
  RotateCcw,
} from 'lucide-react';
import { Sidebar } from '@/components/Sidebar';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { useThemeStore } from '@/stores/themeStore';
import { useSettingsStore } from '@/stores/settingsStore';
import { toast } from 'sonner';
import { logger } from '@/lib/logger';
import Image from 'next/image';
import { z } from 'zod';

const EstimateSchema = z.string().refine(
  (val) => {
    if (val === '') return true; // null is valid
    return /^\d{1,3}:\d{2}$/.test(val);
  },
  { message: 'Use HH:MM format (e.g. 01:30)' }
);

export default function SettingsPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const { theme, setTheme } = useThemeStore();
  const {
    defaultPriority,
    defaultEstimate,
    notifications,
    setDefaultPriority,
    setDefaultEstimate,
    setNotifications,
    resetSettings,
  } = useSettingsStore();

  const [estimateInput, setEstimateInput] = useState(defaultEstimate ?? '');
  const [estimateError, setEstimateError] = useState<string | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);

  if (status === 'loading') {
    return (
      <div className="flex h-screen">
        <Sidebar />
        <div className="flex-1 flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  if (!session) {
    return null;
  }

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

  const handleExport = async () => {
    setIsExporting(true);
    try {
      const response = await fetch('/api/export');
      if (!response.ok) throw new Error('Export failed');
      const data = await response.json();
      const blob = new Blob([JSON.stringify(data, null, 2)], {
        type: 'application/json',
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `task-planner-export-${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success('Data exported successfully');
    } catch {
      toast.error('Failed to export data');
      logger.error('Export failed', {});
    } finally {
      setIsExporting(false);
    }
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsImporting(true);
    setImportError(null);
    try {
      const text = await file.text();
      const data = JSON.parse(text);
      const response = await fetch('/api/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('Import failed');
      const result = await response.json();
      toast.success(
        `Imported: ${result.imported.lists} lists, ${result.imported.labels} labels, ${result.imported.tasks} tasks`
      );
      e.target.value = '';
      // Refresh to show imported data
      window.location.reload();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to import data';
      setImportError(message);
      toast.error(message);
    } finally {
      setIsImporting(false);
    }
  };

  const handleEstimateChange = (value: string) => {
    setEstimateInput(value);
    setEstimateError(null);
  };

  const handleEstimateSave = () => {
    if (estimateInput === '') {
      setDefaultEstimate(null);
      setEstimateError(null);
      return;
    }
    const result = EstimateSchema.safeParse(estimateInput);
    if (!result.success) {
      setEstimateError(result.error.issues[0].message);
      return;
    }
    setDefaultEstimate(estimateInput);
    toast.success('Default estimate updated');
  };

  const handlePriorityChange = (value: string) => {
    setDefaultPriority(value as 'high' | 'medium' | 'low' | 'none');
    toast.success('Default priority updated');
  };

  return (
    <div className="flex h-screen bg-background text-foreground selection:bg-primary/20">
      <Sidebar />

      <main className="flex-1 overflow-y-auto p-8 bg-background/40 backdrop-blur-3xl">
        <header className="mb-8">
          <h1 className="text-3xl font-black tracking-tight mb-2 bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
            Settings
          </h1>
          <p className="text-muted-foreground">Customize your Daily Task Planner experience.</p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Account Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="w-5 h-5 text-primary" />
                  Account
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-4 mb-4">
                  {session.user?.image ? (
                    <Image
                      src={session.user.image}
                      alt={session.user.name || ''}
                      width={48}
                      height={48}
                      className="rounded-full"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-bold text-xl">
                      {session.user?.name?.[0] || session.user?.email?.[0] || 'U'}
                    </div>
                  )}
                  <div>
                    <p className="font-bold text-foreground">{session.user?.name || 'User'}</p>
                    <p className="text-sm text-muted-foreground">{session.user?.email}</p>
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full justify-start gap-2"
                  onClick={() => signOut()}
                >
                  <LogOut className="w-4 h-4" />
                  Sign out
                </Button>
              </CardContent>
            </Card>
          </motion.div>

          {/* Theme Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Monitor className="w-5 h-5 text-primary" />
                  Appearance
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-2">
                  Choose how the app looks and feels.
                </p>
                <div className="flex items-center gap-2 mb-4 px-3 py-2 rounded-xl bg-muted/20">
                  {getThemeIcon()}
                  <span className="text-sm font-medium">{getThemeLabel()}</span>
                </div>
                <div className="space-y-2">
                  {(
                    [
                      { value: 'light', label: 'Light', icon: Sun },
                      { value: 'dark', label: 'Dark', icon: Moon },
                      { value: 'system', label: 'System', icon: Monitor },
                    ] as const
                  ).map((option) => {
                    const Icon = option.icon;
                    const isSelected = theme === option.value;
                    return (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => setTheme(option.value)}
                        className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium transition-all ${
                          isSelected
                            ? 'bg-primary/10 text-primary ring-2 ring-primary/30'
                            : 'hover:bg-accent/40 text-muted-foreground hover:text-foreground'
                        }}`}
                      >
                        <Icon className="w-4 h-4" />
                        <span>{option.label}</span>
                        {isSelected && <Check className="w-3.5 h-3.5 ml-auto text-primary" />}
                      </button>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Default Task Settings */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Gauge className="w-5 h-5 text-primary" />
                  Default Task Settings
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  These defaults are applied when creating new tasks.
                </p>
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-foreground mb-2 block">
                      Default Priority
                    </label>
                    <Select
                      value={defaultPriority}
                      onChange={(e) => handlePriorityChange(e.target.value)}
                      className="w-full"
                    >
                      <option value="none">None</option>
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                    </Select>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-foreground mb-2 block">
                      Default Estimate (HH:MM)
                    </label>
                    <div className="flex gap-2">
                      <Input
                        type="text"
                        placeholder="e.g. 01:30"
                        value={estimateInput}
                        onChange={(e) => handleEstimateChange(e.target.value)}
                        className="flex-1"
                        aria-invalid={!!estimateError}
                      />
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleEstimateSave}
                        aria-label="Save estimate"
                      >
                        <Save className="w-4 h-4" />
                      </Button>
                    </div>
                    {estimateError && (
                      <p className="text-xs text-destructive mt-1">{estimateError}</p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Notifications Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bell className="w-5 h-5 text-primary" />
                  Notifications
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  Control how and when you get notified.
                </p>
                <div className="space-y-3">
                  {[
                    {
                      key: 'reminders',
                      label: 'Task Reminders',
                      description: 'Notify me before tasks are due',
                      icon: Bell,
                    },
                    {
                      key: 'dailySummary',
                      label: 'Daily Summary',
                      description: 'Receive a summary of your tasks each day',
                      icon: BellOff,
                    },
                    {
                      key: 'focusModeAlerts',
                      label: 'Focus Mode Alerts',
                      description: 'Sound and visual cues during focus sessions',
                      icon: Gauge,
                    },
                    {
                      key: 'pushNotifications',
                      label: 'Push Notifications',
                      description: 'Enable browser push notifications',
                      icon: Bell,
                    },
                  ].map((setting) => {
                    const Icon = setting.icon;
                    const enabled = notifications[setting.key as keyof typeof notifications];
                    return (
                      <div key={setting.key} className="flex items-center justify-between py-2">
                        <div className="flex items-start gap-3">
                          <div className="p-2 rounded-lg bg-muted/30">
                            <Icon className="w-4 h-4 text-muted-foreground" />
                          </div>
                          <div>
                            <p className="font-medium text-foreground">{setting.label}</p>
                            <p className="text-xs text-muted-foreground">{setting.description}</p>
                          </div>
                        </div>
                        <button
                          type="button"
                          role="switch"
                          aria-checked={enabled}
                          onClick={() =>
                            setNotifications({
                              [setting.key]: !enabled,
                            } as Record<string, boolean>)
                          }
                          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                            enabled ? 'bg-primary' : 'bg-muted'
                          }`}
                        >
                          <span
                            className={`inline-block h-5 w-5 transform transition-transform ${
                              enabled
                                ? 'translate-x-5 bg-white'
                                : 'translate-x-1 bg-muted-foreground/50'
                            } rounded-full`}
                          />
                        </button>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Data Management */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Database className="w-5 h-5 text-primary" />
                  Data Management
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  Export or import your task data as JSON.
                </p>
                <div className="flex flex-col gap-3">
                  <Button
                    variant="outline"
                    onClick={handleExport}
                    disabled={isExporting}
                    className="w-full justify-start gap-2"
                  >
                    <FileDown className="w-4 h-4" />
                    {isExporting ? 'Exporting...' : 'Export Data'}
                  </Button>
                  <div className="relative">
                    <Input
                      id="import-file-input"
                      type="file"
                      accept=".json,application/json"
                      onChange={handleImport}
                      disabled={isImporting}
                      className="file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-medium file:bg-primary/10 file:text-primary hover:file:bg-primary/20"
                      aria-label="Import data from JSON file"
                    />
                    <FileUp className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  </div>
                  {importError && <p className="text-xs text-destructive">{importError}</p>}
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Reset Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
          >
            <Card className="border-destructive/30">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-destructive">
                  <RotateCcw className="w-5 h-5" />
                  Reset Settings
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  Restore all settings to their default values. This cannot be undone.
                </p>
                <Button
                  variant="outline"
                  className="w-full justify-start gap-2 text-destructive hover:bg-destructive/10"
                  onClick={() => {
                    if (confirm('Are you sure you want to reset all settings to defaults?')) {
                      resetSettings();
                      setEstimateInput('');
                      toast.success('Settings reset to defaults');
                    }
                  }}
                >
                  <RotateCcw className="w-4 h-4" />
                  Reset to Defaults
                </Button>
              </CardContent>
            </Card>
          </motion.div>

          {/* Security Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="w-5 h-5 text-primary" />
                  Security & Privacy
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  Your data is private and never shared with third parties.
                </p>
                <ul className="text-sm text-muted-foreground space-y-2">
                  <li className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                    <span>All task data is stored locally in your workspace.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                    <span>No analytics or usage data is collected.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                    <span>Export is encrypted and sent only to your browser.</span>
                  </li>
                </ul>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </main>
    </div>
  );
}
