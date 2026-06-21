import { addDays } from "./format";
import { startOfWeek } from "./calendar";
import { rangeDays, datesInRange } from "./period";

/** Theme colours as concrete hex values for Recharts (it can't read CSS vars). */
export const CHART = {
  brand: "#8BAE66",
  success: "#22C55E",
  amber: "#C9A227",
  danger: "#EF4444",
  violet: "#A78BFA",
  accent2: "#6AA8FF",
  cycle: "#E26D9A",
  grid: "#2A2A36",
  axis: "#6B7280",
  surface: "#16161D",
  fg: "#F5F5F7",
} as const;

export const tooltipStyle = {
  background: CHART.surface,
  border: `1px solid ${CHART.grid}`,
  borderRadius: 8,
  fontSize: 12,
  color: CHART.fg,
} as const;

export function shortDay(date: string): string {
  return new Date(date + "T00:00:00").toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
  });
}

export interface Bucket {
  label: string;
  from: string;
  to: string;
}

/**
 * Split a range into chart buckets: one per day for short ranges, one per week
 * once the range gets long enough that daily bars would be unreadable.
 */
export function buildBuckets(from: string, to: string): Bucket[] {
  if (!from || !to || from > to) return [];
  const days = rangeDays({ from, to });
  if (days <= 45) {
    return datesInRange({ from, to }).map((d) => ({
      label: shortDay(d),
      from: d,
      to: d,
    }));
  }
  const out: Bucket[] = [];
  let cur = startOfWeek(from);
  while (cur <= to) {
    const end = addDays(cur, 6);
    out.push({
      label: shortDay(cur < from ? from : cur),
      from: cur < from ? from : cur,
      to: end > to ? to : end,
    });
    cur = addDays(cur, 7);
  }
  return out;
}

/** Index of the bucket a date falls into, or -1. */
export function bucketOf(buckets: Bucket[], date: string): number {
  return buckets.findIndex((b) => date >= b.from && date <= b.to);
}

/** Sparse x-axis tick interval so labels don't overlap. */
export function tickInterval(n: number): number {
  return n > 10 ? Math.floor(n / 6) : 0;
}
