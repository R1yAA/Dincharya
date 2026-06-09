"use client";

import { Card } from "@/components/ui/card";
import { CycleStatus } from "@/lib/cycle";
import { formatDate } from "@/lib/format";

export function CycleStatusCard({ status }: { status: CycleStatus }) {
  return (
    <Card className="border-cycle/30">
      <div className="flex items-baseline gap-3 mb-2">
        <span className="text-2xl font-bold text-cycle">
          Day {status.cycleDay}
        </span>
        <span className="text-sm text-cycle/80">{status.phase}</span>
      </div>
      <div className="grid grid-cols-2 gap-2 text-sm">
        <div>
          <span className="text-fg-muted">Next period</span>
          <p className="text-fg">
            ~{formatDate(status.nextPeriodEstimate)}
            {status.daysUntilNext > 0 && (
              <span className="text-fg-muted text-xs ml-1">
                ({status.daysUntilNext}d)
              </span>
            )}
          </p>
        </div>
        <div>
          <span className="text-fg-muted">Avg cycle</span>
          <p className="text-fg">{status.avgCycleLen} days</p>
        </div>
        <div>
          <span className="text-fg-muted">Avg period</span>
          <p className="text-fg">{status.avgPeriodLen} days</p>
        </div>
      </div>
      <p className="text-xs text-fg-dim mt-2">These are estimates, not medical advice.</p>
    </Card>
  );
}
