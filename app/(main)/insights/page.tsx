"use client";

import { useState } from "react";
import { PageHeader } from "@/components/layout/page-header";
import { Card } from "@/components/ui/card";
import { Chip } from "@/components/ui/chip";
import { EmptyState } from "@/components/ui/empty-state";
import { useInsights, Period } from "@/hooks/use-insights";
import { cn } from "@/lib/utils";

const PERIODS: { value: Period; label: string }[] = [
  { value: "month", label: "Month" },
  { value: "3months", label: "3 Months" },
  { value: "year", label: "Year" },
  { value: "all", label: "All" },
];

export default function InsightsPage() {
  const [period, setPeriod] = useState<Period>("3months");
  const { insights, isLoading } = useInsights(period);

  return (
    <>
      <PageHeader title="Insights" />

      <div className="px-4 py-4 flex flex-col gap-4">
        <div className="flex gap-2 overflow-x-auto">
          {PERIODS.map((p) => (
            <Chip
              key={p.value}
              selected={period === p.value}
              onClick={() => setPeriod(p.value)}
            >
              {p.label}
            </Chip>
          ))}
        </div>

        {isLoading ? (
          <div className="flex justify-center py-12">
            <div className="w-6 h-6 border-2 border-brand border-t-transparent rounded-full animate-spin" />
          </div>
        ) : insights.length === 0 ? (
          <EmptyState
            emoji="🔍"
            message="Not enough data for insights yet. Keep logging and check back soon!"
          />
        ) : (
          insights.map((card) => (
            <Card
              key={card.id}
              className={cn(
                "transition-opacity",
                card.strength === "weak" && "opacity-60"
              )}
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
          ))
        )}
      </div>
    </>
  );
}
