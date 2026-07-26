"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Sheet } from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Food, FoodNutrient, Nutrient } from "@/lib/supabase/types";
import { FoodAmount } from "@/hooks/use-foods";

interface FoodFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  nutrients: Nutrient[];
  onSave: (food: Partial<Food> & { name: string }, amounts: FoodAmount[]) => void;
  initial?: Food | null;
  /** existing profile rows when editing */
  initialAmounts?: FoodNutrient[];
  /** prefill the name when creating from a picker's free text */
  defaultName?: string;
}

export function FoodForm({
  open,
  onOpenChange,
  nutrients,
  onSave,
  initial,
  initialAmounts,
  defaultName,
}: FoodFormProps) {
  const [name, setName] = useState("");
  const [serving, setServing] = useState("");
  const [amounts, setAmounts] = useState<Record<string, string>>({});

  useEffect(() => {
    if (open && initial) {
      setName(initial.name);
      setServing(initial.serving_label || "");
      const map: Record<string, string> = {};
      for (const a of initialAmounts || []) {
        if (a.food_id === initial.id) map[a.nutrient_id] = String(a.amount);
      }
      setAmounts(map);
    } else if (open) {
      setName(defaultName || "");
      setServing("");
      setAmounts({});
    }
  }, [open, initial, initialAmounts, defaultName]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    const rows: FoodAmount[] = [];
    for (const n of nutrients) {
      const raw = amounts[n.id];
      if (raw === undefined || raw === "") continue;
      const parsed = parseFloat(raw);
      if (isNaN(parsed) || parsed < 0) continue;
      rows.push({ nutrient_id: n.id, amount: parsed });
    }
    onSave(
      {
        ...(initial?.id ? { id: initial.id } : {}),
        name: name.trim(),
        serving_label: serving.trim() || null,
      },
      rows
    );
    onOpenChange(false);
  };

  return (
    <Sheet
      open={open}
      onOpenChange={onOpenChange}
      title={initial ? "Edit food" : "New food"}
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <Input
          id="food-name"
          label="Name"
          placeholder="e.g. Protein shake, Dal, Roti..."
          value={name}
          onChange={(e) => setName(e.target.value)}
          autoFocus
        />

        <Input
          id="food-serving"
          label="Serving (optional)"
          placeholder="e.g. 1 glass, 1 scoop (30g), 1 piece"
          value={serving}
          onChange={(e) => setServing(e.target.value)}
        />

        <div className="flex flex-col gap-2">
          <label className="text-sm text-fg-muted">
            Profile per serving — leave blank what you don&apos;t know
          </label>
          {nutrients.length === 0 ? (
            <p className="text-xs text-fg-dim">
              No nutrients defined yet. Add them in{" "}
              <Link href="/settings" className="text-brand underline">
                Settings
              </Link>{" "}
              first.
            </p>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              {nutrients.map((n) => (
                <Input
                  key={n.id}
                  id={`food-amount-${n.id}`}
                  label={`${n.name} (${n.unit})`}
                  type="number"
                  step="any"
                  min="0"
                  placeholder="—"
                  value={amounts[n.id] || ""}
                  onChange={(e) =>
                    setAmounts((p) => ({ ...p, [n.id]: e.target.value }))
                  }
                />
              ))}
            </div>
          )}
        </div>

        <Button type="submit" disabled={!name.trim()}>
          {initial ? "Update" : "Save to library"}
        </Button>
      </form>
    </Sheet>
  );
}
