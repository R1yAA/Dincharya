"use client";

import { useState } from "react";
import { PageHeader } from "@/components/layout/page-header";
import { Fab } from "@/components/layout/fab";
import { Card } from "@/components/ui/card";
import { Chip } from "@/components/ui/chip";
import { EmptyState } from "@/components/ui/empty-state";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { DateStepper } from "@/components/layout/date-stepper";
import { MealForm } from "@/components/meals/meal-form";
import { MealListItem } from "@/components/meals/meal-list-item";
import { MealMixBar } from "@/components/meals/meal-mix-bar";
import { MealCalendar } from "@/components/meals/meal-calendar";
import { SupplementForm } from "@/components/meals/supplement-form";
import { SupplementSection } from "@/components/meals/supplement-section";
import { useMeals, useMealsRange } from "@/hooks/use-meals";
import { useSupplements } from "@/hooks/use-supplements";
import { useToast } from "@/components/ui/toast";
import { Meal, Supplement } from "@/lib/supabase/types";
import { groupLabel, todayStr } from "@/lib/format";
import { weekDates, monthMatrix } from "@/lib/calendar";

type View = "day" | "week" | "month";

export default function MealsPage() {
  const [view, setView] = useState<View>("day");
  const [selectedDate, setSelectedDate] = useState(todayStr());
  const [cursor, setCursor] = useState(todayStr());

  // Visible range for the calendar grid (week/month only).
  let rangeFrom = "";
  let rangeTo = "";
  if (view === "week") {
    const w = weekDates(cursor);
    rangeFrom = w[0];
    rangeTo = w[6];
  } else if (view === "month") {
    const grid = monthMatrix(cursor);
    rangeFrom = grid[0][0].date;
    const lastWeek = grid[grid.length - 1];
    rangeTo = lastWeek[lastWeek.length - 1].date;
  }

  const { meals: dayMeals, upsert, remove } = useMeals(selectedDate);
  const { meals: rangeMeals } = useMealsRange(rangeFrom, rangeTo);
  const {
    supplements,
    logs,
    upsert: upsertSupp,
    setStatus,
    clearStatus,
  } = useSupplements(selectedDate);
  const { toast } = useToast();

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Meal | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [suppFormOpen, setSuppFormOpen] = useState(false);
  const [editingSupp, setEditingSupp] = useState<Supplement | null>(null);

  return (
    <>
      <PageHeader title="Meals" />

      <div className="px-4 py-4 flex flex-col gap-4">
        <div className="flex gap-2 self-center">
          {(["day", "week", "month"] as View[]).map((v) => (
            <Chip key={v} selected={view === v} onClick={() => setView(v)}>
              {v.charAt(0).toUpperCase() + v.slice(1)}
            </Chip>
          ))}
        </div>

        {view === "day" ? (
          <DateStepper date={selectedDate} onChange={setSelectedDate} />
        ) : (
          <Card>
            <MealCalendar
              view={view}
              cursor={cursor}
              selectedDate={selectedDate}
              meals={rangeMeals}
              onSelectDate={(d) => {
                setSelectedDate(d);
                setView("day");
              }}
              onChangeCursor={setCursor}
            />
          </Card>
        )}

        <Card>
          <div className="flex items-center justify-between mb-2">
            <span className="text-fg-muted text-sm">{groupLabel(selectedDate)}</span>
            <span className="text-fg font-medium">
              {dayMeals.length} meal{dayMeals.length !== 1 ? "s" : ""}
            </span>
          </div>
          <MealMixBar meals={dayMeals} />
        </Card>

        <SupplementSection
          date={selectedDate}
          supplements={supplements}
          logs={logs}
          onSetStatus={(p) => setStatus.mutate(p)}
          onClear={(p) => clearStatus.mutate(p)}
          onEdit={(s) => {
            setEditingSupp(s);
            setSuppFormOpen(true);
          }}
          onAdd={() => {
            setEditingSupp(null);
            setSuppFormOpen(true);
          }}
        />

        {dayMeals.length === 0 ? (
          <EmptyState
            emoji="🍽️"
            message="No meals logged for this day. Tap + to add one."
          />
        ) : (
          <Card className="p-0 overflow-hidden">
            {dayMeals.map((meal) => (
              <MealListItem
                key={meal.id}
                meal={meal}
                onEdit={() => {
                  setEditing(meal);
                  setFormOpen(true);
                }}
                onDelete={() => setDeleting(meal.id)}
              />
            ))}
          </Card>
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
        defaultDate={selectedDate}
        onSave={(meal) => {
          upsert.mutate(meal, {
            onSuccess: () => toast(editing ? "Meal updated" : "Meal logged"),
          });
        }}
      />

      <SupplementForm
        open={suppFormOpen}
        onOpenChange={setSuppFormOpen}
        initial={editingSupp}
        onSave={(s) => {
          upsertSupp.mutate(s, {
            onSuccess: () =>
              toast(editingSupp ? "Supplement updated" : "Supplement added"),
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
