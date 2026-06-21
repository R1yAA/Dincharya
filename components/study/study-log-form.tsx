"use client";

import { useState, useEffect, useMemo } from "react";
import { Sheet } from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Chip } from "@/components/ui/chip";
import { StudyTask, StudyTopic } from "@/lib/supabase/types";
import { BLOCK_MIN } from "@/lib/study";
import { todayStr } from "@/lib/format";
import { Brain } from "lucide-react";
import { cn } from "@/lib/utils";

const QUICK_MIN = [25, 50, 90];

export interface StudyLogData {
  existingTaskId: string | null;
  topicName: string;
  taskTitle: string;
  estimate_blocks: number;
  recall_enabled: boolean;
  minutes: number;
  date: string;
  note: string | null;
}

interface StudyLogFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  topics: StudyTopic[];
  tasks: StudyTask[];
  defaultDate?: string;
  onSave: (data: StudyLogData) => void;
}

/** Fast capture: pick or create a topic + task inline, then log minutes against it. */
export function StudyLogForm({
  open,
  onOpenChange,
  topics,
  tasks,
  defaultDate,
  onSave,
}: StudyLogFormProps) {
  const [topicName, setTopicName] = useState("");
  const [taskTitle, setTaskTitle] = useState("");
  const [existingTaskId, setExistingTaskId] = useState<string | null>(null);
  const [blocks, setBlocks] = useState(1);
  const [recall, setRecall] = useState(false);
  const [minutes, setMinutes] = useState("50");
  const [date, setDate] = useState(todayStr());

  useEffect(() => {
    if (open) {
      setTopicName("");
      setTaskTitle("");
      setExistingTaskId(null);
      setBlocks(1);
      setRecall(false);
      setMinutes("50");
      setDate(defaultDate || todayStr());
    }
  }, [open, defaultDate]);

  const topicByName = useMemo(() => {
    const m = new Map<string, StudyTopic>();
    topics.forEach((t) => m.set(t.name.toLowerCase(), t));
    return m;
  }, [topics]);

  const topicSuggestions = topics
    .filter((t) => !t.archived)
    .filter(
      (t) =>
        t.name.toLowerCase().includes(topicName.toLowerCase()) &&
        t.name !== topicName
    )
    .slice(0, 6);

  const matchedTopic = topicByName.get(topicName.trim().toLowerCase());

  const taskSuggestions = useMemo(() => {
    if (!matchedTopic) return [];
    return tasks
      .filter((t) => t.topic_id === matchedTopic.id && t.status === "todo")
      .filter(
        (t) =>
          t.title.toLowerCase().includes(taskTitle.toLowerCase()) &&
          t.id !== existingTaskId
      )
      .slice(0, 6);
  }, [tasks, matchedTopic, taskTitle, existingTaskId]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const m = parseInt(minutes);
    if (!topicName.trim() || !taskTitle.trim() || !m || m <= 0) return;
    onSave({
      existingTaskId,
      topicName: topicName.trim(),
      taskTitle: taskTitle.trim(),
      estimate_blocks: blocks,
      recall_enabled: recall,
      minutes: m,
      date,
      note: null,
    });
    onOpenChange(false);
  };

  const isNewTask = !existingTaskId;

  return (
    <Sheet open={open} onOpenChange={onOpenChange} title="Log study session">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="flex flex-col gap-2">
          <Input
            id="log-topic"
            label="Topic"
            placeholder="e.g. DSA, HLD..."
            value={topicName}
            onChange={(e) => {
              setTopicName(e.target.value);
              setExistingTaskId(null);
            }}
            autoFocus
          />
          {topicSuggestions.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {topicSuggestions.map((t) => (
                <Chip key={t.id} onClick={() => setTopicName(t.name)}>
                  {t.name}
                </Chip>
              ))}
            </div>
          )}
        </div>

        <div className="flex flex-col gap-2">
          <Input
            id="log-task"
            label="Task"
            placeholder="e.g. Sorting algorithms..."
            value={taskTitle}
            onChange={(e) => {
              setTaskTitle(e.target.value);
              setExistingTaskId(null);
            }}
          />
          {taskSuggestions.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {taskSuggestions.map((t) => (
                <Chip
                  key={t.id}
                  onClick={() => {
                    setTaskTitle(t.title);
                    setExistingTaskId(t.id);
                  }}
                >
                  {t.title}
                </Chip>
              ))}
            </div>
          )}
        </div>

        {isNewTask && taskTitle.trim() && (
          <div className="flex flex-col gap-3 rounded-xl border border-line p-3">
            <span className="text-xs text-fg-dim">New task</span>
            <div className="flex items-center justify-between">
              <span className="text-sm text-fg">
                Estimate · ~{blocks * BLOCK_MIN} min
              </span>
              <div className="flex items-center gap-2">
                {[1, 2, 3, 4].map((b) => (
                  <Chip key={b} selected={blocks === b} onClick={() => setBlocks(b)}>
                    {b}
                  </Chip>
                ))}
              </div>
            </div>
            <button
              type="button"
              onClick={() => setRecall((r) => !r)}
              className={cn(
                "flex items-center gap-2 text-sm",
                recall ? "text-violet" : "text-fg-muted"
              )}
            >
              <Brain size={15} /> Spaced recall {recall ? "on" : "off"}
            </button>
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
            id="log-min"
            label="Minutes"
            type="number"
            value={minutes}
            onChange={(e) => setMinutes(e.target.value)}
            className="flex-1"
          />
          <Input
            id="log-date"
            label="Date"
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="flex-1"
          />
        </div>

        <Button
          type="submit"
          disabled={!topicName.trim() || !taskTitle.trim() || !parseInt(minutes)}
        >
          Log session
        </Button>
      </form>
    </Sheet>
  );
}
