"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Chip } from "@/components/ui/chip";
import { Food } from "@/lib/supabase/types";
import { Plus } from "lucide-react";

interface FoodPickerProps {
  foods: Food[];
  onPick: (food: Food) => void;
  /** free text matched no food — open a create flow prefilled with it */
  onCreate: (name: string) => void;
  label?: string;
  placeholder?: string;
}

/** Free-text food search with chip suggestions from the saved library. */
export function FoodPicker({
  foods,
  onPick,
  onCreate,
  label,
  placeholder = "Search or add a food...",
}: FoodPickerProps) {
  const [text, setText] = useState("");
  const query = text.trim().toLowerCase();

  const suggestions = foods
    .filter((f) => !f.archived)
    .filter((f) => query === "" || f.name.toLowerCase().includes(query))
    .slice(0, 6);

  const exactMatch = foods.some(
    (f) => !f.archived && f.name.toLowerCase() === query
  );

  return (
    <div className="flex flex-col gap-2">
      <Input
        id="food-picker"
        label={label}
        placeholder={placeholder}
        value={text}
        onChange={(e) => setText(e.target.value)}
      />
      <div className="flex flex-wrap gap-1.5">
        {suggestions.map((f) => (
          <Chip
            key={f.id}
            onClick={() => {
              onPick(f);
              setText("");
            }}
          >
            {f.name}
          </Chip>
        ))}
        {query !== "" && !exactMatch && (
          <Chip
            variant="dashed"
            onClick={() => {
              onCreate(text.trim());
              setText("");
            }}
          >
            <Plus size={13} /> Create &ldquo;{text.trim()}&rdquo;
          </Chip>
        )}
      </div>
    </div>
  );
}
