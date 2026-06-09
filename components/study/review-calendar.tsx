"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { todayStr } from "@/lib/format";
import { useRecallMonth, DayStat } from "@/hooks/use-recall-month";

interface ReviewCalendarProps {
  onDayClick: (date: string) => void;
  selectedDate: string | null;
}

function PercentRing({
  pct,
  size = 36,
  stroke = 3,
  children,
}: {
  pct: number;
  size?: number;
  stroke?: number;
  children: React.ReactNode;
}) {
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (pct / 100) * circumference;

  const color =
    pct === 100
      ? "stroke-success"
      : pct >= 50
        ? "stroke-brand"
        : pct > 0
          ? "stroke-violet"
          : "stroke-transparent";

  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      <svg
        width={size}
        height={size}
        className="absolute inset-0 -rotate-90"
      >
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          className="stroke-line"
          strokeWidth={stroke}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          className={color}
          strokeWidth={stroke}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
        />
      </svg>
      {children}
    </div>
  );
}

export function ReviewCalendar({ onDayClick, selectedDate }: ReviewCalendarProps) {
  const [viewDate, setViewDate] = useState(() => new Date());
  const today = todayStr();

  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();
  const { dayStats } = useRecallMonth(year, month);

  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const monthLabel = new Intl.DateTimeFormat("en-IN", {
    month: "long",
    year: "numeric",
  }).format(viewDate);

  const cells: (number | null)[] = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  const dateStr = (day: number) => {
    const m = String(month + 1).padStart(2, "0");
    const d = String(day).padStart(2, "0");
    return `${year}-${m}-${d}`;
  };

  return (
    <div className="flex flex-col gap-3">
      {/* Month navigation */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => setViewDate(new Date(year, month - 1, 1))}
          className="p-1.5 rounded-lg hover:bg-elevated text-fg-muted"
        >
          <ChevronLeft size={18} />
        </button>
        <span className="text-sm font-medium text-fg">{monthLabel}</span>
        <button
          onClick={() => setViewDate(new Date(year, month + 1, 1))}
          className="p-1.5 rounded-lg hover:bg-elevated text-fg-muted"
        >
          <ChevronRight size={18} />
        </button>
      </div>

      {/* Weekday headers */}
      <div className="grid grid-cols-7 text-center text-xs text-fg-dim">
        {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((d) => (
          <div key={d} className="py-1">
            {d}
          </div>
        ))}
      </div>

      {/* Day grid */}
      <div className="grid grid-cols-7 gap-y-1">
        {cells.map((day, i) => {
          if (day === null) return <div key={i} />;

          const ds = dateStr(day);
          const stat = dayStats.get(ds);
          const isNow = ds === today;
          const isSelected = ds === selectedDate;
          const hasPct = stat && stat.total > 0;

          return (
            <div key={i} className="flex justify-center">
              <button
                onClick={() => onDayClick(ds)}
                className={cn(
                  "relative flex items-center justify-center transition-colors rounded-full",
                  isSelected && "bg-elevated"
                )}
              >
                {hasPct ? (
                  <PercentRing pct={stat.pct}>
                    <span
                      className={cn(
                        "text-xs font-medium z-10",
                        isNow ? "text-brand" : "text-fg"
                      )}
                    >
                      {day}
                    </span>
                  </PercentRing>
                ) : (
                  <div
                    className={cn(
                      "w-9 h-9 flex items-center justify-center text-xs rounded-full",
                      isNow ? "text-brand font-bold" : "text-fg-dim"
                    )}
                  >
                    {day}
                  </div>
                )}
              </button>
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="flex items-center justify-center gap-4 text-xs text-fg-dim">
        <span className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-success" /> 100%
        </span>
        <span className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-brand" /> 50%+
        </span>
        <span className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-violet" /> started
        </span>
        <span className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-line" /> pending
        </span>
      </div>
    </div>
  );
}
