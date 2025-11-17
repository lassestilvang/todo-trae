'use client';

import { useState } from 'react';
import { RecurringType } from '@/types';
import { Repeat, Calendar, CalendarDays, CalendarRange } from 'lucide-react';
import { Select } from '@/components/ui/Select';
import { Input } from '@/components/ui/Input';

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
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Repeat className="w-4 h-4 text-muted-foreground" />
        <Select
          value={value || 'none'}
          onChange={(e) => handleTypeChange(e.target.value)}
        >
          <option value="none">Does not repeat</option>
          {recurringOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </Select>
      </div>

      {value && (
        <div className="ml-6 space-y-2">
          <div className="flex items-center gap-2">
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
              className="rounded"
            />
            <label htmlFor="has-end-date" className="text-sm">
              End on a specific date
            </label>
          </div>

          {showEndDate && (
            <Input
              type="date"
              value={endDate ? endDate.toISOString().split('T')[0] : ''}
              onChange={(e) => handleEndDateChange(e.target.value)}
              min={new Date().toISOString().split('T')[0]}
              className="text-sm"
            />
          )}
        </div>
      )}
    </div>
  );
}