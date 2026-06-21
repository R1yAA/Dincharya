"use client";

import { useState, useEffect } from "react";
import { Sheet } from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Chip } from "@/components/ui/chip";
import { Supplement, SupplementSchedule } from "@/lib/supabase/types";
import { todayStr } from "@/lib/format";
import { Plus, X } from "lucide-react";

const SCHEDULES: { id: SupplementSchedule; label: string }[] = [
  { id: "daily", label: "Every day" },
  { id: "alternate", label: "Every other day" },
  { id: "weekly", label: "Specific days" },
];

const DOW = [
  { v: 1, l: "Mon" },
  { v: 2, l: "Tue" },
  { v: 3, l: "Wed" },
  { v: 4, l: "Thu" },
  { v: 5, l: "Fri" },
  { v: 6, l: "Sat" },
  { v: 0, l: "Sun" },
];

interface SupplementFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (s: Partial<Supplement> & { name: string }) => void;
  initial?: Supplement | null;
}

export function SupplementForm({
  open,
  onOpenChange,
  onSave,
  initial,
}: SupplementFormProps) {
  const [name, setName] = useState("");
  const [schedule, setSchedule] = useState<SupplementSchedule>("daily");
  const [days, setDays] = useState<number[]>([]);
  const [times, setTimes] = useState<string[]>([]);
  const [active, setActive] = useState(true);

  useEffect(() => {
    if (open && initial) {
      setName(initial.name);
      setSchedule(initial.schedule);
      setDays(initial.days_of_week || []);
      setTimes((initial.times || []).map((t) => t.slice(0, 5)));
      setActive(initial.active);
    } else if (open) {
      setName("");
      setSchedule("daily");
      setDays([]);
      setTimes([]);
      setActive(true);
    }
  }, [open, initial]);

  const toggleDay = (v: number) =>
    setDays((p) => (p.includes(v) ? p.filter((d) => d !== v) : [...p, v]));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    onSave({
      ...(initial?.id ? { id: initial.id } : {}),
      name: name.trim(),
      schedule,
      days_of_week: schedule === "weekly" ? days : [],
      times: times.filter(Boolean).map((t) => `${t}:00`),
      active,
      ...(initial ? {} : { anchor_date: todayStr() }),
    });
    onOpenChange(false);
  };

  return (
    <Sheet
      open={open}
      onOpenChange={onOpenChange}
      title={initial ? "Edit supplement" : "Add supplement"}
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <Input
          id="supp-name"
          label="Name"
          placeholder="e.g. Vitamin D, Gut restore..."
          value={name}
          onChange={(e) => setName(e.target.value)}
          autoFocus
        />

        <div className="flex flex-col gap-2">
          <label className="text-sm text-fg-muted">Schedule</label>
          <div className="flex flex-wrap gap-2">
            {SCHEDULES.map((s) => (
              <Chip
                key={s.id}
                selected={schedule === s.id}
                onClick={() => setSchedule(s.id)}
              >
                {s.label}
              </Chip>
            ))}
          </div>
        </div>

        {schedule === "weekly" && (
          <div className="flex flex-wrap gap-2">
            {DOW.map((d) => (
              <Chip
                key={d.v}
                selected={days.includes(d.v)}
                onClick={() => toggleDay(d.v)}
              >
                {d.l}
              </Chip>
            ))}
          </div>
        )}

        <div className="flex flex-col gap-2">
          <label className="text-sm text-fg-muted">Times to take</label>
          {times.map((t, i) => (
            <div key={i} className="flex items-center gap-2">
              <Input
                id={`supp-time-${i}`}
                type="time"
                value={t}
                onChange={(e) =>
                  setTimes((p) => p.map((x, j) => (j === i ? e.target.value : x)))
                }
                className="flex-1"
              />
              <button
                type="button"
                onClick={() => setTimes((p) => p.filter((_, j) => j !== i))}
                className="p-2 text-fg-dim hover:text-danger"
              >
                <X size={16} />
              </button>
            </div>
          ))}
          <button
            type="button"
            onClick={() => setTimes((p) => [...p, "09:00"])}
            className="inline-flex items-center gap-1 text-sm text-brand self-start"
          >
            <Plus size={14} /> Add time
          </button>
        </div>

        {initial && (
          <Chip selected={active} onClick={() => setActive(!active)}>
            {active ? "Active" : "Paused"}
          </Chip>
        )}

        <Button type="submit" disabled={!name.trim()}>
          {initial ? "Update" : "Save"}
        </Button>
      </form>
    </Sheet>
  );
}
