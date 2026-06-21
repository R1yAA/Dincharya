import { addDays, todayStr } from "./format";

/** One focus block = 50 minutes. Estimates are counted in blocks. */
export const BLOCK_MIN = 50;

/**
 * Spaced recall sequence (days between reviews). The first entry is the gap from
 * task completion to the first review; each later entry is measured from the
 * ACTUAL completion of the previous review (recompute-from-actual).
 */
export const RECALL_SEQUENCE = [1, 3, 7, 21, 45] as const;

export function blocksToMin(blocks: number): number {
  return blocks * BLOCK_MIN;
}

export function minToBlocks(min: number): number {
  return min / BLOCK_MIN;
}

export interface RecallState {
  step: number;
  interval_days: number;
  due_date: string;
  last_completed: string | null;
  active: boolean;
}

/** First review scheduled when a task is completed and flagged for recall. */
export function initialRecall(fromDate: string): RecallState {
  const interval = RECALL_SEQUENCE[0];
  return {
    step: 0,
    interval_days: interval,
    due_date: addDays(fromDate, interval),
    last_completed: null,
    active: true,
  };
}

/**
 * Complete the current review at `actualDate`: advance the step and recompute the
 * next due date from the actual completion date. The tail shifts forward rather
 * than stacking. Once the sequence is exhausted the recall is mastered (inactive).
 */
export function advanceRecall(rec: { step: number }, actualDate: string): RecallState {
  const nextStep = rec.step + 1;
  if (nextStep >= RECALL_SEQUENCE.length) {
    return {
      step: nextStep,
      interval_days: 0,
      due_date: actualDate,
      last_completed: actualDate,
      active: false,
    };
  }
  const interval = RECALL_SEQUENCE[nextStep];
  return {
    step: nextStep,
    interval_days: interval,
    due_date: addDays(actualDate, interval),
    last_completed: actualDate,
    active: true,
  };
}

/**
 * Push a due/overdue review forward without advancing the step — the antidote to
 * the "scary pile". Recomputes only the due date.
 */
export function deferRecall(days: number, fromDate: string = todayStr()): { due_date: string } {
  return { due_date: addDays(fromDate, days) };
}

/**
 * Actual-vs-estimate ratio for a task. >1 means it ran over the estimate, <1 under.
 * Returns null when there's no estimate to compare against.
 */
export function estimateAccuracy(estimateBlocks: number, actualMin: number): number | null {
  const estMin = blocksToMin(estimateBlocks);
  if (estMin <= 0) return null;
  return actualMin / estMin;
}

/** Human label for which review in the sequence a step represents (1-based). */
export function reviewLabel(step: number): string {
  if (step >= RECALL_SEQUENCE.length) return "Mastered";
  return `Review ${step + 1} of ${RECALL_SEQUENCE.length}`;
}
