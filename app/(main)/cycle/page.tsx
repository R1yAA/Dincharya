"use client";

import { useState, useMemo } from "react";
import { PageHeader } from "@/components/layout/page-header";
import { Fab } from "@/components/layout/fab";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { CycleStatusCard } from "@/components/cycle/cycle-status-card";
import { CycleCalendar } from "@/components/cycle/cycle-calendar";
import { CycleDayForm } from "@/components/cycle/cycle-day-form";
import { useCycle } from "@/hooks/use-cycle";
import { useSettings } from "@/hooks/use-settings";
import { useToast } from "@/components/ui/toast";
import { currentCycle, deriveCycles } from "@/lib/cycle";
import { todayStr, formatDate } from "@/lib/format";

export default function CyclePage() {
  const { days, upsert, remove } = useCycle();
  const { settings } = useSettings();
  const { toast } = useToast();
  const [formOpen, setFormOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState(todayStr());

  const defaults = {
    cycleLen: settings?.default_cycle_len ?? 28,
    periodLen: settings?.default_period_len ?? 5,
  };

  const status = useMemo(
    () => currentCycle(days, todayStr(), defaults),
    [days, defaults]
  );

  const cycles = useMemo(() => deriveCycles(days), [days]);
  const existing = days.find((d) => d.date === selectedDate) || null;

  return (
    <>
      <PageHeader title="Cycle" />

      <div className="px-4 py-4 flex flex-col gap-4">
        {status ? (
          <CycleStatusCard status={status} />
        ) : (
          <EmptyState
            emoji="🌸"
            message="No period data yet. Log a period day to start tracking your cycle."
          />
        )}

        <Card>
          <CycleCalendar
            days={days}
            defaults={defaults}
            onDayClick={(date) => {
              setSelectedDate(date);
              setFormOpen(true);
            }}
          />
        </Card>

        {cycles.length > 0 && (
          <div>
            <h3 className="text-xs font-medium text-fg-muted px-1 mb-2">
              Cycle history
            </h3>
            <Card className="p-0 overflow-hidden">
              {[...cycles].reverse().map((c, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between px-4 py-3 border-b border-line last:border-0"
                >
                  <div>
                    <span className="text-sm text-fg">
                      Started {formatDate(c.start)}
                    </span>
                    <div className="text-xs text-fg-muted">
                      Period: {c.periodLength}d
                      {c.cycleLength && ` · Cycle: ${c.cycleLength}d`}
                    </div>
                  </div>
                </div>
              ))}
            </Card>
          </div>
        )}
      </div>

      <Fab
        onClick={() => {
          setSelectedDate(todayStr());
          setFormOpen(true);
        }}
      />

      <CycleDayForm
        open={formOpen}
        onOpenChange={setFormOpen}
        date={selectedDate}
        existing={existing}
        onSave={(day) => {
          upsert.mutate(day, { onSuccess: () => toast("Cycle day saved") });
        }}
        onRemove={(date) => {
          remove.mutate(date, { onSuccess: () => toast("Day removed") });
        }}
      />
    </>
  );
}
