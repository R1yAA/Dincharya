"use client";

import { useMemo } from "react";
import { useMeals } from "./use-meals";
import { useBody } from "./use-body";
import { useSleep } from "./use-sleep";
import { useCycle } from "./use-cycle";
import { useHair } from "./use-hair";
import { useStudy } from "./use-study";
import { useRecall } from "./use-recall";
import { useSettings } from "./use-settings";
import { buildInsights, InsightCard } from "@/lib/insights";
import { addDays, todayStr } from "@/lib/format";

export type Period = "month" | "3months" | "year" | "all";

function cutoffDate(period: Period): string | null {
  const today = todayStr();
  switch (period) {
    case "month": return addDays(today, -30);
    case "3months": return addDays(today, -90);
    case "year": return addDays(today, -365);
    case "all": return null;
  }
}

export function useInsights(period: Period): { insights: InsightCard[]; isLoading: boolean } {
  const { meals, isLoading: lm } = useMeals();
  const { checkins, isLoading: lb } = useBody();
  const { logs: sleep, isLoading: ls } = useSleep();
  const { days: cycle, isLoading: lc } = useCycle();
  const { logs: hair, isLoading: lh } = useHair();
  const { logs: study, isLoading: lst } = useStudy();
  const { items: recall, isLoading: lr } = useRecall();
  const { settings } = useSettings();

  const isLoading = lm || lb || ls || lc || lh || lst || lr;

  const insights = useMemo(() => {
    const cutoff = cutoffDate(period);
    const filter = <T extends { date: string }>(arr: T[]) =>
      cutoff ? arr.filter((x) => x.date >= cutoff) : arr;

    return buildInsights({
      meals: filter(meals),
      body: filter(checkins),
      sleep: filter(sleep),
      cycle: filter(cycle),
      hair: filter(hair),
      study: filter(study),
      recall,
      defaults: {
        cycleLen: settings?.default_cycle_len ?? 28,
        periodLen: settings?.default_period_len ?? 5,
      },
      today: todayStr(),
    });
  }, [meals, checkins, sleep, cycle, hair, study, recall, settings, period]);

  return { insights, isLoading };
}
