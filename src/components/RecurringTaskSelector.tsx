'use client';

import { useState } from 'react';
import { RecurringType } from '@/types';
import { Repeat, Calendar, CalendarDays, CalendarRange } from 'lucide-react';
import { Select } from '@/components/ui/Select';
import { Input } from '@/components/ui/Input';
import { motion, AnimatePresence } from 'framer-motion';

interface RecurringTaskSelectorProps {
  value?: RecurringType;
  endDate?: Date;
  onChange: (type: RecurringType | undefined, endDate?: Date) => void;
}

export function RecurringTaskSelector({ value, endDate, onChange }: RecurringTaskSelectorProps) {
  const [showEndDate, setShowEndDate] = useState(!!endDate);

  const recurringOptions = [
    { value: 'daily', label: 'Daily', icon: Calendar },
    { value: 'weekly', label: 'Weekly', icon: CalendarDays },
    { value: 'weekday', label: 'Weekdays (Mon-Fri)', icon: CalendarRange },
    { value: 'monthly', label: 'Monthly', icon: CalendarDays },
    { value: 'yearly', label: 'Yearly', icon: CalendarRange },
  ];

  const handleTypeChange = (newType: string) => {
    if (newType === 'none') {
      onChange(undefined, undefined);
      setShowEndDate(false);
    } else {
      onChange(newType as RecurringType, endDate);
    }
  };

  const handleEndDateChange = (date: string) => {
    const newEndDate = date ? new Date(date) : undefined;
    onChange(value, newEndDate);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 group">
        <div className="p-2.5 rounded-xl bg-primary/10 text-primary border border-primary/20 shadow-sm group-hover:bg-primary/20 transition-all">
          <Repeat className="w-4 h-4" />
        </div>
        <div className="flex-1 relative">
          <Select
            value={value || 'none'}
            onChange={(e) => handleTypeChange(e.target.value)}
            className="w-full bg-background/40 backdrop-blur-md border-border/30 focus:bg-background/60 hover:border-primary/30 transition-all rounded-xl h-10 text-sm font-medium"
            aria-label="Recurring task frequency"
          >
            <option value="none">Does not repeat</option>
            {recurringOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </Select>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {value && (
          <motion.div
            initial={{ height: 0, opacity: 0, y: -10 }}
            animate={{ height: 'auto', opacity: 1, y: 0 }}
            exit={{ height: 0, opacity: 0, y: -10 }}
            transition={{ type: 'spring', duration: 0.4, bounce: 0 }}
            className="ml-11 space-y-4 overflow-hidden"
          >
            <div className="flex items-center gap-3 group/check">
              <div className="relative flex items-center">
                <input
                  type="checkbox"
                  id="has-end-date"
                  checked={showEndDate}
                  onChange={(e) => {
                    setShowEndDate(e.target.checked);
                    if (!e.target.checked) {
                      onChange(value, undefined);
                    }
                  }}
                  className="w-4.5 h-4.5 rounded-lg border-border/40 bg-background/40 text-primary focus:ring-primary/20 transition-all cursor-pointer hover:border-primary/40"
                />
              </div>
              <label 
                htmlFor="has-end-date" 
                className="text-xs font-bold text-muted-foreground uppercase tracking-wider group-hover/check:text-primary transition-colors cursor-pointer"
              >
                End on a specific date
              </label>
            </div>

            <AnimatePresence>
              {showEndDate && (
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ type: 'spring', duration: 0.3 }}
                  className="pl-7"
                >
                  <Input
                    type="date"
                    value={endDate ? (endDate instanceof Date ? endDate.toISOString().split('T')[0] : '') : ''}
                    onChange={(e) => handleEndDateChange(e.target.value)}
                    min={new Date().toISOString().split('T')[0]}
                    className="text-sm bg-background/40 backdrop-blur-md border-border/30 focus:bg-background/60 hover:border-primary/30 transition-all max-w-[200px] rounded-xl h-10 font-medium"
                    aria-label="End date for recurring task"
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}