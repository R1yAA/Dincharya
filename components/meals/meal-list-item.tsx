"use client";

import { Meal } from "@/lib/supabase/types";
import { categoryById, MealCategory, FELT_OPTIONS } from "@/lib/categories/meals";
import { formatTime } from "@/lib/format";
import { Trash2 } from "lucide-react";

interface MealListItemProps {
  meal: Meal;
  customCategories: MealCategory[];
  onEdit: () => void;
  onDelete: () => void;
}

export function MealListItem({ meal, customCategories, onEdit, onDelete }: MealListItemProps) {
  const cat = categoryById(meal.category, customCategories);
  const felt = FELT_OPTIONS.find((f) => f.id === meal.felt);

  return (
    <div
      className="flex items-center gap-3 px-4 py-3 border-b border-line last:border-0 active:bg-elevated transition-colors cursor-pointer"
      onClick={onEdit}
    >
      <span className="text-xl">{cat.emoji}</span>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-fg text-sm font-medium truncate">{meal.name}</span>
          {felt && <span className="text-xs">{felt.emoji}</span>}
        </div>
        <div className="flex items-center gap-2 text-xs text-fg-muted">
          {meal.time && <span>{formatTime(meal.time)}</span>}
          <span>{cat.name}</span>
          {meal.slot && (
            <span className="text-fg-dim">· {meal.slot}</span>
          )}
        </div>
      </div>
      <button
        onClick={(e) => { e.stopPropagation(); onDelete(); }}
        className="p-2 text-fg-dim hover:text-danger transition-colors"
      >
        <Trash2 size={16} />
      </button>
    </div>
  );
}
