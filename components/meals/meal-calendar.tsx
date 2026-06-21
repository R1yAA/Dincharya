"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { Meal } from "@/lib/supabase/types";
import {
  weekDates,
  monthMatrix,
  monthLabel,
  addMonths,
  WEEKDAY_LABELS,
} from "@/lib/calendar";
import { addDays, todayStr } from "@/lib/format";
import { cn } from "@/lib/utils";

interface MealCalendarProps {
  view: "week" | "month";
  /** anchor date for the visible period */
  cursor: string;
  selectedDate: string;
  meals: Meal[];
  onSelectDate: (date: string) => void;
  onChangeCursor: (date: string) => void;
}

interface DaySummary {
  count: number;
  sugar: boolean;
  junk: boolean;
  outside: boolean;
}

function summarize(meals: Meal[]): DaySummary {
  return {
    count: meals.length,
    sugar: meals.some((m) => m.processed_sugar),
    junk: meals.some((m) => m.health_rating === "junk"),
    outside: meals.some((m) => m.source === "outside" || m.source === "packaged"),
  };
}

function byDate(meals: Meal[]): Record<string, Meal[]> {
  return meals.reduce<Record<string, Meal[]>>((acc, m) => {
    (acc[m.date] ||= []).push(m);
    return acc;
  }, {});
}

function Dots({ s }: { s: DaySummary }) {
  if (s.count === 0) return <span className="block h-1.5" />;
  return (
    <span className="flex items-center justify-center gap-0.5 h-1.5">
      {s.junk && <span className="w-1.5 h-1.5 rounded-full bg-danger" />}
      {s.sugar && <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />}
      {s.outside && !s.junk && <span className="w-1.5 h-1.5 rounded-full bg-fg-dim" />}
      {!s.junk && !s.sugar && !s.outside && (
        <span className="w-1.5 h-1.5 rounded-full bg-brand" />
      )}
    </span>
  );
}

export function MealCalendar({
  view,
  cursor,
  selectedDate,
  meals,
  onSelectDate,
  onChangeCursor,
}: MealCalendarProps) {
  const today = todayStr();
  const grouped = byDate(meals);

  const prev = () =>
    onChangeCursor(view === "week" ? addDays(cursor, -7) : addMonths(cursor, -1));
  const next = () =>
    onChangeCursor(view === "week" ? addDays(cursor, 7) : addMonths(cursor, 1));

  const label =
    view === "week"
      ? (() => {
          const w = weekDates(cursor);
          const fmt = (d: string) =>
            new Date(d + "T00:00:00").toLocaleDateString("en-IN", {
              day: "numeric",
              month: "short",
            });
          return `${fmt(w[0])} – ${fmt(w[6])}`;
        })()
      : monthLabel(cursor);

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <button onClick={prev} className="p-1.5 rounded-lg hover:bg-elevated text-fg-muted">
          <ChevronLeft size={18} />
        </button>
        <span className="text-sm font-medium text-fg">{label}</span>
        <button onClick={next} className="p-1.5 rounded-lg hover:bg-elevated text-fg-muted">
          <ChevronRight size={18} />
        </button>
      </div>

      <div className="grid grid-cols-7 gap-1">
        {WEEKDAY_LABELS.map((d, i) => (
          <div key={i} className="text-center text-[10px] text-fg-dim font-medium py-1">
            {d}
          </div>
        ))}
      </div>

      {view === "week" ? (
        <div className="grid grid-cols-7 gap-1">
          {weekDates(cursor).map((d) => (
            <DayCell
              key={d}
              date={d}
              inMonth
              isToday={d === today}
              isSelected={d === selectedDate}
              isFuture={d > today}
              summary={summarize(grouped[d] || [])}
              onClick={() => onSelectDate(d)}
            />
          ))}
        </div>
      ) : (
        <div className="flex flex-col gap-1">
          {monthMatrix(cursor).map((week, wi) => (
            <div key={wi} className="grid grid-cols-7 gap-1">
              {week.map((cell) => (
                <DayCell
                  key={cell.date}
                  date={cell.date}
                  inMonth={cell.inMonth}
                  isToday={cell.date === today}
                  isSelected={cell.date === selectedDate}
                  isFuture={cell.date > today}
                  summary={summarize(grouped[cell.date] || [])}
                  onClick={() => onSelectDate(cell.date)}
                />
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function DayCell({
  date,
  inMonth,
  isToday,
  isSelected,
  isFuture,
  summary,
  onClick,
}: {
  date: string;
  inMonth: boolean;
  isToday: boolean;
  isSelected: boolean;
  isFuture: boolean;
  summary: DaySummary;
  onClick: () => void;
}) {
  const dayNum = Number(date.slice(8, 10));
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex flex-col items-center justify-center gap-1 aspect-square rounded-lg text-sm transition-colors",
        !inMonth && "opacity-30",
        isSelected
          ? "bg-brand text-bg font-semibold"
          : isToday
          ? "bg-elevated text-fg ring-1 ring-brand/40"
          : "text-fg-muted hover:bg-elevated",
        isFuture && "text-fg-dim"
      )}
    >
      <span>{dayNum}</span>
      <Dots s={summary} />
    </button>
  );
}
