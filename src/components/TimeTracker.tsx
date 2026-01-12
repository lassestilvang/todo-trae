'use client';

import { useState, useEffect } from 'react';
import { Clock, Play, Pause, Square } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { motion, AnimatePresence } from 'framer-motion';

interface TimeTrackerProps {
  taskId: string;
  estimate?: string;
  actualTime?: string;
  onTimeUpdate: (actualTime: string) => void;
}

export function TimeTracker({ taskId, estimate, actualTime, onTimeUpdate }: TimeTrackerProps) {
  const [isTracking, setIsTracking] = useState(false);
  const [startTime, setStartTime] = useState<Date | null>(null);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [manualTime, setManualTime] = useState(actualTime || '');

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isTracking && startTime) {
      interval = setInterval(() => {
        setElapsedTime(Date.now() - startTime.getTime());
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isTracking, startTime]);

  const formatTime = (milliseconds: number) => {
    const totalSeconds = Math.floor(milliseconds / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    
    if (hours > 0) {
      return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  const parseTimeToMinutes = (time: string): number => {
    const parts = time.split(':');
    if (parts.length === 2) {
      return parseInt(parts[0]) * 60 + parseInt(parts[1]);
    } else if (parts.length === 3) {
      return parseInt(parts[0]) * 3600 + parseInt(parts[1]) * 60 + parseInt(parts[2]);
    }
    return 0;
  };

  const startTracking = () => {
    setIsTracking(true);
    setStartTime(new Date());
    setElapsedTime(0);
  };

  const pauseTracking = () => {
    setIsTracking(false);
    if (startTime) {
      const totalElapsed = elapsedTime;
      const previousMinutes = parseTimeToMinutes(manualTime);
      const newTotalMinutes = previousMinutes + Math.floor(totalElapsed / 60000);
      const newTime = `${Math.floor(newTotalMinutes / 60).toString().padStart(2, '0')}:${(newTotalMinutes % 60).toString().padStart(2, '0')}`;
      setManualTime(newTime);
      onTimeUpdate(newTime);
      setStartTime(null);
      setElapsedTime(0);
    }
  };

  const stopTracking = () => {
    pauseTracking();
    setIsTracking(false);
  };

  const handleManualTimeChange = (value: string) => {
    setManualTime(value);
    onTimeUpdate(value);
  };

  const currentDisplayTime = isTracking ? formatTime(elapsedTime) : manualTime;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-2">
        <h4 className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-2">
          <Clock className="w-3.5 h-3.5" />
          Time Tracking
        </h4>
        {estimate && (
          <div className="px-2 py-0.5 rounded-full bg-primary/5 border border-primary/10 shadow-sm">
            <span className="text-[9px] font-bold text-primary/70 uppercase tracking-tight">
              Est: {estimate}
            </span>
          </div>
        )}
      </div>

      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="relative flex-1 max-w-[140px]">
            <Input
              type="text"
              value={currentDisplayTime}
              onChange={(e) => handleManualTimeChange(e.target.value)}
              placeholder="00:00"
              className={`font-mono text-center text-lg h-11 bg-background/40 backdrop-blur-md border-border/30 focus:bg-background/60 transition-all rounded-xl ${
                isTracking ? 'text-primary border-primary/40 shadow-[0_0_15px_-3px_rgba(var(--primary),0.2)]' : ''
              }`}
              disabled={isTracking}
              aria-label="Current time tracking display"
            />
            {isTracking && (
              <motion.div
                layoutId="timer-glow"
                className="absolute inset-0 rounded-xl bg-primary/10 -z-10 blur-md"
                animate={{ 
                  opacity: [0.3, 0.6, 0.3],
                  scale: [1, 1.05, 1]
                }}
                transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
              />
            )}
          </div>
          
          <div className="flex gap-2">
            <AnimatePresence mode="wait">
              {!isTracking ? (
                <motion.div
                  key="start"
                  initial={{ opacity: 0, scale: 0.9, x: 10 }}
                  animate={{ opacity: 1, scale: 1, x: 0 }}
                  exit={{ opacity: 0, scale: 0.9, x: 10 }}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={startTracking}
                    className="h-11 px-5 bg-primary/10 text-primary border-primary/20 hover:bg-primary/20 hover:border-primary/30 transition-all rounded-xl shadow-sm"
                    aria-label="Start time tracking"
                  >
                    <Play className="w-4 h-4 mr-2 fill-current" />
                    <span className="font-bold text-xs uppercase tracking-wider">Start</span>
                  </Button>
                </motion.div>
              ) : (
                <motion.div
                  key="active"
                  initial={{ opacity: 0, scale: 0.9, x: 10 }}
                  animate={{ opacity: 1, scale: 1, x: 0 }}
                  exit={{ opacity: 0, scale: 0.9, x: 10 }}
                  className="flex gap-2"
                >
                  <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={pauseTracking}
                      className="h-11 px-4 bg-yellow-500/10 text-yellow-500 border-yellow-500/20 hover:bg-yellow-500/20 hover:border-yellow-500/30 transition-all rounded-xl shadow-sm"
                      aria-label="Pause time tracking"
                    >
                      <Pause className="w-4 h-4 mr-2 fill-current" />
                      <span className="font-bold text-xs uppercase tracking-wider">Pause</span>
                    </Button>
                  </motion.div>
                  <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={stopTracking}
                      className="h-11 px-4 bg-destructive/10 text-destructive border-destructive/20 hover:bg-destructive/20 hover:border-destructive/30 transition-all rounded-xl shadow-sm"
                      aria-label="Stop time tracking"
                    >
                      <Square className="w-4 h-4 mr-2 fill-current" />
                      <span className="font-bold text-xs uppercase tracking-wider">Stop</span>
                    </Button>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        <AnimatePresence>
          {isTracking && (
            <motion.div
              initial={{ height: 0, opacity: 0, y: -10 }}
              animate={{ height: 'auto', opacity: 1, y: 0 }}
              exit={{ height: 0, opacity: 0, y: -10 }}
              transition={{ type: 'spring', duration: 0.4, bounce: 0 }}
              className="overflow-hidden"
            >
              <div className="flex items-center gap-2.5 text-[10px] font-bold text-primary/70 uppercase tracking-widest bg-primary/5 py-2 px-4 rounded-xl w-fit border border-primary/10 shadow-sm">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
                </span>
                Session started at {startTime?.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}