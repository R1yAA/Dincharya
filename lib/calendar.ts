import { addDays } from "./format";

function pad(n: number): string {
  return String(n).padStart(2, "0");
}

function toStr(d: Date): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

/** Monday-start week containing `date`. */
export function startOfWeek(date: string): string {
  const d = new Date(date + "T00:00:00");
  const dow = (d.getDay() + 6) % 7; // 0=Mon .. 6=Sun
  return addDays(date, -dow);
}

/** The 7 date strings (Mon..Sun) of the week containing `date`. */
export function weekDates(date: string): string[] {
  const start = startOfWeek(date);
  return Array.from({ length: 7 }, (_, i) => addDays(start, i));
}

export function startOfMonth(date: string): string {
  const d = new Date(date + "T00:00:00");
  return toStr(new Date(d.getFullYear(), d.getMonth(), 1));
}

export function endOfMonth(date: string): string {
  const d = new Date(date + "T00:00:00");
  return toStr(new Date(d.getFullYear(), d.getMonth() + 1, 0));
}

export function addMonths(date: string, n: number): string {
  const d = new Date(date + "T00:00:00");
  return toStr(new Date(d.getFullYear(), d.getMonth() + n, 1));
}

export interface MonthCell {
  date: string;
  inMonth: boolean;
}

/** Weeks of cells (Mon-start) spanning the month grid, padded to whole weeks. */
export function monthMatrix(date: string): MonthCell[][] {
  const first = startOfMonth(date);
  const last = endOfMonth(date);
  const monthIdx = new Date(first + "T00:00:00").getMonth();
  const gridStart = startOfWeek(first);
  const weeks: MonthCell[][] = [];
  let cursor = gridStart;
  // Build until we've passed the last day and completed the week.
  while (cursor <= last || new Date(cursor + "T00:00:00").getDay() !== 1) {
    const week: MonthCell[] = [];
    for (let i = 0; i < 7; i++) {
      week.push({
        date: cursor,
        inMonth: new Date(cursor + "T00:00:00").getMonth() === monthIdx,
      });
      cursor = addDays(cursor, 1);
    }
    weeks.push(week);
    if (weeks.length > 6) break; // safety
  }
  return weeks;
}

export const WEEKDAY_LABELS = ["M", "T", "W", "T", "F", "S", "S"] as const;

export function monthLabel(date: string): string {
  return new Date(date + "T00:00:00").toLocaleDateString("en-IN", {
    month: "long",
    year: "numeric",
  });
}
