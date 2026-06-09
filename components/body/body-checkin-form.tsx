"use client";

import { useState, useEffect } from "react";
import { Sheet } from "@/components/ui/sheet";
import { Input, Textarea } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { RatingDots } from "@/components/ui/rating-dots";
import { todayStr } from "@/lib/format";
import { BodyCheckin } from "@/lib/supabase/types";

interface BodyCheckinFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (checkin: Partial<BodyCheckin> & { date: string }) => void;
  initial?: BodyCheckin | null;
}

const METRICS = [
  { key: "energy", label: "Energy", labels: ["😴", "Low", "Mid", "Good", "⚡"] },
  { key: "mood", label: "Mood", labels: ["😢", "Low", "Okay", "Good", "😄"] },
  { key: "skin", label: "Skin", labels: ["Broken out", "", "", "", "Clear"] },
  { key: "digestion", label: "Digestion", labels: ["Bad", "", "", "", "Good"] },
  { key: "bloating", label: "Bloating", labels: ["None", "", "", "", "Very"] },
] as const;

export function BodyCheckinForm({
  open,
  onOpenChange,
  onSave,
  initial,
}: BodyCheckinFormProps) {
  const [date, setDate] = useState(todayStr());
  const [weight, setWeight] = useState("");
  const [metrics, setMetrics] = useState<Record<string, number | null>>({
    energy: null, mood: null, skin: null, digestion: null, bloating: null,
  });
  const [note, setNote] = useState("");

  useEffect(() => {
    if (open && initial) {
      setDate(initial.date);
      setWeight(initial.weight_kg?.toString() || "");
      setMetrics({
        energy: initial.energy,
        mood: initial.mood,
        skin: initial.skin,
        digestion: initial.digestion,
        bloating: initial.bloating,
      });
      setNote(initial.note || "");
    } else if (open) {
      setDate(todayStr());
      setWeight("");
      setMetrics({ energy: null, mood: null, skin: null, digestion: null, bloating: null });
      setNote("");
    }
  }, [open, initial]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      ...(initial?.id ? { id: initial.id } : {}),
      date,
      weight_kg: weight ? parseFloat(weight) : null,
      energy: metrics.energy,
      mood: metrics.mood,
      skin: metrics.skin,
      digestion: metrics.digestion,
      bloating: metrics.bloating,
      note: note || null,
    });
    onOpenChange(false);
  };

  return (
    <Sheet
      open={open}
      onOpenChange={onOpenChange}
      title={initial ? "Edit check-in" : "Body check-in"}
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <Input
          id="body-date"
          label="Date"
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
        />
        <Input
          id="body-weight"
          label="Weight (kg)"
          type="number"
          step="0.1"
          placeholder="e.g. 58.5"
          value={weight}
          onChange={(e) => setWeight(e.target.value)}
        />

        {METRICS.map((m) => (
          <div key={m.key} className="flex items-center justify-between">
            <span className="text-sm text-fg">{m.label}</span>
            <RatingDots
              value={metrics[m.key]}
              onChange={(v) =>
                setMetrics((prev) => ({ ...prev, [m.key]: v }))
              }
              labels={[...m.labels]}
            />
          </div>
        ))}

        <Textarea
          id="body-note"
          label="Note"
          placeholder="How are you feeling?"
          value={note}
          onChange={(e) => setNote(e.target.value)}
        />

        <Button type="submit">Save</Button>
      </form>
    </Sheet>
  );
}
