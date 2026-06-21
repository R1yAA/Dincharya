"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import {
  PeriodView,
  periodLabel,
  shiftAnchor,
  isCurrentPeriod,
} from "@/lib/period";
import { cn } from "@/lib/utils";

interface PeriodBarProps {
  view: PeriodView;
  anchor: string;
  onViewChange: (v: PeriodView) => void;
  onAnchorChange: (a: string) => void;
  views?: PeriodView[];
}

/**
 * Screen Time-style header: a segmented Day/Week/Month control plus a
 * ‹ period › navigator. Changing the view keeps the same anchor, so the data
 * below re-derives for the new granularity without any extra taps.
 */
export function PeriodBar({
  view,
  anchor,
  onViewChange,
  onAnchorChange,
  views = ["day", "week", "month"],
}: PeriodBarProps) {
  const atCurrent = isCurrentPeriod(view, anchor);

  return (
    <div className="flex flex-col gap-3">
      <div className="flex self-center rounded-full bg-elevated p-0.5">
        {views.map((v) => (
          <button
            key={v}
            onClick={() => onViewChange(v)}
            className={cn(
              "px-5 py-1.5 rounded-full text-sm capitalize transition-colors",
              view === v
                ? "bg-brand text-bg font-medium"
                : "text-fg-muted hover:text-fg"
            )}
          >
            {v}
          </button>
        ))}
      </div>

      <div className="flex items-center justify-between">
        <button
          onClick={() => onAnchorChange(shiftAnchor(view, anchor, -1))}
          className="p-1.5 rounded-lg hover:bg-elevated text-fg-muted"
          aria-label="Previous"
        >
          <ChevronLeft size={18} />
        </button>
        <span className="text-sm font-medium text-fg">
          {periodLabel(view, anchor)}
        </span>
        <button
          onClick={() => !atCurrent && onAnchorChange(shiftAnchor(view, anchor, 1))}
          disabled={atCurrent}
          className={cn(
            "p-1.5 rounded-lg text-fg-muted",
            atCurrent ? "opacity-30 cursor-default" : "hover:bg-elevated"
          )}
          aria-label="Next"
        >
          <ChevronRight size={18} />
        </button>
      </div>
    </div>
  );
}
