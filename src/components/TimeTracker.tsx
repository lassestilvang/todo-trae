'use client';

import { useState, useEffect } from 'react';
import { Clock, Play, Pause, Square } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

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
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-medium flex items-center gap-2">
          <Clock className="w-4 h-4" />
          Time Tracking
        </h4>
        {estimate && (
          <span className="text-xs text-muted-foreground">
            Est: {estimate}
          </span>
        )}
      </div>

      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Input
            type="text"
            value={currentDisplayTime}
            onChange={(e) => handleManualTimeChange(e.target.value)}
            placeholder="HH:mm"
            className="font-mono text-center w-24"
            disabled={isTracking}
          />
          
          <div className="flex gap-1">
            {!isTracking ? (
              <Button
                variant="outline"
                size="sm"
                onClick={startTracking}
                className="h-8 px-2"
              >
                <Play className="w-3 h-3" />
              </Button>
            ) : (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={pauseTracking}
                  className="h-8 px-2"
                >
                  <Pause className="w-3 h-3" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={stopTracking}
                  className="h-8 px-2"
                >
                  <Square className="w-3 h-3" />
                </Button>
              </>
            )}
          </div>
        </div>

        {isTracking && (
          <div className="text-xs text-muted-foreground text-center">
            Tracking started at {startTime?.toLocaleTimeString()}
          </div>
        )}
      </div>
    </div>
  );
}