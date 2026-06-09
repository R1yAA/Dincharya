"use client";

import { useState, useEffect } from "react";
import { Sheet } from "@/components/ui/sheet";
import { Input, Textarea } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Chip } from "@/components/ui/chip";
import { MealCategoryPicker } from "./meal-category-picker";
import { FeltPicker } from "@/components/shared/felt-picker";
import { MEAL_SLOTS } from "@/lib/categories/meals";
import { todayStr, currentTimeStr } from "@/lib/format";
import { Meal } from "@/lib/supabase/types";
import { MealCategory } from "@/lib/categories/meals";

interface MealFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (meal: Partial<Meal> & { name: string }) => void;
  initial?: Meal | null;
  customCategories: MealCategory[];
  onAddCustom: (emoji: string, name: string) => string;
}

export function MealForm({
  open,
  onOpenChange,
  onSave,
  initial,
  customCategories,
  onAddCustom,
}: MealFormProps) {
  const [name, setName] = useState("");
  const [category, setCategory] = useState("other-meal");
  const [slot, setSlot] = useState<string | null>(null);
  const [felt, setFelt] = useState<string | null>(null);
  const [date, setDate] = useState(todayStr());
  const [time, setTime] = useState(currentTimeStr());
  const [note, setNote] = useState("");
  const [showAdvanced, setShowAdvanced] = useState(false);

  useEffect(() => {
    if (open && initial) {
      setName(initial.name);
      setCategory(initial.category);
      setSlot(initial.slot);
      setFelt(initial.felt);
      setDate(initial.date);
      setTime(initial.time || currentTimeStr());
      setNote(initial.note || "");
    } else if (open) {
      setName("");
      setCategory("other-meal");
      setSlot(null);
      setFelt(null);
      setDate(todayStr());
      setTime(currentTimeStr());
      setNote("");
      setShowAdvanced(false);
    }
  }, [open, initial]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    onSave({
      ...(initial?.id ? { id: initial.id } : {}),
      name: name.trim(),
      category,
      slot,
      felt,
      date,
      time: time || null,
      note: note || null,
    });
    onOpenChange(false);
  };

  return (
    <Sheet
      open={open}
      onOpenChange={onOpenChange}
      title={initial ? "Edit meal" : "Log a meal"}
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <Input
          id="meal-name"
          label="What did you eat?"
          placeholder="e.g. Dal rice, Pizza, Chai..."
          value={name}
          onChange={(e) => setName(e.target.value)}
          autoFocus
        />

        <MealCategoryPicker
          value={category}
          onChange={setCategory}
          customCategories={customCategories}
          onAddCustom={onAddCustom}
        />

        <div className="flex flex-col gap-2">
          <label className="text-sm text-fg-muted">Meal slot</label>
          <div className="flex flex-wrap gap-2">
            {MEAL_SLOTS.map((s) => (
              <Chip
                key={s}
                selected={slot === s}
                onClick={() => setSlot(slot === s ? null : s)}
              >
                {s.charAt(0).toUpperCase() + s.slice(1)}
              </Chip>
            ))}
          </div>
        </div>

        <div className="flex gap-3">
          <Input
            id="meal-date"
            label="Date"
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="flex-1"
          />
          <Input
            id="meal-time"
            label="Time"
            type="time"
            value={time}
            onChange={(e) => setTime(e.target.value)}
            className="flex-1"
          />
        </div>

        <button
          type="button"
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="text-sm text-fg-dim text-left"
        >
          {showAdvanced ? "Hide" : "Show"} more options
        </button>

        {showAdvanced && (
          <>
            <FeltPicker value={felt} onChange={setFelt} />
            <Textarea
              id="meal-note"
              label="Note"
              placeholder="Anything else..."
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />
          </>
        )}

        <Button type="submit" disabled={!name.trim()}>
          {initial ? "Update" : "Save"}
        </Button>
      </form>
    </Sheet>
  );
}
