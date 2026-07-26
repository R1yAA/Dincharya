import { Bucket, bucketOf } from "./chart";
import {
  FoodNutrient,
  MealItem,
  Nutrient,
  Supplement,
  SupplementLog,
} from "./supabase/types";

/** A meal item joined with its meal's date. */
export type DatedMealItem = MealItem & { date: string };

/** food_id -> nutrient_id -> amount per 1 serving. */
export function profileMap(
  rows: FoodNutrient[]
): Map<string, Map<string, number>> {
  const map = new Map<string, Map<string, number>>();
  for (const r of rows) {
    let inner = map.get(r.food_id);
    if (!inner) {
      inner = new Map();
      map.set(r.food_id, inner);
    }
    inner.set(r.nutrient_id, r.amount);
  }
  return map;
}

function addFood(
  totals: Map<string, Map<string, number>>,
  profiles: Map<string, Map<string, number>>,
  date: string,
  foodId: string,
  quantity: number
) {
  const profile = profiles.get(foodId);
  if (!profile) return;
  let day = totals.get(date);
  if (!day) {
    day = new Map();
    totals.set(date, day);
  }
  for (const [nutrientId, amount] of profile) {
    day.set(nutrientId, (day.get(nutrientId) || 0) + amount * quantity);
  }
}

/**
 * date -> nutrient_id -> total consumed that day.
 * Meal items count amount x quantity on their meal's date; supplement logs with
 * status "taken" whose supplement links a food count food profile x quantity.
 */
export function dailyTotals(params: {
  items: DatedMealItem[];
  supplements: Supplement[];
  logs: SupplementLog[];
  profiles: Map<string, Map<string, number>>;
}): Map<string, Map<string, number>> {
  const { items, supplements, logs, profiles } = params;
  const totals = new Map<string, Map<string, number>>();
  for (const item of items) {
    addFood(totals, profiles, item.date, item.food_id, item.quantity);
  }
  const suppById = new Map(supplements.map((s) => [s.id, s]));
  for (const log of logs) {
    if (log.status !== "taken") continue;
    const supp = suppById.get(log.supplement_id);
    if (!supp?.food_id) continue;
    addFood(totals, profiles, log.date, supp.food_id, supp.quantity);
  }
  return totals;
}

export interface GoalProgress {
  nutrient: Nutrient;
  total: number;
  goal: number | null;
  /** 0..1+ of goal met; null when no goal set */
  pct: number | null;
}

/** Per-nutrient progress for a single day's totals. */
export function goalProgress(
  dayTotals: Map<string, number> | undefined,
  nutrients: Nutrient[]
): GoalProgress[] {
  return nutrients.map((n) => {
    const total = dayTotals?.get(n.id) || 0;
    return {
      nutrient: n,
      total,
      goal: n.daily_goal,
      pct: n.daily_goal ? total / n.daily_goal : null,
    };
  });
}

/**
 * Chart series for one nutrient: average per day-with-data in each bucket, so
 * weekly buckets stay comparable to a daily goal line. Days without any logged
 * nutrition don't drag the average down.
 */
export function nutrientBucketSeries(
  buckets: Bucket[],
  totals: Map<string, Map<string, number>>,
  nutrientId: string
): { label: string; value: number | null }[] {
  const sums = buckets.map(() => ({ sum: 0, days: 0 }));
  for (const [date, day] of totals) {
    const i = bucketOf(buckets, date);
    if (i < 0) continue;
    sums[i].sum += day.get(nutrientId) || 0;
    sums[i].days += 1;
  }
  return buckets.map((b, i) => ({
    label: b.label,
    value: sums[i].days > 0 ? sums[i].sum / sums[i].days : null,
  }));
}

/** Round to one decimal for display; drops trailing .0 via Number(). */
export function fmtAmount(n: number): string {
  return String(Math.round(n * 10) / 10);
}
