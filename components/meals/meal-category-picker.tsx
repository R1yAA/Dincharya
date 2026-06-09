"use client";

import { MEAL_CATEGORIES, MealCategory } from "@/lib/categories/meals";
import { Chip } from "@/components/ui/chip";
import { useState } from "react";
import { Input } from "@/components/ui/input";

interface MealCategoryPickerProps {
  value: string;
  onChange: (id: string) => void;
  customCategories: MealCategory[];
  onAddCustom: (emoji: string, name: string) => string;
}

export function MealCategoryPicker({
  value,
  onChange,
  customCategories,
  onAddCustom,
}: MealCategoryPickerProps) {
  const [adding, setAdding] = useState(false);
  const [emoji, setEmoji] = useState("");
  const [name, setName] = useState("");

  const all = [...MEAL_CATEGORIES, ...customCategories];

  return (
    <div className="flex flex-col gap-2">
      <label className="text-sm text-fg-muted">Category</label>
      <div className="flex flex-wrap gap-2">
        {all.map((cat) => (
          <Chip
            key={cat.id}
            selected={value === cat.id}
            onClick={() => onChange(cat.id)}
          >
            {cat.emoji} {cat.name}
          </Chip>
        ))}
        {!adding && (
          <Chip variant="dashed" onClick={() => setAdding(true)}>
            + Add
          </Chip>
        )}
      </div>
      {adding && (
        <div className="flex gap-2 items-end mt-1">
          <Input
            placeholder="🍜"
            value={emoji}
            onChange={(e) => setEmoji(e.target.value)}
            className="w-14 text-center"
          />
          <Input
            placeholder="Category name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="flex-1"
          />
          <button
            type="button"
            onClick={() => {
              if (emoji && name) {
                const id = onAddCustom(emoji, name);
                onChange(id);
                setAdding(false);
                setEmoji("");
                setName("");
              }
            }}
            className="text-brand text-sm font-medium px-2 h-10"
          >
            Add
          </button>
          <button
            type="button"
            onClick={() => setAdding(false)}
            className="text-fg-dim text-sm px-2 h-10"
          >
            Cancel
          </button>
        </div>
      )}
    </div>
  );
}
