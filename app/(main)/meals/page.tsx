"use client";

import { useState, useMemo } from "react";
import { PageHeader } from "@/components/layout/page-header";
import { Fab } from "@/components/layout/fab";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { PeriodBar } from "@/components/ui/period-bar";
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
import { PeriodView, periodRange, periodLabel } from "@/lib/period";

export default function MealsPage() {
  const [view, setView] = useState<PeriodView>("day");
  const [anchor, setAnchor] = useState(todayStr());

  const range = useMemo(() => periodRange(view, anchor), [view, anchor]);
  const { meals: rangeMeals } = useMealsRange(range.from, range.to);
  const { upsert, remove } = useMeals(anchor);
  const {
    supplements,
    logs,
    upsert: upsertSupp,
    setStatus,
    clearStatus,
  } = useSupplements(anchor);
  const { toast } = useToast();

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Meal | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [suppFormOpen, setSuppFormOpen] = useState(false);
  const [editingSupp, setEditingSupp] = useState<Supplement | null>(null);

  // In day view the range is a single day, so rangeMeals IS that day's meals.
  const dayMeals = rangeMeals;

  const today = todayStr();
  const todayInRange = today >= range.from && today <= range.to;
  const formDefaultDate =
    view === "day" ? anchor : todayInRange ? today : range.from;

  const summary = useMemo(() => {
    const dates = new Set<string>();
    const sugarDates = new Set<string>();
    let junk = 0;
    let outside = 0;
    for (const m of rangeMeals) {
      dates.add(m.date);
      if (m.processed_sugar) sugarDates.add(m.date);
      if (m.health_rating === "junk") junk++;
      if (m.source === "outside" || m.source === "packaged") outside++;
    }
    return {
      total: rangeMeals.length,
      daysLogged: dates.size,
      sugarDays: sugarDates.size,
      junk,
      outside,
    };
  }, [rangeMeals]);

  return (
    <>
      <PageHeader title="Meals" />

      <div className="px-4 py-4 flex flex-col gap-4">
        <PeriodBar
          view={view}
          anchor={anchor}
          onViewChange={setView}
          onAnchorChange={setAnchor}
        />

        {view === "day" ? (
          <>
            <Card>
              <div className="flex items-center justify-between mb-2">
                <span className="text-fg-muted text-sm">
                  {groupLabel(anchor)}
                </span>
                <span className="text-fg font-medium">
                  {dayMeals.length} meal{dayMeals.length !== 1 ? "s" : ""}
                </span>
              </div>
              <MealMixBar meals={dayMeals} />
            </Card>

            <SupplementSection
              date={anchor}
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
          </>
        ) : (
          <>
            <Card>
              <div className="flex items-center justify-between mb-3">
                <span className="text-fg-muted text-sm">
                  {periodLabel(view, anchor)}
                </span>
                <span className="text-fg font-medium">
                  {summary.total} meal{summary.total !== 1 ? "s" : ""}
                </span>
              </div>
              <MealMixBar meals={rangeMeals} />
              <div className="grid grid-cols-3 gap-2 mt-3 text-center">
                <Stat label="Days logged" value={summary.daysLogged} />
                <Stat label="Junk" value={summary.junk} tone="danger" />
                <Stat label="Outside" value={summary.outside} tone="muted" />
                <Stat label="Sugar days" value={summary.sugarDays} tone="amber" />
                <Stat
                  label="Avg / day"
                  value={
                    summary.daysLogged
                      ? (summary.total / summary.daysLogged).toFixed(1)
                      : "0"
                  }
                />
              </div>
            </Card>

            <Card>
              <MealCalendar
                view={view}
                anchor={anchor}
                meals={rangeMeals}
                onSelectDate={(d) => {
                  setAnchor(d);
                  setView("day");
                }}
              />
              <p className="text-center text-xs text-fg-dim mt-2">
                Tap a day to see its meals
              </p>
            </Card>
          </>
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
        defaultDate={formDefaultDate}
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

function Stat({
  label,
  value,
  tone = "default",
}: {
  label: string;
  value: number | string;
  tone?: "default" | "danger" | "amber" | "muted";
}) {
  const color =
    tone === "danger"
      ? "text-danger"
      : tone === "amber"
        ? "text-amber"
        : tone === "muted"
          ? "text-fg-muted"
          : "text-fg";
  return (
    <div className="rounded-lg bg-elevated py-2">
      <div className={`text-lg font-semibold ${color}`}>{value}</div>
      <div className="text-[10px] text-fg-dim">{label}</div>
    </div>
  );
}
