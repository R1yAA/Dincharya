"use client";

import { useState, useMemo } from "react";
import { Plus, UtensilsCrossed, Moon, Activity, Heart, Scissors, BookOpen } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { DateStepper } from "@/components/layout/date-stepper";
import { Card } from "@/components/ui/card";
import { Chip } from "@/components/ui/chip";
import { EmptyState } from "@/components/ui/empty-state";
import { RatingDisplay } from "@/components/ui/rating-dots";
import { MealForm } from "@/components/meals/meal-form";
import { SleepForm } from "@/components/sleep/sleep-form";
import { BodyCheckinForm } from "@/components/body/body-checkin-form";
import { CycleDayForm } from "@/components/cycle/cycle-day-form";
import { HairForm } from "@/components/hair/hair-form";
import { StudyForm } from "@/components/study/study-form";
import { useMeals } from "@/hooks/use-meals";
import { useBody } from "@/hooks/use-body";
import { useSleep } from "@/hooks/use-sleep";
import { useCycle } from "@/hooks/use-cycle";
import { useHair } from "@/hooks/use-hair";
import { useStudy } from "@/hooks/use-study";
import { useRecall } from "@/hooks/use-recall";
import { useSettings } from "@/hooks/use-settings";
import { useCustomCategories } from "@/hooks/use-custom-categories";
import { useToast } from "@/components/ui/toast";
import { categoryById } from "@/lib/categories/meals";
import { currentCycle } from "@/lib/cycle";
import { todayStr, formatTime } from "@/lib/format";
import Link from "next/link";

type QuickSheet = "meal" | "sleep" | "body" | "cycle" | "hair" | "study" | null;

export default function TodayPage() {
  const [date, setDate] = useState(todayStr());
  const { meals, upsert: upsertMeal } = useMeals(date);
  const { checkins, upsert: upsertBody } = useBody(date);
  const { logs: sleepLogs, upsert: upsertSleep } = useSleep(date);
  const { days: cycleDays, upsert: upsertCycle, remove: removeCycle } = useCycle();
  const { logs: hairLogs, upsert: upsertHair } = useHair(date);
  const { logs: studyLogs, upsert: upsertStudy, subjects } = useStudy(date);
  const { dueCount, completionPct, todayReviewed, createReminders } = useRecall();
  const { settings } = useSettings();
  const { customCategories, addCategory } = useCustomCategories();
  const { toast } = useToast();

  const [sheet, setSheet] = useState<QuickSheet>(null);
  const [fabOpen, setFabOpen] = useState(false);

  const bodyToday = checkins[0] || null;
  const sleepToday = sleepLogs[0] || null;
  const hairToday = hairLogs[0] || null;
  const cycleExisting = cycleDays.find((d) => d.date === date) || null;

  const defaults = {
    cycleLen: settings?.default_cycle_len ?? 28,
    periodLen: settings?.default_period_len ?? 5,
  };

  const cycleStatus = useMemo(
    () => currentCycle(cycleDays, date, defaults),
    [cycleDays, date, defaults]
  );

  return (
    <>
      <PageHeader title="Dincharya" />
      <DateStepper date={date} onChange={setDate} />

      <div className="px-4 pb-4 flex flex-col gap-3">
        {/* Cycle ribbon */}
        {cycleStatus && (
          <Card className="border-cycle/30 py-3">
            <div className="flex items-center gap-2">
              <Heart size={16} className="text-cycle" />
              <span className="text-sm text-cycle font-medium">
                Day {cycleStatus.cycleDay} · {cycleStatus.phase}
              </span>
              {cycleStatus.daysUntilNext > 0 && (
                <span className="text-xs text-fg-muted ml-auto">
                  period in ~{cycleStatus.daysUntilNext}d
                </span>
              )}
            </div>
          </Card>
        )}

        {/* Meals strip */}
        <Card>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-fg-muted flex items-center gap-1.5">
              <UtensilsCrossed size={14} /> Meals
            </span>
            <span className="text-xs text-fg-dim">{meals.length} logged</span>
          </div>
          {meals.length > 0 ? (
            <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
              {meals.map((m) => {
                const cat = categoryById(m.category, customCategories);
                return (
                  <Chip key={m.id} className="shrink-0" onClick={() => setSheet("meal")}>
                    {cat.emoji} {formatTime(m.time) || m.name}
                  </Chip>
                );
              })}
              <Chip variant="dashed" onClick={() => setSheet("meal")}>
                + meal
              </Chip>
            </div>
          ) : (
            <button
              onClick={() => setSheet("meal")}
              className="text-sm text-brand"
            >
              + Log a meal
            </button>
          )}
        </Card>

        {/* Sleep card */}
        <Card>
          <div className="flex items-center justify-between">
            <span className="text-sm text-fg-muted flex items-center gap-1.5">
              <Moon size={14} className="text-accent2" /> Sleep
            </span>
            {sleepToday ? (
              <div className="flex items-center gap-2">
                <span className="text-fg font-medium text-sm">
                  {sleepToday.hours?.toFixed(1)}h
                </span>
                {sleepToday.quality && (
                  <RatingDisplay value={sleepToday.quality} color="bg-accent2" />
                )}
              </div>
            ) : (
              <button
                onClick={() => setSheet("sleep")}
                className="text-sm text-brand"
              >
                Log last night&apos;s sleep
              </button>
            )}
          </div>
        </Card>

        {/* Body check-in card */}
        <Card>
          <div className="flex items-center justify-between">
            <span className="text-sm text-fg-muted flex items-center gap-1.5">
              <Activity size={14} /> Body
            </span>
            {bodyToday ? (
              <div className="flex items-center gap-3 text-sm">
                {bodyToday.weight_kg && (
                  <span className="text-fg">{bodyToday.weight_kg}kg</span>
                )}
                {bodyToday.energy && (
                  <RatingDisplay value={bodyToday.energy} color="bg-brand" />
                )}
              </div>
            ) : (
              <button
                onClick={() => setSheet("body")}
                className="text-sm text-brand"
              >
                Log check-in
              </button>
            )}
          </div>
        </Card>

        {/* Hair card */}
        {hairToday && (
          <Card>
            <div className="flex items-center justify-between">
              <span className="text-sm text-fg-muted flex items-center gap-1.5">
                <Scissors size={14} className="text-amber" /> Hair
              </span>
              <div className="flex items-center gap-2 text-sm">
                {hairToday.washed && (
                  <span className="text-accent2 text-xs">washed</span>
                )}
                {hairToday.condition && (
                  <RatingDisplay value={hairToday.condition} color="bg-amber" />
                )}
              </div>
            </div>
          </Card>
        )}

        {/* Study reviews due */}
        {(studyLogs.length > 0 || dueCount > 0) && (
          <Card>
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm text-fg-muted flex items-center gap-1.5">
                <BookOpen size={14} className="text-violet" /> Study
              </span>
              <div className="flex items-center gap-3">
                {studyLogs.length > 0 && (
                  <span className="text-xs text-fg-dim">
                    {studyLogs.length} session{studyLogs.length !== 1 ? "s" : ""}
                  </span>
                )}
                {dueCount > 0 ? (
                  <Link href="/study" className="text-sm text-brand">
                    {dueCount} to review →
                  </Link>
                ) : todayReviewed > 0 ? (
                  <span className="text-xs text-success">All done ✓</span>
                ) : null}
              </div>
            </div>
            {completionPct !== null && (
              <div className="h-1 rounded-full bg-elevated overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${completionPct === 100 ? "bg-success" : "bg-brand"}`}
                  style={{ width: `${completionPct}%` }}
                />
              </div>
            )}
          </Card>
        )}

        {/* Empty state when nothing logged */}
        {meals.length === 0 && !sleepToday && !bodyToday && !cycleStatus && (
          <EmptyState
            emoji="🌙"
            message="Nothing logged yet today. Start with a quick entry!"
          />
        )}
      </div>

      {/* FAB with quick-add menu */}
      <div className="fixed bottom-2 right-4 z-50 flex flex-col items-end gap-2">
        {fabOpen && (
          <div className="flex flex-col gap-2 mb-2 animate-in slide-in-from-bottom-2">
            {[
              { key: "meal", label: "Meal", icon: "🍽️" },
              { key: "sleep", label: "Sleep", icon: "😴" },
              { key: "body", label: "Body", icon: "💪" },
              { key: "cycle", label: "Cycle", icon: "🌸" },
              { key: "hair", label: "Hair", icon: "💇" },
              { key: "study", label: "Study", icon: "📚" },
            ].map((item) => (
              <button
                key={item.key}
                onClick={() => {
                  setSheet(item.key as QuickSheet);
                  setFabOpen(false);
                }}
                className="flex items-center gap-2 bg-surface border border-line rounded-full px-4 py-2 text-sm text-fg shadow-lg"
              >
                <span>{item.icon}</span> {item.label}
              </button>
            ))}
          </div>
        )}
        <button
          onClick={() => setFabOpen(!fabOpen)}
          className="w-12 h-12 rounded-full bg-brand text-bg shadow-lg flex items-center justify-center hover:bg-brand/90 active:scale-95 transition-transform"
        >
          <Plus size={22} className={fabOpen ? "rotate-45 transition-transform" : "transition-transform"} />
        </button>
      </div>

      {/* Sheets */}
      <MealForm
        open={sheet === "meal"}
        onOpenChange={(o) => !o && setSheet(null)}
        initial={null}
        customCategories={customCategories}
        onAddCustom={addCategory}
        onSave={(meal) => {
          upsertMeal.mutate({ ...meal, date }, { onSuccess: () => toast("Meal logged") });
        }}
      />
      <SleepForm
        open={sheet === "sleep"}
        onOpenChange={(o) => !o && setSheet(null)}
        initial={null}
        onSave={(data) => {
          upsertSleep.mutate(data, { onSuccess: () => toast("Sleep logged") });
        }}
      />
      <BodyCheckinForm
        open={sheet === "body"}
        onOpenChange={(o) => !o && setSheet(null)}
        initial={null}
        onSave={(data) => {
          upsertBody.mutate(data, { onSuccess: () => toast("Body check-in saved") });
        }}
      />
      <CycleDayForm
        open={sheet === "cycle"}
        onOpenChange={(o) => !o && setSheet(null)}
        date={date}
        existing={cycleExisting}
        onSave={(day) => {
          upsertCycle.mutate(day, { onSuccess: () => toast("Cycle day saved") });
        }}
        onRemove={(d) => {
          removeCycle.mutate(d, { onSuccess: () => toast("Day removed") });
        }}
      />
      <HairForm
        open={sheet === "hair"}
        onOpenChange={(o) => !o && setSheet(null)}
        initial={null}
        onSave={(data) => {
          upsertHair.mutate(data, { onSuccess: () => toast("Hair check-in saved") });
        }}
      />
      <StudyForm
        open={sheet === "study"}
        onOpenChange={(o) => !o && setSheet(null)}
        initial={null}
        subjects={subjects}
        onSave={(data) => {
          upsertStudy.mutate(data, {
            onSuccess: (result) => {
              toast("Study session logged");
              if (result) {
                const saved = result as import("@/lib/supabase/types").StudyLog;
                createReminders.mutate({
                  study_log_id: saved.id,
                  subject: saved.subject,
                  topic: saved.topic,
                  studyDate: saved.date,
                });
              }
            },
          });
        }}
      />
    </>
  );
}
