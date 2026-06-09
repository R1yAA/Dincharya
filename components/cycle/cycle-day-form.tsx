"use client";

import { useState, useEffect } from "react";
import { Sheet } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Chip } from "@/components/ui/chip";
import { Textarea } from "@/components/ui/input";
import { CYCLE_SYMPTOMS, FLOW_OPTIONS } from "@/lib/categories/symptoms";
import { formatDate } from "@/lib/format";
import { CycleDay } from "@/lib/supabase/types";

interface CycleDayFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  date: string;
  existing?: CycleDay | null;
  onSave: (day: Partial<CycleDay> & { date: string }) => void;
  onRemove: (date: string) => void;
}

export function CycleDayForm({
  open,
  onOpenChange,
  date,
  existing,
  onSave,
  onRemove,
}: CycleDayFormProps) {
  const [isPeriod, setIsPeriod] = useState(true);
  const [flow, setFlow] = useState<string | null>(null);
  const [symptoms, setSymptoms] = useState<string[]>([]);
  const [note, setNote] = useState("");

  useEffect(() => {
    if (open && existing) {
      setIsPeriod(existing.is_period);
      setFlow(existing.flow);
      setSymptoms(existing.symptoms || []);
      setNote(existing.note || "");
    } else if (open) {
      setIsPeriod(true);
      setFlow(null);
      setSymptoms([]);
      setNote("");
    }
  }, [open, existing]);

  const toggleSymptom = (s: string) => {
    setSymptoms((prev) =>
      prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]
    );
  };

  return (
    <Sheet
      open={open}
      onOpenChange={onOpenChange}
      title={`Log ${formatDate(date)}`}
    >
      <div className="flex flex-col gap-4">
        <div className="flex gap-2">
          <Chip selected={isPeriod} onClick={() => setIsPeriod(true)}>
            🩸 Period day
          </Chip>
          <Chip selected={!isPeriod} onClick={() => setIsPeriod(false)}>
            Symptoms only
          </Chip>
        </div>

        {isPeriod && (
          <div className="flex flex-col gap-2">
            <label className="text-sm text-fg-muted">Flow</label>
            <div className="flex gap-2">
              {FLOW_OPTIONS.map((f) => (
                <Chip
                  key={f}
                  selected={flow === f}
                  onClick={() => setFlow(flow === f ? null : f)}
                >
                  {f.charAt(0).toUpperCase() + f.slice(1)}
                </Chip>
              ))}
            </div>
          </div>
        )}

        <div className="flex flex-col gap-2">
          <label className="text-sm text-fg-muted">Symptoms</label>
          <div className="flex flex-wrap gap-2">
            {CYCLE_SYMPTOMS.map((s) => (
              <Chip
                key={s}
                selected={symptoms.includes(s)}
                onClick={() => toggleSymptom(s)}
              >
                {s.charAt(0).toUpperCase() + s.slice(1)}
              </Chip>
            ))}
          </div>
        </div>

        <Textarea
          id="cycle-note"
          label="Note"
          placeholder="Anything to note..."
          value={note}
          onChange={(e) => setNote(e.target.value)}
        />

        <Button
          onClick={() => {
            onSave({
              date,
              is_period: isPeriod,
              flow: isPeriod ? flow : null,
              symptoms,
              note: note || null,
            });
            onOpenChange(false);
          }}
        >
          Save
        </Button>

        {existing && (
          <Button
            variant="danger"
            onClick={() => {
              onRemove(date);
              onOpenChange(false);
            }}
          >
            Remove this day
          </Button>
        )}
      </div>
    </Sheet>
  );
}
