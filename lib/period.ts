import { addDays, todayStr, formatDate } from "./format";
import {
  weekDates,
  startOfMonth,
  endOfMonth,
  addMonths,
  monthLabel,
} from "./calendar";

export type PeriodView = "day" | "week" | "month";

export interface PeriodRange {
  from: string;
  to: string;
}

/** Inclusive [from, to] date bounds for the period containing `anchor`. */
export function periodRange(view: PeriodView, anchor: string): PeriodRange {
  if (view === "day") return { from: anchor, to: anchor };
  if (view === "week") {
    const w = weekDates(anchor);
    return { from: w[0], to: w[6] };
  }
  return { from: startOfMonth(anchor), to: endOfMonth(anchor) };
}

/** Move the anchor by one period in the given direction (-1 prev, +1 next). */
export function shiftAnchor(view: PeriodView, anchor: string, dir: number): string {
  if (view === "day") return addDays(anchor, dir);
  if (view === "week") return addDays(anchor, dir * 7);
  return addMonths(anchor, dir);
}

/** Human label for the period — "Today", "This week", a date range, or a month. */
export function periodLabel(view: PeriodView, anchor: string): string {
  const today = todayStr();
  if (view === "day") {
    if (anchor === today) return "Today";
    if (anchor === addDays(today, -1)) return "Yesterday";
    if (anchor === addDays(today, 1)) return "Tomorrow";
    return formatDate(anchor);
  }
  if (view === "week") {
    const w = weekDates(anchor);
    const tw = weekDates(today);
    if (w[0] === tw[0]) return "This week";
    if (w[0] === addDays(tw[0], -7)) return "Last week";
    const fmt = (d: string) =>
      new Date(d + "T00:00:00").toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
      });
    return `${fmt(w[0])} – ${fmt(w[6])}`;
  }
  if (startOfMonth(anchor) === startOfMonth(today)) return "This month";
  return monthLabel(anchor);
}

/** True when the period's end is today or later — used to disable "next". */
export function isCurrentPeriod(view: PeriodView, anchor: string): boolean {
  return periodRange(view, anchor).to >= todayStr();
}

/** Number of days in an inclusive range. */
export function rangeDays(range: PeriodRange): number {
  const a = new Date(range.from + "T00:00:00").getTime();
  const b = new Date(range.to + "T00:00:00").getTime();
  return Math.round((b - a) / 86_400_000) + 1;
}

/** Every date string in an inclusive range (capped for safety). */
export function datesInRange(range: PeriodRange, cap = 370): string[] {
  const out: string[] = [];
  let cur = range.from;
  let i = 0;
  while (cur <= range.to && i < cap) {
    out.push(cur);
    cur = addDays(cur, 1);
    i++;
  }
  return out;
}
