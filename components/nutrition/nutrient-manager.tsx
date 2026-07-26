"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { useNutrients } from "@/hooks/use-nutrients";
import { useToast } from "@/components/ui/toast";
import { Nutrient } from "@/lib/supabase/types";
import { Trash2 } from "lucide-react";

function NutrientRow({
  nutrient,
  onDelete,
}: {
  nutrient: Nutrient;
  onDelete: () => void;
}) {
  const { upsert } = useNutrients();
  const { toast } = useToast();
  const [unit, setUnit] = useState(nutrient.unit);
  const [goal, setGoal] = useState(nutrient.daily_goal?.toString() || "");

  const dirty =
    unit !== nutrient.unit || goal !== (nutrient.daily_goal?.toString() || "");

  const save = () => {
    upsert.mutate(
      {
        id: nutrient.id,
        name: nutrient.name,
        unit: unit.trim() || "g",
        daily_goal: goal ? parseFloat(goal) || null : null,
      },
      { onSuccess: () => toast("Nutrient updated") }
    );
  };

  return (
    <div className="flex items-end gap-2">
      <span className="flex-1 text-sm text-fg pb-2.5">{nutrient.name}</span>
      <Input
        id={`nutrient-unit-${nutrient.id}`}
        label="Unit"
        value={unit}
        onChange={(e) => setUnit(e.target.value)}
        className="w-16"
      />
      <Input
        id={`nutrient-goal-${nutrient.id}`}
        label="Daily goal"
        type="number"
        placeholder="—"
        value={goal}
        onChange={(e) => setGoal(e.target.value)}
        className="w-24"
      />
      {dirty ? (
        <Button size="sm" onClick={save}>
          Save
        </Button>
      ) : (
        <button
          type="button"
          onClick={onDelete}
          className="p-2.5 text-fg-dim hover:text-danger"
          aria-label={`Delete ${nutrient.name}`}
        >
          <Trash2 size={16} />
        </button>
      )}
    </div>
  );
}

export function NutrientManager() {
  const { nutrients, upsert, remove } = useNutrients();
  const { toast } = useToast();
  const [newName, setNewName] = useState("");
  const [newUnit, setNewUnit] = useState("g");
  const [newGoal, setNewGoal] = useState("");
  const [deleting, setDeleting] = useState<Nutrient | null>(null);

  const add = () => {
    if (!newName.trim()) return;
    upsert.mutate(
      {
        name: newName.trim(),
        unit: newUnit.trim() || "g",
        daily_goal: newGoal ? parseFloat(newGoal) || null : null,
        sort_order: nutrients.length,
      },
      {
        onSuccess: () => {
          toast("Nutrient added");
          setNewName("");
          setNewUnit("g");
          setNewGoal("");
        },
      }
    );
  };

  return (
    <Card>
      <h3 className="text-sm font-medium text-fg mb-1">
        Nutrients &amp; daily goals
      </h3>
      <p className="text-xs text-fg-muted mb-3">
        What you track in food profiles — protein, carbs, sugar, anything.
      </p>

      <div className="flex flex-col gap-3">
        {nutrients.map((n) => (
          <NutrientRow key={n.id} nutrient={n} onDelete={() => setDeleting(n)} />
        ))}

        <div className="flex items-end gap-2 pt-2 border-t border-line">
          <Input
            id="nutrient-new-name"
            label="Add nutrient"
            placeholder="e.g. Protein"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            className="flex-1"
          />
          <Input
            id="nutrient-new-unit"
            label="Unit"
            value={newUnit}
            onChange={(e) => setNewUnit(e.target.value)}
            className="w-16"
          />
          <Input
            id="nutrient-new-goal"
            label="Daily goal"
            type="number"
            placeholder="—"
            value={newGoal}
            onChange={(e) => setNewGoal(e.target.value)}
            className="w-24"
          />
          <Button size="sm" onClick={add} disabled={!newName.trim()}>
            Add
          </Button>
        </div>
      </div>

      <ConfirmDialog
        open={!!deleting}
        onOpenChange={(o) => !o && setDeleting(null)}
        title={`Delete ${deleting?.name}?`}
        description="This also removes this nutrient from all saved foods and past totals."
        confirmLabel="Delete"
        onConfirm={() => {
          if (deleting)
            remove.mutate(deleting.id, {
              onSuccess: () => toast("Nutrient deleted"),
            });
        }}
      />
    </Card>
  );
}
