"use client";

import { Meal } from "@/lib/supabase/types";
import {
  MEAL_SOURCES,
  MEAL_HEALTH_RATINGS,
  FELT_OPTIONS,
} from "@/lib/categories/meals";
import { formatTime } from "@/lib/format";
import { Trash2 } from "lucide-react";

interface MealListItemProps {
  meal: Meal;
  onEdit: () => void;
  onDelete: () => void;
}

export function MealListItem({ meal, onEdit, onDelete }: MealListItemProps) {
  const source = MEAL_SOURCES.find((s) => s.id === meal.source);
  const health = MEAL_HEALTH_RATINGS.find((h) => h.id === meal.health_rating);
  const felt = FELT_OPTIONS.find((f) => f.id === meal.felt);

  return (
    <div
      className="flex items-center gap-3 px-4 py-3 border-b border-line last:border-0 active:bg-elevated transition-colors cursor-pointer"
      onClick={onEdit}
    >
      <span className="text-xl">{source?.emoji ?? health?.emoji ?? "🍽️"}</span>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-fg text-sm font-medium truncate">{meal.name}</span>
          {felt && <span className="text-xs">{felt.emoji}</span>}
          {meal.processed_sugar && <span className="text-xs">🍬</span>}
        </div>
        <div className="flex items-center gap-2 text-xs text-fg-muted flex-wrap">
          {meal.time && <span>{formatTime(meal.time)}</span>}
          {meal.slot && <span className="text-fg-dim">· {meal.slot}</span>}
          {source && <span className="text-fg-dim">· {source.label}</span>}
          {health && <span className="text-fg-dim">· {health.label}</span>}
          {meal.tags?.map((t) => (
            <span key={t} className="text-fg-dim">
              #{t}
            </span>
          ))}
        </div>
      </div>
      <button
        onClick={(e) => {
          e.stopPropagation();
          onDelete();
        }}
        className="p-2 text-fg-dim hover:text-danger transition-colors"
      >
        <Trash2 size={16} />
      </button>
    </div>
  );
}
