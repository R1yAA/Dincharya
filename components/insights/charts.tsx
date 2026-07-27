"use client";

import { useMemo, useState } from "react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ReferenceLine,
  CartesianGrid,
} from "recharts";
import { Card } from "@/components/ui/card";
import { Chip } from "@/components/ui/chip";
import {
  Meal,
  SleepLog,
  StudySession,
  BodyCheckin,
  Nutrient,
  Supplement,
  SupplementLog,
  FoodNutrient,
} from "@/lib/supabase/types";
import { CHART, tooltipStyle, tickInterval, Bucket, bucketOf } from "@/lib/chart";
import {
  DatedMealItem,
  dailyTotals,
  fmtAmount,
  nutrientBucketSeries,
  profileMap,
} from "@/lib/nutrition";

const AXIS = { stroke: CHART.axis, fontSize: 10, tickLine: false, axisLine: false };
const H = 180;

export function ChartCard({
  title,
  stat,
  children,
}: {
  title: string;
  stat?: string;
  children: React.ReactNode;
}) {
  return (
    <Card>
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm font-medium text-fg">{title}</span>
        {stat && <span className="text-xs text-fg-muted">{stat}</span>}
      </div>
      {children}
    </Card>
  );
}

function EmptyChart({ message }: { message: string }) {
  return (
    <div className="h-[120px] flex items-center justify-center text-xs text-fg-dim">
      {message}
    </div>
  );
}

function Legend({ items }: { items: { label: string; color: string }[] }) {
  return (
    <div className="flex items-center justify-center gap-3 mt-2 text-[10px] text-fg-dim">
      {items.map((i) => (
        <span key={i.label} className="flex items-center gap-1">
          <span
            className="w-2 h-2 rounded-full"
            style={{ backgroundColor: i.color }}
          />
          {i.label}
        </span>
      ))}
    </div>
  );
}

// ===================== MEALS =====================
export function MealsChart({
  meals,
  buckets,
}: {
  meals: Meal[];
  buckets: Bucket[];
}) {
  const data = buckets.map((b) => ({ label: b.label, healthy: 0, okay: 0, junk: 0 }));
  let healthy = 0,
    junk = 0,
    sugar = 0;
  for (const m of meals) {
    const i = bucketOf(buckets, m.date);
    if (i < 0) continue;
    if (m.health_rating === "healthy") {
      data[i].healthy++;
      healthy++;
    } else if (m.health_rating === "okay") data[i].okay++;
    else if (m.health_rating === "junk") {
      data[i].junk++;
      junk++;
    }
    if (m.processed_sugar) sugar++;
  }
  const pct = meals.length ? Math.round((healthy / meals.length) * 100) : 0;

  return (
    <ChartCard
      title="Meals"
      stat={
        meals.length
          ? `${meals.length} logged · ${pct}% healthy · ${junk} junk · ${sugar} w/ sugar`
          : undefined
      }
    >
      {meals.length === 0 ? (
        <EmptyChart message="No meals logged in this range." />
      ) : (
        <>
          <ResponsiveContainer width="100%" height={H}>
            <BarChart data={data} margin={{ top: 4, right: 4, left: -24, bottom: 0 }}>
              <CartesianGrid stroke={CHART.grid} vertical={false} />
              <XAxis
                dataKey="label"
                {...AXIS}
                interval={tickInterval(data.length)}
              />
              <YAxis {...AXIS} allowDecimals={false} width={28} />
              <Tooltip contentStyle={tooltipStyle} cursor={{ fill: CHART.grid }} />
              <Bar dataKey="healthy" stackId="a" fill={CHART.success} radius={[0, 0, 0, 0]} />
              <Bar dataKey="okay" stackId="a" fill={CHART.amber} />
              <Bar dataKey="junk" stackId="a" fill={CHART.danger} radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
          <Legend
            items={[
              { label: "Healthy", color: CHART.success },
              { label: "Okay", color: CHART.amber },
              { label: "Junk", color: CHART.danger },
            ]}
          />
        </>
      )}
    </ChartCard>
  );
}

// ===================== NUTRITION =====================
export function NutritionChart({
  nutrients,
  items,
  supplements,
  logs,
  foodNutrients,
  buckets,
}: {
  nutrients: Nutrient[];
  items: DatedMealItem[];
  supplements: Supplement[];
  logs: SupplementLog[];
  foodNutrients: FoodNutrient[];
  buckets: Bucket[];
}) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const active =
    nutrients.find((n) => n.id === selectedId) ||
    nutrients.find((n) => n.daily_goal !== null) ||
    nutrients[0];

  const totals = useMemo(
    () =>
      dailyTotals({
        items,
        supplements,
        logs,
        profiles: profileMap(foodNutrients),
      }),
    [items, supplements, logs, foodNutrients]
  );

  if (nutrients.length === 0) return null;

  const data = nutrientBucketSeries(buckets, totals, active.id).map((d) => ({
    label: d.label,
    value: d.value != null ? Math.round(d.value * 10) / 10 : null,
  }));
  const hasData = data.some((d) => d.value != null);

  // Per-day goal stats across the range, independent of bucket size.
  let daysWithData = 0;
  let daysHit = 0;
  let sum = 0;
  for (const day of totals.values()) {
    const v = day.get(active.id) || 0;
    if (v <= 0) continue;
    daysWithData++;
    sum += v;
    if (active.daily_goal !== null && v >= active.daily_goal) daysHit++;
  }
  const stat = daysWithData
    ? [
        `avg ${fmtAmount(sum / daysWithData)}${active.unit}/day`,
        active.daily_goal !== null &&
          `goal ${fmtAmount(active.daily_goal)}${active.unit}`,
        active.daily_goal !== null && `hit ${daysHit}/${daysWithData} days`,
      ]
        .filter(Boolean)
        .join(" · ")
    : undefined;

  return (
    <ChartCard title="Nutrition" stat={stat}>
      {nutrients.length > 1 && (
        <div className="flex flex-wrap gap-1.5 mb-3">
          {nutrients.map((n) => (
            <Chip
              key={n.id}
              selected={n.id === active.id}
              onClick={() => setSelectedId(n.id)}
            >
              {n.name}
            </Chip>
          ))}
        </div>
      )}
      {!hasData ? (
        <EmptyChart message="No foods logged in this range." />
      ) : (
        <ResponsiveContainer width="100%" height={H}>
          <BarChart data={data} margin={{ top: 4, right: 4, left: -24, bottom: 0 }}>
            <CartesianGrid stroke={CHART.grid} vertical={false} />
            <XAxis dataKey="label" {...AXIS} interval={tickInterval(data.length)} />
            <YAxis {...AXIS} width={28} domain={[0, "dataMax + 1"]} />
            <Tooltip contentStyle={tooltipStyle} cursor={{ fill: CHART.grid }} />
            {active.daily_goal !== null && (
              <ReferenceLine
                y={active.daily_goal}
                stroke={CHART.amber}
                strokeDasharray="3 3"
              />
            )}
            <Bar dataKey="value" name={`${active.name} (${active.unit})`} fill={CHART.brand} radius={[3, 3, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      )}
    </ChartCard>
  );
}

// ===================== SLEEP =====================
export function SleepChart({
  sleep,
  buckets,
}: {
  sleep: SleepLog[];
  buckets: Bucket[];
}) {
  const acc = buckets.map(() => ({ sum: 0, n: 0 }));
  const hoursList: number[] = [];
  for (const s of sleep) {
    if (s.hours == null) continue;
    const i = bucketOf(buckets, s.date);
    if (i < 0) continue;
    acc[i].sum += s.hours;
    acc[i].n++;
    hoursList.push(s.hours);
  }
  const data = buckets.map((b, i) => ({
    label: b.label,
    hours: acc[i].n ? +(acc[i].sum / acc[i].n).toFixed(1) : 0,
  }));
  const avg = hoursList.length
    ? +(hoursList.reduce((a, c) => a + c, 0) / hoursList.length).toFixed(1)
    : 0;

  return (
    <ChartCard
      title="Sleep"
      stat={hoursList.length ? `avg ${avg}h · ${hoursList.length} nights` : undefined}
    >
      {hoursList.length === 0 ? (
        <EmptyChart message="No sleep logged in this range." />
      ) : (
        <ResponsiveContainer width="100%" height={H}>
          <BarChart data={data} margin={{ top: 4, right: 4, left: -24, bottom: 0 }}>
            <CartesianGrid stroke={CHART.grid} vertical={false} />
            <XAxis dataKey="label" {...AXIS} interval={tickInterval(data.length)} />
            <YAxis {...AXIS} width={28} domain={[0, "dataMax + 1"]} />
            <Tooltip contentStyle={tooltipStyle} cursor={{ fill: CHART.grid }} />
            <ReferenceLine y={avg} stroke={CHART.accent2} strokeDasharray="3 3" />
            <Bar dataKey="hours" fill={CHART.accent2} radius={[3, 3, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      )}
    </ChartCard>
  );
}

// ===================== STUDY =====================
export function StudyChart({
  sessions,
  buckets,
}: {
  sessions: StudySession[];
  buckets: Bucket[];
}) {
  const data = buckets.map((b) => ({ label: b.label, study: 0, recall: 0 }));
  let study = 0,
    recall = 0;
  for (const s of sessions) {
    const i = bucketOf(buckets, s.date);
    if (i < 0) continue;
    if (s.kind === "recall") {
      data[i].recall += s.duration_min;
      recall += s.duration_min;
    } else {
      data[i].study += s.duration_min;
      study += s.duration_min;
    }
  }
  const total = study + recall;
  const fmt = (m: number) => (m >= 60 ? `${(m / 60).toFixed(1)}h` : `${m}m`);

  return (
    <ChartCard
      title="Study"
      stat={
        total ? `${fmt(study)} study · ${fmt(recall)} recall` : undefined
      }
    >
      {total === 0 ? (
        <EmptyChart message="No study sessions in this range." />
      ) : (
        <>
          <ResponsiveContainer width="100%" height={H}>
            <BarChart data={data} margin={{ top: 4, right: 4, left: -24, bottom: 0 }}>
              <CartesianGrid stroke={CHART.grid} vertical={false} />
              <XAxis dataKey="label" {...AXIS} interval={tickInterval(data.length)} />
              <YAxis {...AXIS} width={28} />
              <Tooltip contentStyle={tooltipStyle} cursor={{ fill: CHART.grid }} />
              <Bar dataKey="study" stackId="a" fill={CHART.violet} />
              <Bar dataKey="recall" stackId="a" fill={CHART.brand} radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
          <Legend
            items={[
              { label: "Study (min)", color: CHART.violet },
              { label: "Recall (min)", color: CHART.brand },
            ]}
          />
        </>
      )}
    </ChartCard>
  );
}

// ===================== BODY =====================
export function BodyChart({
  body,
  buckets,
}: {
  body: BodyCheckin[];
  buckets: Bucket[];
}) {
  const wAcc = buckets.map(() => ({ sum: 0, n: 0 }));
  const eAcc = buckets.map(() => ({ sum: 0, n: 0 }));
  const mAcc = buckets.map(() => ({ sum: 0, n: 0 }));
  let eSum = 0,
    eN = 0,
    mSum = 0,
    mN = 0;
  for (const c of body) {
    const i = bucketOf(buckets, c.date);
    if (i < 0) continue;
    if (c.weight_kg != null) {
      wAcc[i].sum += c.weight_kg;
      wAcc[i].n++;
    }
    if (c.energy != null) {
      eAcc[i].sum += c.energy;
      eAcc[i].n++;
      eSum += c.energy;
      eN++;
    }
    if (c.mood != null) {
      mAcc[i].sum += c.mood;
      mAcc[i].n++;
      mSum += c.mood;
      mN++;
    }
  }
  const avg = (a: { sum: number; n: number }) =>
    a.n ? +(a.sum / a.n).toFixed(1) : null;
  const data = buckets.map((b, i) => ({
    label: b.label,
    weight: avg(wAcc[i]),
    energy: avg(eAcc[i]),
    mood: avg(mAcc[i]),
  }));
  const hasWeight = data.some((d) => d.weight != null);
  const hasRatings = eN > 0 || mN > 0;
  const avgE = eN ? (eSum / eN).toFixed(1) : "–";
  const avgM = mN ? (mSum / mN).toFixed(1) : "–";

  return (
    <ChartCard
      title="Body"
      stat={
        body.length ? `energy ${avgE}/5 · mood ${avgM}/5` : undefined
      }
    >
      {body.length === 0 ? (
        <EmptyChart message="No body check-ins in this range." />
      ) : hasWeight ? (
        <ResponsiveContainer width="100%" height={H}>
          <LineChart data={data} margin={{ top: 4, right: 8, left: -24, bottom: 0 }}>
            <CartesianGrid stroke={CHART.grid} vertical={false} />
            <XAxis dataKey="label" {...AXIS} interval={tickInterval(data.length)} />
            <YAxis {...AXIS} width={32} domain={["dataMin - 1", "dataMax + 1"]} />
            <Tooltip contentStyle={tooltipStyle} />
            <Line
              type="monotone"
              dataKey="weight"
              stroke={CHART.brand}
              strokeWidth={2}
              dot={{ r: 2 }}
              connectNulls
            />
          </LineChart>
        </ResponsiveContainer>
      ) : hasRatings ? (
        <>
          <ResponsiveContainer width="100%" height={H}>
            <LineChart data={data} margin={{ top: 4, right: 8, left: -24, bottom: 0 }}>
              <CartesianGrid stroke={CHART.grid} vertical={false} />
              <XAxis dataKey="label" {...AXIS} interval={tickInterval(data.length)} />
              <YAxis {...AXIS} width={32} domain={[0, 5]} ticks={[1, 2, 3, 4, 5]} />
              <Tooltip contentStyle={tooltipStyle} />
              <Line
                type="monotone"
                dataKey="energy"
                stroke={CHART.accent2}
                strokeWidth={2}
                dot={{ r: 2 }}
                connectNulls
              />
              <Line
                type="monotone"
                dataKey="mood"
                stroke={CHART.violet}
                strokeWidth={2}
                dot={{ r: 2 }}
                connectNulls
              />
            </LineChart>
          </ResponsiveContainer>
          <Legend
            items={[
              { label: "Energy (1-5)", color: CHART.accent2 },
              { label: "Mood (1-5)", color: CHART.violet },
            ]}
          />
        </>
      ) : (
        <EmptyChart message="No weight, energy or mood logged in this range." />
      )}
    </ChartCard>
  );
}
