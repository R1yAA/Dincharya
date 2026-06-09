import { addDays } from "./format";

export const REVIEW_INTERVALS = [1, 3, 7, 14, 30, 60, 90] as const;

export function generateReviewDates(studyDate: string): { interval_days: number; due_date: string }[] {
  return REVIEW_INTERVALS.map((interval) => ({
    interval_days: interval,
    due_date: addDays(studyDate, interval),
  }));
}
