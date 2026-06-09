import { CycleDay } from "./supabase/types";
import { daysBetween, addDays } from "./format";

export interface CycleBlock {
  start: string;
  periodLength: number;
  cycleLength: number | null;
}

export function deriveCycles(days: CycleDay[]): CycleBlock[] {
  const periodDays = days
    .filter((d) => d.is_period)
    .map((d) => d.date)
    .sort();

  if (periodDays.length === 0) return [];

  const blocks: { start: string; dates: string[] }[] = [];
  let current = { start: periodDays[0], dates: [periodDays[0]] };

  for (let i = 1; i < periodDays.length; i++) {
    const gap = daysBetween(periodDays[i - 1], periodDays[i]);
    if (gap <= 2) {
      current.dates.push(periodDays[i]);
    } else {
      blocks.push(current);
      current = { start: periodDays[i], dates: [periodDays[i]] };
    }
  }
  blocks.push(current);

  return blocks.map((block, i) => ({
    start: block.start,
    periodLength: block.dates.length,
    cycleLength:
      i < blocks.length - 1
        ? daysBetween(block.start, blocks[i + 1].start)
        : null,
  }));
}

export type CyclePhase = "Menstrual" | "Follicular" | "Ovulation" | "Luteal";

export interface CycleStatus {
  cycleDay: number;
  phase: CyclePhase;
  lastPeriodStart: string;
  avgCycleLen: number;
  avgPeriodLen: number;
  nextPeriodEstimate: string;
  daysUntilNext: number;
}

export function currentCycle(
  cycleDays: CycleDay[],
  today: string,
  defaults: { cycleLen: number; periodLen: number }
): CycleStatus | null {
  const cycles = deriveCycles(cycleDays);
  if (cycles.length === 0) return null;

  const lastBlock = cycles[cycles.length - 1];
  const avgCycleLen =
    cycles.length >= 2
      ? Math.round(
          cycles
            .filter((c) => c.cycleLength !== null)
            .reduce((s, c) => s + c.cycleLength!, 0) /
            cycles.filter((c) => c.cycleLength !== null).length
        )
      : defaults.cycleLen;

  const avgPeriodLen =
    cycles.length >= 2
      ? Math.round(
          cycles.reduce((s, c) => s + c.periodLength, 0) / cycles.length
        )
      : defaults.periodLen;

  const cycleDay = daysBetween(lastBlock.start, today) + 1;
  const nextPeriodEstimate = addDays(lastBlock.start, avgCycleLen);
  const daysUntilNext = daysBetween(today, nextPeriodEstimate);

  const isBleeding = cycleDays.some(
    (d) => d.date === today && d.is_period
  );

  let phase: CyclePhase;
  if (isBleeding || cycleDay <= avgPeriodLen) {
    phase = "Menstrual";
  } else if (cycleDay <= avgCycleLen - 16) {
    phase = "Follicular";
  } else if (cycleDay <= avgCycleLen - 12) {
    phase = "Ovulation";
  } else {
    phase = "Luteal";
  }

  return {
    cycleDay,
    phase,
    lastPeriodStart: lastBlock.start,
    avgCycleLen,
    avgPeriodLen,
    nextPeriodEstimate,
    daysUntilNext,
  };
}

export function predictNext(
  cycleDays: CycleDay[],
  defaults: { cycleLen: number; periodLen: number }
): {
  nextStart: string;
  windowStart: string;
  windowEnd: string;
  ovulationEstimate: string;
} | null {
  const cycles = deriveCycles(cycleDays);
  if (cycles.length === 0) return null;

  const lastBlock = cycles[cycles.length - 1];
  const lengths = cycles
    .filter((c) => c.cycleLength !== null)
    .map((c) => c.cycleLength!);
  const avgLen =
    lengths.length >= 1
      ? Math.round(lengths.reduce((a, b) => a + b, 0) / lengths.length)
      : defaults.cycleLen;

  const variance =
    lengths.length >= 2
      ? Math.round(
          Math.sqrt(
            lengths.reduce((s, l) => s + (l - avgLen) ** 2, 0) / lengths.length
          )
        )
      : 2;

  const margin = Math.max(2, variance);
  const nextStart = addDays(lastBlock.start, avgLen);
  const ovulationEstimate = addDays(lastBlock.start, avgLen - 14);

  return {
    nextStart,
    windowStart: addDays(nextStart, -margin),
    windowEnd: addDays(nextStart, margin),
    ovulationEstimate,
  };
}

export function getPhaseForDay(
  cycleDay: number,
  avgCycleLen: number,
  avgPeriodLen: number
): CyclePhase {
  if (cycleDay <= avgPeriodLen) return "Menstrual";
  if (cycleDay <= avgCycleLen - 16) return "Follicular";
  if (cycleDay <= avgCycleLen - 12) return "Ovulation";
  return "Luteal";
}
