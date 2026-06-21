"use client";

import { useState, useEffect } from "react";
import { Sheet } from "@/components/ui/sheet";
import { Input, Textarea } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Chip } from "@/components/ui/chip";
import { FeltPicker } from "@/components/shared/felt-picker";
import {
  MEAL_SLOTS,
  MEAL_SOURCES,
  MEAL_HEALTH_RATINGS,
  MEAL_TAGS,
} from "@/lib/categories/meals";
import { todayStr, currentTimeStr } from "@/lib/format";
import { Meal, MealSource, MealHealthRating } from "@/lib/supabase/types";

interface MealFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (meal: Partial<Meal> & { name: string }) => void;
  initial?: Meal | null;
  /** prefill the date when adding from a calendar day */
  defaultDate?: string;
}

export function MealForm({
  open,
  onOpenChange,
  onSave,
  initial,
  defaultDate,
}: MealFormProps) {
  const [name, setName] = useState("");
  const [source, setSource] = useState<MealSource | null>(null);
  const [healthRating, setHealthRating] = useState<MealHealthRating | null>(null);
  const [processedSugar, setProcessedSugar] = useState(false);
  const [tags, setTags] = useState<string[]>([]);
  const [slot, setSlot] = useState<string | null>(null);
  const [felt, setFelt] = useState<string | null>(null);
  const [date, setDate] = useState(todayStr());
  const [time, setTime] = useState(currentTimeStr());
  const [note, setNote] = useState("");
  const [showAdvanced, setShowAdvanced] = useState(false);

  useEffect(() => {
    if (open && initial) {
      setName(initial.name);
      setSource(initial.source);
      setHealthRating(initial.health_rating);
      setProcessedSugar(initial.processed_sugar);
      setTags(initial.tags || []);
      setSlot(initial.slot);
      setFelt(initial.felt);
      setDate(initial.date);
      setTime(initial.time || currentTimeStr());
      setNote(initial.note || "");
    } else if (open) {
      setName("");
      setSource(null);
      setHealthRating(null);
      setProcessedSugar(false);
      setTags([]);
      setSlot(null);
      setFelt(null);
      setDate(defaultDate || todayStr());
      setTime(currentTimeStr());
      setNote("");
      setShowAdvanced(false);
    }
  }, [open, initial, defaultDate]);

  const toggleTag = (tag: string) =>
    setTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    onSave({
      ...(initial?.id ? { id: initial.id } : {}),
      name: name.trim(),
      source,
      health_rating: healthRating,
      processed_sugar: processedSugar,
      tags,
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

        <div className="flex flex-col gap-2">
          <label className="text-sm text-fg-muted">Where from?</label>
          <div className="flex flex-wrap gap-2">
            {MEAL_SOURCES.map((s) => (
              <Chip
                key={s.id}
                selected={source === s.id}
                onClick={() => setSource(source === s.id ? null : s.id)}
              >
                {s.emoji} {s.label}
              </Chip>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-sm text-fg-muted">How clean was it?</label>
          <div className="flex flex-wrap gap-2">
            {MEAL_HEALTH_RATINGS.map((h) => (
              <Chip
                key={h.id}
                selected={healthRating === h.id}
                onClick={() =>
                  setHealthRating(healthRating === h.id ? null : h.id)
                }
              >
                {h.emoji} {h.label}
              </Chip>
            ))}
            <Chip
              selected={processedSugar}
              onClick={() => setProcessedSugar(!processedSugar)}
            >
              🍬 Processed sugar
            </Chip>
          </div>
        </div>

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
            <div className="flex flex-col gap-2">
              <label className="text-sm text-fg-muted">Tags</label>
              <div className="flex flex-wrap gap-2">
                {MEAL_TAGS.map((tag) => (
                  <Chip
                    key={tag}
                    selected={tags.includes(tag)}
                    onClick={() => toggleTag(tag)}
                  >
                    {tag}
                  </Chip>
                ))}
              </div>
            </div>
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
