import { daysBetween } from "./format";
import { Supplement, SupplementLog } from "./supabase/types";

/** Is a supplement due on a given date per its schedule? */
export function isDueOn(supp: Supplement, date: string): boolean {
  if (!supp.active) return false;
  switch (supp.schedule) {
    case "daily":
      return true;
    case "alternate": {
      const diff = daysBetween(supp.anchor_date, date);
      return diff >= 0 && diff % 2 === 0;
    }
    case "weekly": {
      const weekday = new Date(date + "T00:00:00").getDay(); // 0=Sun
      return supp.days_of_week.includes(weekday);
    }
    default:
      return false;
  }
}

export type SuppSlotStatus = "taken" | "skipped" | "pending";

export interface SuppSlot {
  supplement: Supplement;
  /** "HH:MM:SS" or null when the supplement has no specific times */
  slotTime: string | null;
  status: SuppSlotStatus;
  log: SupplementLog | null;
}

/**
 * Expand the supplements due on `date` into per-time-slot rows, resolving each
 * against the day's logs. A supplement with no `times` yields a single null slot.
 */
export function slotsForDate(
  supplements: Supplement[],
  logs: SupplementLog[],
  date: string
): SuppSlot[] {
  const slots: SuppSlot[] = [];
  for (const supp of supplements) {
    if (!isDueOn(supp, date)) continue;
    const times = supp.times.length > 0 ? supp.times : [null];
    for (const slotTime of times) {
      const log =
        logs.find(
          (l) => l.supplement_id === supp.id && (l.slot_time ?? null) === slotTime
        ) || null;
      slots.push({
        supplement: supp,
        slotTime,
        status: log ? log.status : "pending",
        log,
      });
    }
  }
  return slots.sort((a, b) => (a.slotTime ?? "99").localeCompare(b.slotTime ?? "99"));
}
