"use client";

import { useState, useEffect } from "react";
import { Sheet } from "@/components/ui/sheet";
import { Input, Textarea } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Chip } from "@/components/ui/chip";
import { RatingDots } from "@/components/ui/rating-dots";
import { todayStr } from "@/lib/format";
import { HairLog } from "@/lib/supabase/types";

interface HairFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (log: Partial<HairLog> & { date: string }) => void;
  initial?: HairLog | null;
}

export function HairForm({ open, onOpenChange, onSave, initial }: HairFormProps) {
  const [date, setDate] = useState(todayStr());
  const [washed, setWashed] = useState(false);
  const [shedding, setShedding] = useState<number | null>(null);
  const [scalp, setScalp] = useState<number | null>(null);
  const [condition, setCondition] = useState<number | null>(null);
  const [routine, setRoutine] = useState("");
  const [note, setNote] = useState("");

  useEffect(() => {
    if (open && initial) {
      setDate(initial.date);
      setWashed(initial.washed);
      setShedding(initial.shedding);
      setScalp(initial.scalp);
      setCondition(initial.condition);
      setRoutine(initial.routine || "");
      setNote(initial.note || "");
    } else if (open) {
      setDate(todayStr());
      setWashed(false);
      setShedding(null);
      setScalp(null);
      setCondition(null);
      setRoutine("");
      setNote("");
    }
  }, [open, initial]);

  return (
    <Sheet
      open={open}
      onOpenChange={onOpenChange}
      title={initial ? "Edit hair log" : "Hair check-in"}
    >
      <form
        onSubmit={(e) => {
          e.preventDefault();
          onSave({
            ...(initial?.id ? { id: initial.id } : {}),
            date,
            washed,
            shedding,
            scalp,
            condition,
            routine: routine || null,
            note: note || null,
          });
          onOpenChange(false);
        }}
        className="flex flex-col gap-4"
      >
        <Input
          id="hair-date"
          label="Date"
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
        />

        <div className="flex items-center justify-between">
          <span className="text-sm text-fg">Washed today?</span>
          <div className="flex gap-2">
            <Chip selected={washed} onClick={() => setWashed(true)}>Yes</Chip>
            <Chip selected={!washed} onClick={() => setWashed(false)}>No</Chip>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-sm text-fg">Shedding</span>
          <RatingDots
            value={shedding}
            onChange={setShedding}
            color="bg-amber"
            labels={["None", "Minimal", "Some", "Noticeable", "Heavy"]}
          />
        </div>

        <div className="flex items-center justify-between">
          <span className="text-sm text-fg">Scalp</span>
          <RatingDots
            value={scalp}
            onChange={setScalp}
            color="bg-amber"
            labels={["Oily", "", "Normal", "", "Dry"]}
          />
        </div>

        <div className="flex items-center justify-between">
          <span className="text-sm text-fg">Condition</span>
          <RatingDots
            value={condition}
            onChange={setCondition}
            color="bg-amber"
            labels={["Limp", "", "Okay", "", "Great"]}
          />
        </div>

        <Input
          id="hair-routine"
          label="Products / routine"
          placeholder="e.g. Oiling, new shampoo..."
          value={routine}
          onChange={(e) => setRoutine(e.target.value)}
        />

        <Textarea
          id="hair-note"
          label="Note"
          placeholder="How's your hair?"
          value={note}
          onChange={(e) => setNote(e.target.value)}
        />

        <Button type="submit">Save</Button>
      </form>
    </Sheet>
  );
}
