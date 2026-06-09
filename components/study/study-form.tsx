"use client";

import { useState, useEffect } from "react";
import { Sheet } from "@/components/ui/sheet";
import { Input, Textarea } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { RatingDots } from "@/components/ui/rating-dots";
import { todayStr } from "@/lib/format";
import { StudyLog } from "@/lib/supabase/types";

interface StudyFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (log: Partial<StudyLog> & { subject: string }) => void;
  initial?: StudyLog | null;
  subjects: string[];
}

export function StudyForm({
  open,
  onOpenChange,
  onSave,
  initial,
  subjects,
}: StudyFormProps) {
  const [subject, setSubject] = useState("");
  const [topic, setTopic] = useState("");
  const [duration, setDuration] = useState("");
  const [confidence, setConfidence] = useState<number | null>(null);
  const [date, setDate] = useState(todayStr());
  const [note, setNote] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);

  useEffect(() => {
    if (open && initial) {
      setSubject(initial.subject);
      setTopic(initial.topic || "");
      setDuration(initial.duration_min?.toString() || "");
      setConfidence(initial.confidence);
      setDate(initial.date);
      setNote(initial.note || "");
    } else if (open) {
      setSubject("");
      setTopic("");
      setDuration("");
      setConfidence(null);
      setDate(todayStr());
      setNote("");
    }
  }, [open, initial]);

  const filtered = subjects.filter(
    (s) => s.toLowerCase().includes(subject.toLowerCase()) && s !== subject
  );

  return (
    <Sheet
      open={open}
      onOpenChange={onOpenChange}
      title={initial ? "Edit study entry" : "Log study session"}
    >
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (!subject.trim()) return;
          onSave({
            ...(initial?.id ? { id: initial.id } : {}),
            subject: subject.trim(),
            topic: topic || null,
            duration_min: duration ? parseInt(duration) : null,
            confidence,
            date,
            note: note || null,
          });
          onOpenChange(false);
        }}
        className="flex flex-col gap-4"
      >
        <div className="relative">
          <Input
            id="study-subject"
            label="Subject"
            placeholder="e.g. Mathematics, Physics..."
            value={subject}
            onChange={(e) => {
              setSubject(e.target.value);
              setShowSuggestions(true);
            }}
            onFocus={() => setShowSuggestions(true)}
            autoFocus
          />
          {showSuggestions && filtered.length > 0 && (
            <div className="absolute top-full left-0 right-0 z-10 mt-1 bg-elevated border border-line rounded-lg overflow-hidden">
              {filtered.slice(0, 5).map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => {
                    setSubject(s);
                    setShowSuggestions(false);
                  }}
                  className="w-full text-left px-3 py-2 text-sm text-fg hover:bg-line"
                >
                  {s}
                </button>
              ))}
            </div>
          )}
        </div>

        <Input
          id="study-topic"
          label="Topic"
          placeholder="e.g. Integrals, Kinematics..."
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
        />

        <div className="flex gap-3">
          <Input
            id="study-duration"
            label="Duration (min)"
            type="number"
            placeholder="45"
            value={duration}
            onChange={(e) => setDuration(e.target.value)}
            className="flex-1"
          />
          <Input
            id="study-date"
            label="Date"
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="flex-1"
          />
        </div>

        <div className="flex items-center justify-between">
          <span className="text-sm text-fg">Confidence</span>
          <RatingDots
            value={confidence}
            onChange={setConfidence}
            color="bg-violet"
            labels={["Lost", "Shaky", "Okay", "Good", "Nailed it"]}
          />
        </div>

        <Textarea
          id="study-note"
          label="Note"
          placeholder="Key takeaways..."
          value={note}
          onChange={(e) => setNote(e.target.value)}
        />

        <Button type="submit" disabled={!subject.trim()}>
          Save
        </Button>
      </form>
    </Sheet>
  );
}
