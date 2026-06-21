"use client";

import { Meal, MealHealthRating } from "@/lib/supabase/types";
import { cn } from "@/lib/utils";

const RATING_META: { id: MealHealthRating | "unset"; label: string; color: string }[] = [
  { id: "healthy", label: "Healthy", color: "bg-success" },
  { id: "okay", label: "Okay", color: "bg-amber" },
  { id: "junk", label: "Junk", color: "bg-danger" },
  { id: "unset", label: "Untagged", color: "bg-fg-dim" },
];

/** At-a-glance "how clean were my meals" composition for a set of meals. */
export function MealMixBar({ meals }: { meals: Meal[] }) {
  if (meals.length === 0) return null;

  const counts: Record<string, number> = {};
  meals.forEach((m) => {
    const key = m.health_rating ?? "unset";
    counts[key] = (counts[key] || 0) + 1;
  });
  const total = meals.length;

  return (
    <div className="flex h-2 rounded-full overflow-hidden bg-elevated">
      {RATING_META.filter((r) => counts[r.id]).map((r) => (
        <div
          key={r.id}
          className={cn("h-full", r.color)}
          style={{ width: `${(counts[r.id] / total) * 100}%` }}
          title={`${r.label}: ${counts[r.id]}`}
        />
      ))}
    </div>
  );
}
