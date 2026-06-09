"use client";

import { useState } from "react";
import { PageHeader } from "@/components/layout/page-header";
import { Fab } from "@/components/layout/fab";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { MealForm } from "@/components/meals/meal-form";
import { MealListItem } from "@/components/meals/meal-list-item";
import { MealMixBar } from "@/components/meals/meal-mix-bar";
import { useMeals } from "@/hooks/use-meals";
import { useCustomCategories } from "@/hooks/use-custom-categories";
import { useToast } from "@/components/ui/toast";
import { Meal } from "@/lib/supabase/types";
import { groupLabel, todayStr } from "@/lib/format";

export default function MealsPage() {
  const { meals, upsert, remove } = useMeals();
  const { customCategories, addCategory } = useCustomCategories();
  const { toast } = useToast();
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Meal | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);

  const todayMeals = meals.filter((m) => m.date === todayStr());

  const grouped = meals.reduce<Record<string, Meal[]>>((acc, m) => {
    (acc[m.date] ||= []).push(m);
    return acc;
  }, {});

  return (
    <>
      <PageHeader title="Meals" />

      <div className="px-4 py-4 flex flex-col gap-4">
        <Card>
          <div className="flex items-center justify-between mb-2">
            <span className="text-fg-muted text-sm">Today</span>
            <span className="text-fg font-medium">
              {todayMeals.length} meal{todayMeals.length !== 1 ? "s" : ""}
            </span>
          </div>
          <MealMixBar meals={todayMeals} />
        </Card>

        {meals.length === 0 ? (
          <EmptyState
            emoji="🍽️"
            message="No meals logged yet. Tap + to add your first meal."
          />
        ) : (
          Object.entries(grouped).map(([date, items]) => (
            <div key={date}>
              <h3 className="text-xs font-medium text-fg-muted px-1 mb-1">
                {groupLabel(date)}
              </h3>
              <Card className="p-0 overflow-hidden">
                {items.map((meal) => (
                  <MealListItem
                    key={meal.id}
                    meal={meal}
                    customCategories={customCategories}
                    onEdit={() => {
                      setEditing(meal);
                      setFormOpen(true);
                    }}
                    onDelete={() => setDeleting(meal.id)}
                  />
                ))}
              </Card>
            </div>
          ))
        )}
      </div>

      <Fab
        onClick={() => {
          setEditing(null);
          setFormOpen(true);
        }}
      />

      <MealForm
        open={formOpen}
        onOpenChange={setFormOpen}
        initial={editing}
        customCategories={customCategories}
        onAddCustom={addCategory}
        onSave={(meal) => {
          upsert.mutate(meal, {
            onSuccess: () => toast(editing ? "Meal updated" : "Meal logged"),
          });
        }}
      />

      <ConfirmDialog
        open={!!deleting}
        onOpenChange={() => setDeleting(null)}
        title="Delete meal?"
        description="This meal entry will be permanently removed."
        confirmLabel="Delete"
        onConfirm={() => {
          if (deleting) {
            remove.mutate(deleting, {
              onSuccess: () => toast("Meal deleted"),
            });
          }
        }}
      />
    </>
  );
}
