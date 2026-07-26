"use client";

import { useMemo } from "react";
import { Card } from "@/components/ui/card";
import {
  FoodNutrient,
  Nutrient,
  Supplement,
  SupplementLog,
} from "@/lib/supabase/types";
import {
  DatedMealItem,
  dailyTotals,
  fmtAmount,
  goalProgress,
  profileMap,
} from "@/lib/nutrition";
import { cn } from "@/lib/utils";

interface NutritionSummaryProps {
  date: string;
  items: DatedMealItem[];
  supplements: Supplement[];
  logs: SupplementLog[];
  foodNutrients: FoodNutrient[];
  nutrients: Nutrient[];
}

/** Day totals vs daily goals for every tracked nutrient. */
export function NutritionSummary({
  date,
  items,
  supplements,
  logs,
  foodNutrients,
  nutrients,
}: NutritionSummaryProps) {
  const rows = useMemo(() => {
    const totals = dailyTotals({
      items: items.filter((i) => i.date === date),
      supplements,
      logs: logs.filter((l) => l.date === date),
      profiles: profileMap(foodNutrients),
    });
    return goalProgress(totals.get(date), nutrients).filter(
      (r) => r.goal !== null || r.total > 0
    );
  }, [date, items, supplements, logs, foodNutrients, nutrients]);

  if (nutrients.length === 0 || rows.length === 0) return null;

  return (
    <Card>
      <h3 className="text-xs font-medium text-fg-muted mb-2">Nutrition</h3>
      <div className="flex flex-col gap-2.5">
        {rows.map(({ nutrient, total, goal, pct }) => (
          <div key={nutrient.id}>
            <div className="flex items-baseline justify-between mb-1">
              <span className="text-sm text-fg">{nutrient.name}</span>
              <span className="text-xs text-fg-muted">
                {fmtAmount(total)}
                {goal !== null && ` / ${fmtAmount(goal)}`} {nutrient.unit}
              </span>
            </div>
            {pct !== null && (
              <div className="h-1.5 rounded-full bg-elevated overflow-hidden">
                <div
                  className={cn(
                    "h-full rounded-full transition-all",
                    pct >= 1 ? "bg-success" : "bg-brand"
                  )}
                  style={{ width: `${Math.min(100, pct * 100)}%` }}
                />
              </div>
            )}
          </div>
        ))}
      </div>
    </Card>
  );
}
