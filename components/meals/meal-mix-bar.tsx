"use client";

import { Meal } from "@/lib/supabase/types";
import { MEAL_CATEGORIES } from "@/lib/categories/meals";
import { cn } from "@/lib/utils";

const CATEGORY_COLORS: Record<string, string> = {
  "home-healthy": "bg-success",
  "home-snack": "bg-amber",
  "home-quick": "bg-brand",
  "out-healthy": "bg-accent2",
  "out-snack": "bg-cycle",
  "out-quick": "bg-danger",
  "beverage": "bg-violet",
  "dessert": "bg-cycle",
  "other-meal": "bg-fg-dim",
};

export function MealMixBar({ meals }: { meals: Meal[] }) {
  if (meals.length === 0) return null;

  const counts: Record<string, number> = {};
  meals.forEach((m) => {
    counts[m.category] = (counts[m.category] || 0) + 1;
  });
  const total = meals.length;

  return (
    <div className="flex h-2 rounded-full overflow-hidden bg-elevated">
      {Object.entries(counts).map(([cat, count]) => (
        <div
          key={cat}
          className={cn("h-full", CATEGORY_COLORS[cat] || "bg-fg-dim")}
          style={{ width: `${(count / total) * 100}%` }}
          title={`${MEAL_CATEGORIES.find((c) => c.id === cat)?.name || cat}: ${count}`}
        />
      ))}
    </div>
  );
}
