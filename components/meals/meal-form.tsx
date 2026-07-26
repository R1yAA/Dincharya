"use client";

import { useState, useEffect, useMemo } from "react";
import { Sheet } from "@/components/ui/sheet";
import { Input, Textarea } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Chip } from "@/components/ui/chip";
import { FeltPicker } from "@/components/shared/felt-picker";
import { FoodForm } from "@/components/nutrition/food-form";
import { FoodPicker } from "@/components/nutrition/food-picker";
import { useFoods } from "@/hooks/use-foods";
import { useNutrients } from "@/hooks/use-nutrients";
import { profileMap, fmtAmount } from "@/lib/nutrition";
import {
  MEAL_SLOTS,
  MEAL_SOURCES,
  MEAL_HEALTH_RATINGS,
  MEAL_TAGS,
} from "@/lib/categories/meals";
import { todayStr, currentTimeStr } from "@/lib/format";
import {
  Meal,
  MealItem,
  MealItemDraft,
  MealSource,
  MealHealthRating,
} from "@/lib/supabase/types";
import { Minus, Plus, X } from "lucide-react";

interface MealFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (meal: Partial<Meal> & { name: string }, items: MealItemDraft[]) => void;
  initial?: Meal | null;
  /** existing items when editing */
  initialItems?: MealItem[];
  /** prefill the date when adding from a calendar day */
  defaultDate?: string;
}

export function MealForm({
  open,
  onOpenChange,
  onSave,
  initial,
  initialItems,
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
  const [items, setItems] = useState<MealItemDraft[]>([]);
  const [foodFormOpen, setFoodFormOpen] = useState(false);
  const [newFoodName, setNewFoodName] = useState("");

  const { foods, foodNutrients, upsertFood } = useFoods();
  const { nutrients } = useNutrients();

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
      setItems(
        (initialItems || []).map((i) => ({
          food_id: i.food_id,
          quantity: i.quantity,
        }))
      );
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
      setItems([]);
    }
  }, [open, initial, initialItems, defaultDate]);

  const foodById = useMemo(() => new Map(foods.map((f) => [f.id, f])), [foods]);
  const profiles = useMemo(() => profileMap(foodNutrients), [foodNutrients]);

  // Live nutrient readout across all chosen items.
  const itemTotals = useMemo(() => {
    const totals = new Map<string, number>();
    for (const item of items) {
      const profile = profiles.get(item.food_id);
      if (!profile) continue;
      for (const [nid, amount] of profile) {
        totals.set(nid, (totals.get(nid) || 0) + amount * item.quantity);
      }
    }
    return nutrients
      .filter((n) => (totals.get(n.id) || 0) > 0)
      .map((n) => `${n.name} ${fmtAmount(totals.get(n.id)!)}${n.unit}`);
  }, [items, profiles, nutrients]);

  const addItem = (foodId: string) =>
    setItems((prev) =>
      prev.some((i) => i.food_id === foodId)
        ? prev.map((i) =>
            i.food_id === foodId ? { ...i, quantity: i.quantity + 1 } : i
          )
        : [...prev, { food_id: foodId, quantity: 1 }]
    );

  const stepQuantity = (foodId: string, delta: number) =>
    setItems((prev) =>
      prev.map((i) =>
        i.food_id === foodId
          ? { ...i, quantity: Math.min(20, Math.max(0.5, i.quantity + delta)) }
          : i
      )
    );

  const toggleTag = (tag: string) =>
    setTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    onSave(
      {
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
      },
      items
    );
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

        <div className="flex flex-col gap-2">
          <label className="text-sm text-fg-muted">Foods (for nutrition)</label>
          {items.length > 0 && (
            <div className="flex flex-col rounded-xl border border-line overflow-hidden">
              {items.map((item) => {
                const food = foodById.get(item.food_id);
                return (
                  <div
                    key={item.food_id}
                    className="flex items-center gap-2 px-3 py-2 border-b border-line last:border-0"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="text-sm text-fg truncate">
                        {food?.name || "?"}
                      </div>
                      {food?.serving_label && (
                        <div className="text-xs text-fg-dim truncate">
                          {food.serving_label}
                        </div>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => stepQuantity(item.food_id, -0.5)}
                      className="w-7 h-7 rounded-full bg-elevated text-fg flex items-center justify-center hover:bg-line"
                    >
                      <Minus size={14} />
                    </button>
                    <span className="w-9 text-center text-sm text-fg font-medium">
                      ×{item.quantity}
                    </span>
                    <button
                      type="button"
                      onClick={() => stepQuantity(item.food_id, 0.5)}
                      className="w-7 h-7 rounded-full bg-elevated text-fg flex items-center justify-center hover:bg-line"
                    >
                      <Plus size={14} />
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        setItems((p) =>
                          p.filter((i) => i.food_id !== item.food_id)
                        )
                      }
                      className="p-1.5 text-fg-dim hover:text-danger"
                    >
                      <X size={14} />
                    </button>
                  </div>
                );
              })}
            </div>
          )}
          {itemTotals.length > 0 && (
            <p className="text-xs text-fg-muted">= {itemTotals.join(" · ")}</p>
          )}
          <FoodPicker
            foods={foods}
            onPick={(f) => addItem(f.id)}
            onCreate={(text) => {
              setNewFoodName(text);
              setFoodFormOpen(true);
            }}
          />
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

      <FoodForm
        open={foodFormOpen}
        onOpenChange={setFoodFormOpen}
        nutrients={nutrients}
        defaultName={newFoodName}
        onSave={(food, amounts) => {
          upsertFood.mutate(
            { food, amounts },
            { onSuccess: (saved) => addItem(saved.id) }
          );
        }}
      />
    </Sheet>
  );
}
