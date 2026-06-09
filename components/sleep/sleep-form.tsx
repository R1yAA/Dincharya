"use client";

import { useState, useEffect } from "react";
import { Sheet } from "@/components/ui/sheet";
import { Input, Textarea } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { RatingDots } from "@/components/ui/rating-dots";
import { Chip } from "@/components/ui/chip";
import { SLEEP_TAGS } from "@/lib/categories/sleepTags";
import { todayStr, hoursFromTimes } from "@/lib/format";
import { SleepLog } from "@/lib/supabase/types";

interface SleepFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (log: Partial<SleepLog> & { date: string }) => void;
  initial?: SleepLog | null;
}

export function SleepForm({ open, onOpenChange, onSave, initial }: SleepFormProps) {
  const [date, setDate] = useState(todayStr());
  const [bedtime, setBedtime] = useState("23:00");
  const [waketime, setWaketime] = useState("07:00");
  const [quality, setQuality] = useState<number | null>(null);
  const [tags, setTags] = useState<string[]>([]);
  const [note, setNote] = useState("");

  useEffect(() => {
    if (open && initial) {
      setDate(initial.date);
      setBedtime(initial.bedtime || "23:00");
      setWaketime(initial.waketime || "07:00");
      setQuality(initial.quality);
      setTags(initial.tags || []);
      setNote(initial.note || "");
    } else if (open) {
      setDate(todayStr());
      setBedtime("23:00");
      setWaketime("07:00");
      setQuality(null);
      setTags([]);
      setNote("");
    }
  }, [open, initial]);

  const hours = hoursFromTimes(bedtime, waketime);

  const toggleTag = (id: string) => {
    setTags((prev) =>
      prev.includes(id) ? prev.filter((t) => t !== id) : [...prev, id]
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      ...(initial?.id ? { id: initial.id } : {}),
      date,
      bedtime: bedtime || null,
      waketime: waketime || null,
      hours: hours,
      quality,
      tags,
      note: note || null,
    });
    onOpenChange(false);
  };

  return (
    <Sheet
      open={open}
      onOpenChange={onOpenChange}
      title={initial ? "Edit sleep" : "Log sleep"}
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <Input
          id="sleep-date"
          label="Date (morning you woke)"
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
        />

        <div className="flex gap-3">
          <Input
            id="sleep-bed"
            label="Bedtime"
            type="time"
            value={bedtime}
            onChange={(e) => setBedtime(e.target.value)}
            className="flex-1"
          />
          <Input
            id="sleep-wake"
            label="Wake time"
            type="time"
            value={waketime}
            onChange={(e) => setWaketime(e.target.value)}
            className="flex-1"
          />
        </div>

        {hours !== null && (
          <div className="text-sm text-fg-muted">
            ≈ {hours.toFixed(1)} hours
          </div>
        )}

        <div className="flex items-center justify-between">
          <span className="text-sm text-fg">Sleep quality</span>
          <RatingDots
            value={quality}
            onChange={setQuality}
            color="bg-accent2"
            labels={["Poor", "Light", "Fair", "Good", "Deep"]}
          />
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-sm text-fg-muted">Tags</label>
          <div className="flex flex-wrap gap-2">
            {SLEEP_TAGS.map((t) => (
              <Chip
                key={t.id}
                selected={tags.includes(t.id)}
                onClick={() => toggleTag(t.id)}
              >
                {t.label}
              </Chip>
            ))}
          </div>
        </div>

        <Textarea
          id="sleep-note"
          label="Note"
          placeholder="How did you sleep?"
          value={note}
          onChange={(e) => setNote(e.target.value)}
        />

        <Button type="submit">Save</Button>
      </form>
    </Sheet>
  );
}
