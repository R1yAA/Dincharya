"use client";

import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { CycleDay } from "@/lib/supabase/types";
import { todayStr, addDays } from "@/lib/format";
import { predictNext } from "@/lib/cycle";

interface CycleCalendarProps {
  days: CycleDay[];
  onDayClick: (date: string) => void;
  defaults: { cycleLen: number; periodLen: number };
}

export function CycleCalendar({ days, onDayClick, defaults }: CycleCalendarProps) {
  const [viewDate, setViewDate] = useState(() => new Date());
  const today = todayStr();

  const prediction = useMemo(() => predictNext(days, defaults), [days, defaults]);
  const periodDates = useMemo(
    () => new Set(days.filter((d) => d.is_period).map((d) => d.date)),
    [days]
  );
  const symptomDates = useMemo(
    () => new Set(days.filter((d) => !d.is_period).map((d) => d.date)),
    [days]
  );

  const predictedDates = useMemo(() => {
    if (!prediction) return new Set<string>();
    const dates = new Set<string>();
    let d = prediction.windowStart;
    while (d <= prediction.windowEnd) {
      dates.add(d);
      d = addDays(d, 1);
    }
    return dates;
  }, [prediction]);

  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const monthLabel = new Intl.DateTimeFormat("en-IN", { month: "long", year: "numeric" }).format(viewDate);

  const cells: (number | null)[] = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  const dateStr = (day: number) => {
    const m = String(month + 1).padStart(2, "0");
    const d = String(day).padStart(2, "0");
    return `${year}-${m}-${d}`;
  };

  return (
    <div className="flex flex-col gap-2">
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

      <div className="grid grid-cols-7 text-center text-xs text-fg-dim">
        {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((d) => (
          <div key={d} className="py-1">{d}</div>
        ))}
      </div>

      <div className="grid grid-cols-7 text-center text-sm">
        {cells.map((day, i) => {
          if (day === null) return <div key={i} />;
          const ds = dateStr(day);
          const isPeriod = periodDates.has(ds);
          const hasSym = symptomDates.has(ds);
          const isPredicted = predictedDates.has(ds) && !isPeriod;
          const isOvulation = prediction?.ovulationEstimate === ds;
          const isNow = ds === today;

          return (
            <button
              key={i}
              onClick={() => onDayClick(ds)}
              className={cn(
                "relative w-9 h-9 mx-auto rounded-full flex items-center justify-center transition-colors",
                isPeriod && "bg-cycle text-white",
                isPredicted && "border border-dashed border-cycle/50 text-cycle/70",
                !isPeriod && !isPredicted && "text-fg hover:bg-elevated",
                isNow && !isPeriod && "ring-2 ring-brand"
              )}
            >
              {day}
              {isOvulation && !isPeriod && (
                <span className="absolute bottom-0.5 w-1.5 h-1.5 rounded-full bg-cycle/60" />
              )}
              {hasSym && !isPeriod && (
                <span className="absolute bottom-0.5 w-1.5 h-1.5 rounded-full bg-fg-dim" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
