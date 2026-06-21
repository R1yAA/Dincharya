"use client";

import { Supplement, SupplementLog } from "@/lib/supabase/types";
import { slotsForDate } from "@/lib/supplements";
import { formatTime } from "@/lib/format";
import { Check, X, Pencil, Plus, Pill } from "lucide-react";
import { cn } from "@/lib/utils";

interface SupplementSectionProps {
  date: string;
  supplements: Supplement[];
  logs: SupplementLog[];
  onSetStatus: (p: {
    supplement_id: string;
    date: string;
    slot_time: string | null;
    status: "taken" | "skipped";
  }) => void;
  onClear: (p: {
    supplement_id: string;
    date: string;
    slot_time: string | null;
  }) => void;
  onEdit: (s: Supplement) => void;
  onAdd: () => void;
}

export function SupplementSection({
  date,
  supplements,
  logs,
  onSetStatus,
  onClear,
  onEdit,
  onAdd,
}: SupplementSectionProps) {
  const slots = slotsForDate(supplements, logs, date);

  return (
    <div>
      <div className="flex items-center justify-between px-1 mb-1">
        <h3 className="text-xs font-medium text-fg-muted flex items-center gap-1">
          <Pill size={12} /> Supplements
        </h3>
        <button
          onClick={onAdd}
          className="inline-flex items-center gap-1 text-xs text-brand"
        >
          <Plus size={12} /> Add
        </button>
      </div>

      {slots.length === 0 ? (
        <p className="text-xs text-fg-dim px-1 py-2">None due this day.</p>
      ) : (
        <div className="flex flex-col rounded-xl border border-line overflow-hidden">
          {slots.map((slot) => {
            const key = `${slot.supplement.id}-${slot.slotTime ?? "any"}`;
            const taken = slot.status === "taken";
            const skipped = slot.status === "skipped";
            return (
              <div
                key={key}
                className="flex items-center gap-3 px-4 py-2.5 border-b border-line last:border-0"
              >
                <div className="flex-1 min-w-0">
                  <div
                    className={cn(
                      "text-sm font-medium truncate",
                      taken ? "text-fg-dim line-through" : "text-fg",
                      skipped && "text-fg-dim"
                    )}
                  >
                    {slot.supplement.name}
                  </div>
                  {slot.slotTime && (
                    <div className="text-xs text-fg-dim">
                      {formatTime(slot.slotTime)}
                    </div>
                  )}
                </div>

                <button
                  onClick={() => onEdit(slot.supplement)}
                  className="p-1.5 text-fg-dim hover:text-fg"
                >
                  <Pencil size={14} />
                </button>

                <button
                  onClick={() =>
                    taken
                      ? onClear({
                          supplement_id: slot.supplement.id,
                          date,
                          slot_time: slot.slotTime,
                        })
                      : onSetStatus({
                          supplement_id: slot.supplement.id,
                          date,
                          slot_time: slot.slotTime,
                          status: "taken",
                        })
                  }
                  className={cn(
                    "w-7 h-7 rounded-full flex items-center justify-center transition-colors",
                    taken
                      ? "bg-success text-bg"
                      : "bg-elevated text-fg-muted hover:bg-line"
                  )}
                  title={taken ? "Taken — tap to undo" : "Mark taken"}
                >
                  <Check size={15} />
                </button>

                <button
                  onClick={() =>
                    skipped
                      ? onClear({
                          supplement_id: slot.supplement.id,
                          date,
                          slot_time: slot.slotTime,
                        })
                      : onSetStatus({
                          supplement_id: slot.supplement.id,
                          date,
                          slot_time: slot.slotTime,
                          status: "skipped",
                        })
                  }
                  className={cn(
                    "w-7 h-7 rounded-full flex items-center justify-center transition-colors",
                    skipped
                      ? "bg-danger text-bg"
                      : "bg-elevated text-fg-muted hover:bg-line"
                  )}
                  title={skipped ? "Skipped — tap to undo" : "Mark skipped"}
                >
                  <X size={15} />
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
