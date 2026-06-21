"use client";

import { useState, useMemo } from "react";
import {
  Check,
  RotateCcw,
  Trash2,
  Pencil,
  Clock,
  Brain,
  Plus,
} from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Fab } from "@/components/layout/fab";
import { Card } from "@/components/ui/card";
import { Chip } from "@/components/ui/chip";
import { EmptyState } from "@/components/ui/empty-state";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { TaskForm, TaskFormData } from "@/components/study/task-form";
import { SessionForm, SessionFormData } from "@/components/study/session-form";
import { StudyStats } from "@/components/study/study-stats";
import { useStudyTopics, useStudyTasks, useStudySessions } from "@/hooks/use-study";
import { useStudyRecall } from "@/hooks/use-recall";
import { useToast } from "@/components/ui/toast";
import { StudyTask, StudyRecall } from "@/lib/supabase/types";
import { BLOCK_MIN, reviewLabel } from "@/lib/study";
import { todayStr, daysBetween } from "@/lib/format";
import { cn } from "@/lib/utils";

type View = "tasks" | "review" | "stats";

export default function StudyPage() {
  const [view, setView] = useState<View>("tasks");

  const { topics, ensure: ensureTopic } = useStudyTopics();
  const { tasks, upsert: upsertTask, remove: removeTask } = useStudyTasks();
  const { sessions, add: addSession } = useStudySessions();
  const {
    dueItems,
    upcomingItems,
    dueCount,
    completeTask,
    reopenTask,
    completeReview,
    deferReview,
  } = useStudyRecall();
  const { toast } = useToast();

  const [taskFormOpen, setTaskFormOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<StudyTask | null>(null);
  const [sessionTask, setSessionTask] = useState<StudyTask | null>(null);
  const [reviewing, setReviewing] = useState<StudyRecall | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);

  const topicById = useMemo(
    () => new Map(topics.map((t) => [t.id, t])),
    [topics]
  );
  const taskById = useMemo(() => new Map(tasks.map((t) => [t.id, t])), [tasks]);

  // accrued study minutes per task
  const studyMinByTask = useMemo(() => {
    const m = new Map<string, number>();
    for (const s of sessions) {
      if (s.kind !== "study") continue;
      m.set(s.task_id, (m.get(s.task_id) ?? 0) + s.duration_min);
    }
    return m;
  }, [sessions]);

  // tasks grouped by topic (active topics with at least one task)
  const groups = useMemo(() => {
    const byTopic = new Map<string, StudyTask[]>();
    for (const t of tasks) {
      const arr = byTopic.get(t.topic_id);
      if (arr) arr.push(t);
      else byTopic.set(t.topic_id, [t]);
    }
    return [...byTopic.entries()]
      .map(([topicId, list]) => ({
        topic: topicById.get(topicId),
        todo: list.filter((t) => t.status === "todo"),
        done: list.filter((t) => t.status === "done"),
      }))
      .filter((g) => g.topic)
      .sort((a, b) => a.topic!.name.localeCompare(b.topic!.name));
  }, [tasks, topicById]);

  const handleTaskSave = async (data: TaskFormData) => {
    const topic = await ensureTopic.mutateAsync(data.topicName);
    await upsertTask.mutateAsync({
      ...(data.id ? { id: data.id } : {}),
      topic_id: topic.id,
      title: data.title,
      estimate_blocks: data.estimate_blocks,
      recall_enabled: data.recall_enabled,
    });
    toast(data.id ? "Task updated" : "Task added");
  };

  const handleSessionSave = (d: SessionFormData) => {
    if (!sessionTask) return;
    addSession.mutate(
      {
        task_id: sessionTask.id,
        duration_min: d.minutes,
        date: d.date,
        note: d.note,
        kind: "study",
      },
      { onSuccess: () => toast("Session logged") }
    );
  };

  const handleReviewSave = (d: SessionFormData) => {
    if (!reviewing) return;
    completeReview.mutate(
      { recall: reviewing, minutes: d.minutes },
      { onSuccess: () => toast("Review done") }
    );
  };

  return (
    <>
      <PageHeader title="Study">
        <div className="flex gap-1">
          <Chip selected={view === "tasks"} onClick={() => setView("tasks")}>
            Tasks
          </Chip>
          <Chip selected={view === "review"} onClick={() => setView("review")}>
            Review{dueCount > 0 && ` (${dueCount})`}
          </Chip>
          <Chip selected={view === "stats"} onClick={() => setView("stats")}>
            Stats
          </Chip>
        </div>
      </PageHeader>

      <div className="px-4 py-4 flex flex-col gap-4">
        {/* ===== TASKS ===== */}
        {view === "tasks" &&
          (groups.length === 0 ? (
            <EmptyState
              emoji="📚"
              message="No tasks yet. Tap + to add your first study task."
            />
          ) : (
            groups.map((g) => (
              <div key={g.topic!.id}>
                <h3 className="text-xs font-medium text-fg-muted px-1 mb-1">
                  {g.topic!.name}
                </h3>
                <Card className="p-0 overflow-hidden">
                  {[...g.todo, ...g.done].map((task) => (
                    <TaskRow
                      key={task.id}
                      task={task}
                      accruedMin={studyMinByTask.get(task.id) ?? 0}
                      onLog={() => setSessionTask(task)}
                      onComplete={() =>
                        completeTask.mutate(task, {
                          onSuccess: () =>
                            toast(
                              task.recall_enabled
                                ? "Done · recall scheduled"
                                : "Task completed"
                            ),
                        })
                      }
                      onReopen={() => reopenTask.mutate(task)}
                      onEdit={() => {
                        setEditingTask(task);
                        setTaskFormOpen(true);
                      }}
                      onDelete={() => setDeleting(task.id)}
                    />
                  ))}
                </Card>
              </div>
            ))
          ))}

        {/* ===== REVIEW ===== */}
        {view === "review" && (
          <>
            {dueItems.length === 0 ? (
              <EmptyState
                emoji="🧠"
                message="No reviews due. Complete recall-flagged tasks to build your schedule."
              />
            ) : (
              <div>
                <h3 className="text-xs font-medium text-fg-muted px-1 mb-1">
                  Due now ({dueItems.length})
                </h3>
                <Card className="p-0 overflow-hidden">
                  {dueItems.map((r) => (
                    <ReviewRow
                      key={r.id}
                      recall={r}
                      title={
                        taskById.get(r.task_id)?.title ?? "(deleted task)"
                      }
                      topic={
                        topicById.get(taskById.get(r.task_id)?.topic_id ?? "")
                          ?.name
                      }
                      onDone={() => setReviewing(r)}
                      onDefer={(days) =>
                        deferReview.mutate(
                          { recall: r, days },
                          { onSuccess: () => toast(`Pushed ${days}d`) }
                        )
                      }
                    />
                  ))}
                </Card>
              </div>
            )}

            {upcomingItems.length > 0 && (
              <div>
                <h3 className="text-xs font-medium text-fg-muted px-1 mb-1">
                  Upcoming
                </h3>
                <Card className="p-0 overflow-hidden">
                  {upcomingItems.slice(0, 20).map((r) => {
                    const t = taskById.get(r.task_id);
                    return (
                      <div
                        key={r.id}
                        className="flex items-center justify-between px-4 py-3 border-b border-line last:border-0"
                      >
                        <div className="min-w-0">
                          <div className="text-sm text-fg truncate">
                            {t?.title ?? "(deleted task)"}
                          </div>
                          <div className="text-xs text-fg-dim">
                            {topicById.get(t?.topic_id ?? "")?.name}
                          </div>
                        </div>
                        <span className="text-xs text-fg-dim shrink-0">
                          in {daysBetween(todayStr(), r.due_date)}d
                        </span>
                      </div>
                    );
                  })}
                </Card>
              </div>
            )}
          </>
        )}

        {/* ===== STATS ===== */}
        {view === "stats" && (
          <StudyStats topics={topics} tasks={tasks} sessions={sessions} />
        )}
      </div>

      {view === "tasks" && (
        <Fab
          onClick={() => {
            setEditingTask(null);
            setTaskFormOpen(true);
          }}
        />
      )}

      <TaskForm
        open={taskFormOpen}
        onOpenChange={setTaskFormOpen}
        topics={topics}
        initial={editingTask}
        initialTopicName={
          editingTask ? topicById.get(editingTask.topic_id)?.name : undefined
        }
        onSave={handleTaskSave}
      />

      <SessionForm
        open={!!sessionTask}
        onOpenChange={(o) => !o && setSessionTask(null)}
        task={sessionTask}
        onSave={handleSessionSave}
      />

      <SessionForm
        open={!!reviewing}
        onOpenChange={(o) => !o && setReviewing(null)}
        task={reviewing ? taskById.get(reviewing.task_id) ?? null : null}
        title="Complete review"
        submitLabel="Mark reviewed"
        defaultMinutes={10}
        onSave={handleReviewSave}
      />

      <ConfirmDialog
        open={!!deleting}
        onOpenChange={() => setDeleting(null)}
        title="Delete task?"
        description="This task, its sessions and any recall schedule will be removed."
        confirmLabel="Delete"
        onConfirm={() => {
          if (deleting)
            removeTask.mutate(deleting, { onSuccess: () => toast("Deleted") });
        }}
      />
    </>
  );
}

function TaskRow({
  task,
  accruedMin,
  onLog,
  onComplete,
  onReopen,
  onEdit,
  onDelete,
}: {
  task: StudyTask;
  accruedMin: number;
  onLog: () => void;
  onComplete: () => void;
  onReopen: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const done = task.status === "done";
  const estMin = task.estimate_blocks * BLOCK_MIN;

  return (
    <div className="flex items-center gap-3 px-4 py-3 border-b border-line last:border-0">
      <button
        onClick={done ? onReopen : onComplete}
        className={cn(
          "w-6 h-6 rounded-full flex items-center justify-center shrink-0 transition-colors",
          done
            ? "bg-success/20 text-success"
            : "border border-fg-dim text-transparent hover:border-success hover:text-success"
        )}
        title={done ? "Reopen" : "Mark done"}
      >
        <Check size={14} />
      </button>

      <div className="flex-1 min-w-0" onClick={onEdit}>
        <div
          className={cn(
            "text-sm font-medium truncate",
            done ? "text-fg-muted line-through" : "text-fg"
          )}
        >
          {task.title}
        </div>
        <div className="flex items-center gap-2 text-xs text-fg-dim">
          <span className="flex items-center gap-1">
            <Clock size={11} />
            {accruedMin}m / ~{estMin}m
          </span>
          {task.recall_enabled && (
            <span className="flex items-center gap-1 text-violet">
              <Brain size={11} /> recall
            </span>
          )}
        </div>
      </div>

      {!done && (
        <button
          onClick={onLog}
          className="p-1.5 text-fg-dim hover:text-brand shrink-0"
          title="Log time"
        >
          <Plus size={16} />
        </button>
      )}
      {done && (
        <button
          onClick={onReopen}
          className="p-1.5 text-fg-dim hover:text-fg shrink-0"
          title="Reopen"
        >
          <RotateCcw size={14} />
        </button>
      )}
      <button
        onClick={onEdit}
        className="p-1.5 text-fg-dim hover:text-fg shrink-0"
      >
        <Pencil size={14} />
      </button>
      <button
        onClick={onDelete}
        className="p-1.5 text-fg-dim hover:text-danger shrink-0"
      >
        <Trash2 size={14} />
      </button>
    </div>
  );
}

function ReviewRow({
  recall,
  title,
  topic,
  onDone,
  onDefer,
}: {
  recall: StudyRecall;
  title: string;
  topic: string | undefined;
  onDone: () => void;
  onDefer: (days: number) => void;
}) {
  const overdue = daysBetween(recall.due_date, todayStr());

  return (
    <div className="flex items-center gap-3 px-4 py-3 border-b border-line last:border-0">
      <div className="flex-1 min-w-0">
        <div className="text-sm text-fg font-medium truncate">{title}</div>
        <div className="flex items-center gap-2 text-xs text-fg-dim">
          {topic && <span>{topic}</span>}
          <span>· {reviewLabel(recall.step)}</span>
          {overdue > 0 && (
            <span className="text-amber">· {overdue}d overdue</span>
          )}
        </div>
      </div>

      <button
        onClick={() => onDefer(1)}
        className="text-xs text-fg-dim hover:text-fg px-1.5 shrink-0"
        title="Push 1 day"
      >
        +1d
      </button>
      <button
        onClick={() => onDefer(7)}
        className="text-xs text-fg-dim hover:text-fg px-1.5 shrink-0"
        title="Push 1 week"
      >
        +1w
      </button>
      <button
        onClick={onDone}
        className="w-7 h-7 rounded-full bg-success text-bg flex items-center justify-center shrink-0"
        title="Mark reviewed"
      >
        <Check size={15} />
      </button>
    </div>
  );
}
