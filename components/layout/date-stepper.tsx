"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { formatDate, addDays, todayStr } from "@/lib/format";

interface DateStepperProps {
  date: string;
  onChange: (date: string) => void;
}

export function DateStepper({ date, onChange }: DateStepperProps) {
  const today = todayStr();
  const isToday = date === today;

  return (
    <div className="flex items-center justify-center gap-3 py-2">
      <button
        onClick={() => onChange(addDays(date, -1))}
        className="p-1.5 rounded-lg hover:bg-elevated text-fg-muted"
      >
        <ChevronLeft size={20} />
      </button>
      <button
        onClick={() => onChange(today)}
        className="text-sm font-medium text-fg min-w-[120px] text-center"
      >
        {isToday ? "Today" : formatDate(date)}
      </button>
      <button
        onClick={() => onChange(addDays(date, 1))}
        className="p-1.5 rounded-lg hover:bg-elevated text-fg-muted"
        disabled={date >= today}
      >
        <ChevronRight size={20} className={date >= today ? "opacity-30" : ""} />
      </button>
    </div>
  );
}
