"use client";

import { useState, useEffect } from "react";
import { Sheet } from "@/components/ui/sheet";
import { Input, Textarea } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Chip } from "@/components/ui/chip";
import { StudyTask } from "@/lib/supabase/types";
import { todayStr } from "@/lib/format";

const QUICK_MIN = [25, 50, 90];

export interface SessionFormData {
  minutes: number;
  date: string;
  note: string | null;
}

interface SessionFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  task: StudyTask | null;
  defaultDate?: string;
  defaultMinutes?: number;
  title?: string;
  submitLabel?: string;
  onSave: (data: SessionFormData) => void;
}

export function SessionForm({
  open,
  onOpenChange,
  task,
  defaultDate,
  defaultMinutes = 50,
  title = "Log study time",
  submitLabel = "Log session",
  onSave,
}: SessionFormProps) {
  const [minutes, setMinutes] = useState(String(defaultMinutes));
  const [date, setDate] = useState(todayStr());
  const [note, setNote] = useState("");

  useEffect(() => {
    if (open) {
      setMinutes(String(defaultMinutes));
      setDate(defaultDate || todayStr());
      setNote("");
    }
  }, [open, defaultDate, defaultMinutes, task]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const m = parseInt(minutes);
    if (!m || m <= 0) return;
    onSave({ minutes: m, date, note: note || null });
    onOpenChange(false);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange} title={title}>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        {task && (
          <div className="rounded-xl bg-elevated px-3 py-2">
            <div className="text-sm text-fg font-medium">{task.title}</div>
          </div>
        )}

        <div className="flex flex-wrap gap-2">
          {QUICK_MIN.map((m) => (
            <Chip
              key={m}
              selected={minutes === String(m)}
              onClick={() => setMinutes(String(m))}
            >
              {m} min
            </Chip>
          ))}
        </div>

        <div className="flex gap-3">
          <Input
            id="session-min"
            label="Minutes"
            type="number"
            value={minutes}
            onChange={(e) => setMinutes(e.target.value)}
            className="flex-1"
          />
          <Input
            id="session-date"
            label="Date"
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="flex-1"
          />
        </div>

        <Textarea
          id="session-note"
          label="Note"
          placeholder="What did you cover?"
          value={note}
          onChange={(e) => setNote(e.target.value)}
        />

        <Button type="submit" disabled={!parseInt(minutes)}>
          {submitLabel}
        </Button>
      </form>
    </Sheet>
  );
}
