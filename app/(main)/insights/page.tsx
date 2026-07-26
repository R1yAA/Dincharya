"use client";

import { useState, useMemo } from "react";
import { PageHeader } from "@/components/layout/page-header";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { PeriodBar } from "@/components/ui/period-bar";
import {
  MealsChart,
  NutritionChart,
  SleepChart,
  StudyChart,
  BodyChart,
} from "@/components/insights/charts";
import { useMeals } from "@/hooks/use-meals";
import { useMealItemsRange } from "@/hooks/use-meal-items";
import { useFoods } from "@/hooks/use-foods";
import { useNutrients } from "@/hooks/use-nutrients";
import { useSupplements, useSupplementLogsRange } from "@/hooks/use-supplements";
import { useSleep } from "@/hooks/use-sleep";
import { useBody } from "@/hooks/use-body";
import { useCycle } from "@/hooks/use-cycle";
import { useHair } from "@/hooks/use-hair";
import { useStudySessions } from "@/hooks/use-study";
import { useStudyRecall } from "@/hooks/use-recall";
import { useSettings } from "@/hooks/use-settings";
import { buildInsights } from "@/lib/insights";
import { PeriodView, periodRange } from "@/lib/period";
import { buildBuckets } from "@/lib/chart";
import { todayStr, addDays } from "@/lib/format";
import { cn } from "@/lib/utils";

type Mode = "period" | "custom";

export default function InsightsPage() {
  const [mode, setMode] = useState<Mode>("period");
  const [view, setView] = useState<PeriodView>("week");
  const [anchor, setAnchor] = useState(todayStr());
  const [customFrom, setCustomFrom] = useState(addDays(todayStr(), -29));
  const [customTo, setCustomTo] = useState(todayStr());

  const range = useMemo(
    () =>
      mode === "custom"
        ? { from: customFrom, to: customTo }
        : periodRange(view, anchor),
    [mode, customFrom, customTo, view, anchor]
  );

  const { meals: allMeals } = useMeals();
  const { logs: allSleep } = useSleep();
  const { checkins: allBody } = useBody();
  const { days: allCycle } = useCycle();
  const { logs: allHair } = useHair();
  const { sessions } = useStudySessions(range.from, range.to);
  const { items: recall } = useStudyRecall();
  const { settings } = useSettings();
  const { nutrients } = useNutrients();
  const { foodNutrients } = useFoods();
  const { items: mealItems } = useMealItemsRange(range.from, range.to);
  const { supplements } = useSupplements();
  const { logs: suppLogs } = useSupplementLogsRange(range.from, range.to);

  const meals = useMemo(
    () => allMeals.filter((m) => m.date >= range.from && m.date <= range.to),
    [allMeals, range]
  );
  const sleep = useMemo(
    () => allSleep.filter((s) => s.date >= range.from && s.date <= range.to),
    [allSleep, range]
  );
  const body = useMemo(
    () => allBody.filter((b) => b.date >= range.from && b.date <= range.to),
    [allBody, range]
  );
  const cycle = useMemo(
    () => allCycle.filter((c) => c.date >= range.from && c.date <= range.to),
    [allCycle, range]
  );
  const hair = useMemo(
    () => allHair.filter((h) => h.date >= range.from && h.date <= range.to),
    [allHair, range]
  );

  const buckets = useMemo(() => buildBuckets(range.from, range.to), [range]);

  const cards = useMemo(
    () =>
      buildInsights({
        meals,
        body,
        sleep,
        cycle,
        hair,
        study: sessions,
        recall,
        defaults: {
          cycleLen: settings?.default_cycle_len ?? 28,
          periodLen: settings?.default_period_len ?? 5,
        },
        today: todayStr(),
      }),
    [meals, body, sleep, cycle, hair, sessions, recall, settings]
  );

  const validCustom = customFrom <= customTo;

  return (
    <>
      <PageHeader title="Insights" />

      <div className="px-4 py-4 flex flex-col gap-4">
        {/* Range selector */}
        <Card className="py-3">
          {mode === "period" ? (
            <>
              <PeriodBar
                view={view}
                anchor={anchor}
                onViewChange={setView}
                onAnchorChange={setAnchor}
              />
              <button
                onClick={() => setMode("custom")}
                className="text-xs text-brand mx-auto block mt-3"
              >
                Custom range
              </button>
            </>
          ) : (
            <div className="flex flex-col gap-3">
              <div className="flex items-end gap-2">
                <Input
                  id="from"
                  label="From"
                  type="date"
                  value={customFrom}
                  max={customTo}
                  onChange={(e) => setCustomFrom(e.target.value)}
                  className="flex-1"
                />
                <Input
                  id="to"
                  label="To"
                  type="date"
                  value={customTo}
                  min={customFrom}
                  max={todayStr()}
                  onChange={(e) => setCustomTo(e.target.value)}
                  className="flex-1"
                />
              </div>
              {!validCustom && (
                <p className="text-xs text-danger">
                  Start date must be before end date.
                </p>
              )}
              <button
                onClick={() => setMode("period")}
                className="text-xs text-brand mx-auto"
              >
                Back to Day / Week / Month
              </button>
            </div>
          )}
        </Card>

        {/* Visualizations */}
        <MealsChart meals={meals} buckets={buckets} />
        <NutritionChart
          nutrients={nutrients}
          items={mealItems}
          supplements={supplements}
          logs={suppLogs}
          foodNutrients={foodNutrients}
          buckets={buckets}
        />
        <SleepChart sleep={sleep} buckets={buckets} />
        <StudyChart sessions={sessions} buckets={buckets} />
        <BodyChart body={body} buckets={buckets} />

        {/* Correlations / patterns */}
        {cards.length > 0 && (
          <>
            <h3 className="text-xs font-medium text-fg-muted px-1 pt-1">
              Patterns &amp; correlations
            </h3>
            {cards.map((card) => (
              <Card
                key={card.id}
                className={cn(card.strength === "weak" && "opacity-60")}
              >
                <div className="flex items-start gap-3">
                  <span className="text-2xl">{card.emoji}</span>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-sm font-medium text-fg">{card.title}</h3>
                      <span
                        className={cn(
                          "text-xs px-1.5 py-0.5 rounded",
                          card.strength === "strong" && "bg-success/20 text-success",
                          card.strength === "medium" && "bg-brand/20 text-brand",
                          card.strength === "weak" && "bg-elevated text-fg-dim"
                        )}
                      >
                        {card.strength}
                      </span>
                    </div>
                    <p className="text-sm text-fg-muted">{card.detail}</p>
                  </div>
                </div>
              </Card>
            ))}
          </>
        )}
      </div>
    </>
  );
}
