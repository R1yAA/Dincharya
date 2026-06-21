"use client";

import { useState, useEffect } from "react";
import { Sheet } from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Chip } from "@/components/ui/chip";
import { StudyTask, StudyTopic } from "@/lib/supabase/types";
import { BLOCK_MIN } from "@/lib/study";
import { Minus, Plus, Brain } from "lucide-react";
import { cn } from "@/lib/utils";

export interface TaskFormData {
  id?: string;
  topicName: string;
  title: string;
  estimate_blocks: number;
  recall_enabled: boolean;
}

interface TaskFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  topics: StudyTopic[];
  initial?: StudyTask | null;
  /** topic name for the task being edited */
  initialTopicName?: string;
  onSave: (data: TaskFormData) => void;
}

export function TaskForm({
  open,
  onOpenChange,
  topics,
  initial,
  initialTopicName,
  onSave,
}: TaskFormProps) {
  const [topicName, setTopicName] = useState("");
  const [title, setTitle] = useState("");
  const [blocks, setBlocks] = useState(1);
  const [recall, setRecall] = useState(false);

  useEffect(() => {
    if (open && initial) {
      setTopicName(initialTopicName || "");
      setTitle(initial.title);
      setBlocks(initial.estimate_blocks);
      setRecall(initial.recall_enabled);
    } else if (open) {
      setTopicName("");
      setTitle("");
      setBlocks(1);
      setRecall(false);
    }
  }, [open, initial, initialTopicName]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!topicName.trim() || !title.trim()) return;
    onSave({
      ...(initial?.id ? { id: initial.id } : {}),
      topicName: topicName.trim(),
      title: title.trim(),
      estimate_blocks: blocks,
      recall_enabled: recall,
    });
    onOpenChange(false);
  };

  const suggestions = topics
    .filter((t) => !t.archived)
    .filter(
      (t) =>
        t.name.toLowerCase().includes(topicName.toLowerCase()) &&
        t.name !== topicName
    )
    .slice(0, 6);

  return (
    <Sheet
      open={open}
      onOpenChange={onOpenChange}
      title={initial ? "Edit task" : "New task"}
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="flex flex-col gap-2">
          <Input
            id="task-topic"
            label="Topic"
            placeholder="e.g. DSA, HLD, System Design..."
            value={topicName}
            onChange={(e) => setTopicName(e.target.value)}
            autoFocus
          />
          {suggestions.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {suggestions.map((t) => (
                <Chip key={t.id} onClick={() => setTopicName(t.name)}>
                  {t.name}
                </Chip>
              ))}
            </div>
          )}
        </div>

        <Input
          id="task-title"
          label="Task"
          placeholder="e.g. Sorting algorithms, a specific HLD problem..."
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />

        <div className="flex items-center justify-between">
          <div className="flex flex-col">
            <span className="text-sm text-fg">Estimate</span>
            <span className="text-xs text-fg-dim">
              {blocks} block{blocks !== 1 ? "s" : ""} · ~{blocks * BLOCK_MIN} min
            </span>
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setBlocks((b) => Math.max(1, b - 1))}
              className="w-8 h-8 rounded-full bg-elevated text-fg flex items-center justify-center hover:bg-line"
            >
              <Minus size={16} />
            </button>
            <span className="w-6 text-center text-fg font-medium">{blocks}</span>
            <button
              type="button"
              onClick={() => setBlocks((b) => Math.min(20, b + 1))}
              className="w-8 h-8 rounded-full bg-elevated text-fg flex items-center justify-center hover:bg-line"
            >
              <Plus size={16} />
            </button>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setRecall((r) => !r)}
          className={cn(
            "flex items-center gap-2 px-3 py-2.5 rounded-xl border text-sm text-left transition-colors",
            recall
              ? "border-violet bg-violet/10 text-fg"
              : "border-line text-fg-muted hover:border-fg-dim"
          )}
        >
          <Brain size={16} className={recall ? "text-violet" : "text-fg-dim"} />
          <div className="flex-1">
            <div className="font-medium">Spaced recall</div>
            <div className="text-xs text-fg-dim">
              Schedule reviews after this task is completed
            </div>
          </div>
          <span
            className={cn(
              "w-9 h-5 rounded-full p-0.5 transition-colors",
              recall ? "bg-violet" : "bg-elevated"
            )}
          >
            <span
              className={cn(
                "block w-4 h-4 rounded-full bg-white transition-transform",
                recall && "translate-x-4"
              )}
            />
          </span>
        </button>

        <Button type="submit" disabled={!topicName.trim() || !title.trim()}>
          {initial ? "Update task" : "Add task"}
        </Button>
      </form>
    </Sheet>
  );
}
