import { Meal, BodyCheckin, SleepLog, CycleDay, HairLog, StudyLog, RecallItem } from "./supabase/types";
import { deriveCycles, getPhaseForDay } from "./cycle";
import { daysBetween } from "./format";

export interface InsightCard {
  id: string;
  strength: "weak" | "medium" | "strong";
  emoji: string;
  title: string;
  detail: string;
}

interface InsightData {
  meals: Meal[];
  body: BodyCheckin[];
  sleep: SleepLog[];
  cycle: CycleDay[];
  hair: HairLog[];
  study: StudyLog[];
  recall: RecallItem[];
  defaults: { cycleLen: number; periodLen: number };
  today: string;
}

function pearson(xs: number[], ys: number[]): number {
  const n = xs.length;
  if (n < 3) return 0;
  const mx = xs.reduce((a, b) => a + b, 0) / n;
  const my = ys.reduce((a, b) => a + b, 0) / n;
  let num = 0, dx2 = 0, dy2 = 0;
  for (let i = 0; i < n; i++) {
    const dx = xs[i] - mx;
    const dy = ys[i] - my;
    num += dx * dy;
    dx2 += dx * dx;
    dy2 += dy * dy;
  }
  const denom = Math.sqrt(dx2 * dy2);
  return denom === 0 ? 0 : num / denom;
}

function strengthFromR(r: number): "weak" | "medium" | "strong" {
  const abs = Math.abs(r);
  if (abs >= 0.5) return "strong";
  if (abs >= 0.3) return "medium";
  return "weak";
}

export function buildInsights(data: InsightData): InsightCard[] {
  const cards: InsightCard[] = [];

  // 1. Meal mix
  if (data.meals.length >= 5) {
    const cats = data.meals.reduce<Record<string, number>>((acc, m) => {
      acc[m.category] = (acc[m.category] || 0) + 1;
      return acc;
    }, {});
    const total = data.meals.length;
    const topCat = Object.entries(cats).sort((a, b) => b[1] - a[1])[0];
    const pct = Math.round((topCat[1] / total) * 100);
    cards.push({
      id: "meal-mix",
      strength: pct > 40 ? "strong" : "medium",
      emoji: "🍽️",
      title: "Meal mix",
      detail: `${topCat[0].replace("-", " ")} makes up ${pct}% of your meals (${topCat[1]}/${total}).`,
    });
  }

  // 2. Cycle × meals
  if (data.cycle.length >= 10 && data.meals.length >= 10) {
    const cycles = deriveCycles(data.cycle);
    const avgCycleLen = cycles.filter(c => c.cycleLength).length > 0
      ? Math.round(cycles.filter(c => c.cycleLength).reduce((s, c) => s + c.cycleLength!, 0) / cycles.filter(c => c.cycleLength).length)
      : data.defaults.cycleLen;
    const avgPeriodLen = Math.round(cycles.reduce((s, c) => s + c.periodLength, 0) / cycles.length);

    const mealPhases = data.meals.map(m => {
      const lastCycleBefore = cycles.filter(c => c.start <= m.date).pop();
      if (!lastCycleBefore) return null;
      const cd = daysBetween(lastCycleBefore.start, m.date) + 1;
      return { ...m, phase: getPhaseForDay(cd, avgCycleLen, avgPeriodLen) };
    }).filter(Boolean) as (Meal & { phase: string })[];

    const lutealSnacks = mealPhases.filter(m => m.phase === "Luteal" && (m.category.includes("snack") || m.category === "dessert")).length;
    const lutealTotal = mealPhases.filter(m => m.phase === "Luteal").length;
    const otherSnacks = mealPhases.filter(m => m.phase !== "Luteal" && (m.category.includes("snack") || m.category === "dessert")).length;
    const otherTotal = mealPhases.filter(m => m.phase !== "Luteal").length;

    if (lutealTotal >= 3 && otherTotal >= 3) {
      const lutealRate = lutealSnacks / lutealTotal;
      const otherRate = otherSnacks / otherTotal;
      if (lutealRate > otherRate * 1.2) {
        cards.push({
          id: "cycle-meals",
          strength: lutealRate > otherRate * 1.5 ? "strong" : "medium",
          emoji: "🌙",
          title: "Cycle × snacking",
          detail: `Snack & dessert meals make up ${Math.round(lutealRate * 100)}% of luteal-phase meals vs ${Math.round(otherRate * 100)}% otherwise.`,
        });
      }
    }
  }

  // 3. Sleep × next-day eating
  if (data.sleep.length >= 8 && data.meals.length >= 8) {
    const sleepByDate = new Map(data.sleep.map(s => [s.date, s]));
    let lowSleepOutside = 0, lowSleepTotal = 0;
    let okSleepOutside = 0, okSleepTotal = 0;

    for (const meal of data.meals) {
      const sleep = sleepByDate.get(meal.date);
      if (!sleep || !sleep.hours) continue;
      const isOutQuick = meal.category.startsWith("out-");
      if (sleep.hours < 6) {
        lowSleepTotal++;
        if (isOutQuick) lowSleepOutside++;
      } else {
        okSleepTotal++;
        if (isOutQuick) okSleepOutside++;
      }
    }

    if (lowSleepTotal >= 3 && okSleepTotal >= 3) {
      const lowRate = lowSleepOutside / lowSleepTotal;
      const okRate = okSleepOutside / okSleepTotal;
      if (lowRate > okRate * 1.3) {
        cards.push({
          id: "sleep-eating",
          strength: lowRate > okRate * 2 ? "strong" : "medium",
          emoji: "😴",
          title: "Sleep × outside food",
          detail: `After <6h sleep, ${Math.round(lowRate * 100)}% of meals are outside food vs ${Math.round(okRate * 100)}% after adequate sleep.`,
        });
      }
    }
  }

  // 4. Sleep × body (energy correlation)
  if (data.sleep.length >= 8 && data.body.length >= 8) {
    const sleepByDate = new Map(data.sleep.map(s => [s.date, s]));
    const xs: number[] = [], ys: number[] = [];
    for (const b of data.body) {
      const s = sleepByDate.get(b.date);
      if (s?.quality && b.energy) {
        xs.push(s.quality);
        ys.push(b.energy);
      }
    }
    if (xs.length >= 8) {
      const r = pearson(xs, ys);
      cards.push({
        id: "sleep-energy",
        strength: strengthFromR(r),
        emoji: "⚡",
        title: "Sleep quality × energy",
        detail: `Sleep quality and next-day energy have a correlation of r≈${r.toFixed(2)} (n=${xs.length}).`,
      });
    }
  }

  // 5. Weight trend
  const weights = data.body.filter(b => b.weight_kg).sort((a, b) => a.date.localeCompare(b.date));
  if (weights.length >= 3) {
    const first = weights[0].weight_kg!;
    const last = weights[weights.length - 1].weight_kg!;
    const diff = last - first;
    const avg = weights.reduce((s, w) => s + w.weight_kg!, 0) / weights.length;
    cards.push({
      id: "weight-trend",
      strength: Math.abs(diff) > 2 ? "strong" : Math.abs(diff) > 0.5 ? "medium" : "weak",
      emoji: "⚖️",
      title: "Weight trend",
      detail: `${diff > 0.5 ? "Up" : diff < -0.5 ? "Down" : "Steady"} ${Math.abs(diff).toFixed(1)} kg over ${weights.length} check-ins (avg ${avg.toFixed(1)} kg).`,
    });
  }

  // 6. Hair × cycle
  if (data.hair.length >= 5 && data.cycle.length >= 10) {
    const cycles = deriveCycles(data.cycle);
    const avgCycleLen = cycles.filter(c => c.cycleLength).length > 0
      ? Math.round(cycles.filter(c => c.cycleLength).reduce((s, c) => s + c.cycleLength!, 0) / cycles.filter(c => c.cycleLength).length)
      : data.defaults.cycleLen;
    const avgPeriodLen = Math.round(cycles.reduce((s, c) => s + c.periodLength, 0) / cycles.length);

    const hairWithPhase = data.hair.map(h => {
      const lastCycleBefore = cycles.filter(c => c.start <= h.date).pop();
      if (!lastCycleBefore) return null;
      const cd = daysBetween(lastCycleBefore.start, h.date) + 1;
      return { ...h, phase: getPhaseForDay(cd, avgCycleLen, avgPeriodLen) };
    }).filter(Boolean) as (HairLog & { phase: string })[];

    const prePeriod = hairWithPhase.filter(h => h.phase === "Luteal" && h.shedding);
    const other = hairWithPhase.filter(h => h.phase !== "Luteal" && h.shedding);
    if (prePeriod.length >= 2 && other.length >= 2) {
      const ppAvg = prePeriod.reduce((s, h) => s + h.shedding!, 0) / prePeriod.length;
      const otherAvg = other.reduce((s, h) => s + h.shedding!, 0) / other.length;
      if (ppAvg > otherAvg * 1.2) {
        cards.push({
          id: "hair-cycle",
          strength: ppAvg > otherAvg * 1.5 ? "strong" : "medium",
          emoji: "💇",
          title: "Hair × cycle",
          detail: `Shedding averages ${ppAvg.toFixed(1)} in luteal phase vs ${otherAvg.toFixed(1)} otherwise.`,
        });
      }
    }
  }

  // 7. Study × sleep
  if (data.study.length >= 5 && data.sleep.length >= 5) {
    const sleepByDate = new Map(data.sleep.map(s => [s.date, s]));
    const xs: number[] = [], ys: number[] = [];
    for (const st of data.study) {
      const s = sleepByDate.get(st.date);
      if (s?.hours && st.confidence) {
        xs.push(s.hours);
        ys.push(st.confidence);
      }
    }
    if (xs.length >= 5) {
      const r = pearson(xs, ys);
      cards.push({
        id: "study-sleep",
        strength: strengthFromR(r),
        emoji: "📚",
        title: "Study confidence × sleep",
        detail: `Sleep hours and study confidence correlate at r≈${r.toFixed(2)} (n=${xs.length}).`,
      });
    }
  }

  // 8. Active review discipline
  const activeRecall = data.recall.filter(r => r.is_active);
  if (activeRecall.length >= 5) {
    const reviewed = activeRecall.filter(r => r.last_reviewed);
    const totalDue = activeRecall.filter(r => r.due_date <= data.today).length;
    const completedDue = activeRecall.filter(r => r.due_date <= data.today && r.last_reviewed).length;
    const completionRate = totalDue > 0 ? completedDue / totalDue : 0;

    // Daily completion trend: group by last_reviewed date
    const dailyMap = new Map<string, { done: number; due: number }>();
    for (const item of activeRecall) {
      if (item.due_date <= data.today) {
        const bucket = item.last_reviewed || item.due_date;
        const entry = dailyMap.get(bucket) || { done: 0, due: 0 };
        entry.due++;
        if (item.last_reviewed) entry.done++;
        dailyMap.set(bucket, entry);
      }
    }
    const daysWithReviews = [...dailyMap.entries()].filter(([, v]) => v.done > 0).length;

    cards.push({
      id: "review-discipline",
      strength: completionRate > 0.8 ? "strong" : completionRate > 0.5 ? "medium" : "weak",
      emoji: "🧠",
      title: "Review discipline",
      detail: `${Math.round(completionRate * 100)}% of due reviews completed (${completedDue}/${totalDue}). Active review days: ${daysWithReviews}.`,
    });
  }

  // 8b. Study consistency
  if (data.study.length >= 5) {
    const studyDates = new Set(data.study.map(s => s.date));
    const totalMins = data.study.reduce((s, l) => s + (l.duration_min || 0), 0);
    const avgPerSession = Math.round(totalMins / data.study.length);
    cards.push({
      id: "study-consistency",
      strength: studyDates.size > 14 ? "strong" : studyDates.size > 5 ? "medium" : "weak",
      emoji: "📖",
      title: "Study consistency",
      detail: `${data.study.length} sessions across ${studyDates.size} days. Avg ${avgPerSession} min/session.`,
    });
  }

  // 9. Cycle × body
  if (data.body.length >= 10 && data.cycle.length >= 10) {
    const cycles = deriveCycles(data.cycle);
    const avgCycleLen = cycles.filter(c => c.cycleLength).length > 0
      ? Math.round(cycles.filter(c => c.cycleLength).reduce((s, c) => s + c.cycleLength!, 0) / cycles.filter(c => c.cycleLength).length)
      : data.defaults.cycleLen;
    const avgPeriodLen = Math.round(cycles.reduce((s, c) => s + c.periodLength, 0) / cycles.length);

    const bodyWithPhase = data.body.map(b => {
      const lastCycleBefore = cycles.filter(c => c.start <= b.date).pop();
      if (!lastCycleBefore) return null;
      const cd = daysBetween(lastCycleBefore.start, b.date) + 1;
      return { ...b, phase: getPhaseForDay(cd, avgCycleLen, avgPeriodLen) };
    }).filter(Boolean) as (BodyCheckin & { phase: string })[];

    const phaseAvg = (phase: string, field: "bloating" | "mood" | "energy") => {
      const items = bodyWithPhase.filter(b => b.phase === phase && b[field] !== null);
      return items.length >= 2 ? items.reduce((s, b) => s + b[field]!, 0) / items.length : null;
    };

    const lutealBloating = phaseAvg("Luteal", "bloating");
    const follicBloating = phaseAvg("Follicular", "bloating");
    if (lutealBloating !== null && follicBloating !== null && lutealBloating > follicBloating + 0.5) {
      cards.push({
        id: "cycle-body",
        strength: lutealBloating > follicBloating + 1 ? "strong" : "medium",
        emoji: "🫧",
        title: "Cycle × bloating",
        detail: `Bloating averages ${lutealBloating.toFixed(1)} in luteal phase vs ${follicBloating.toFixed(1)} in follicular.`,
      });
    }
  }

  return cards.sort((a, b) => {
    const order = { strong: 0, medium: 1, weak: 2 };
    return order[a.strength] - order[b.strength];
  });
}
