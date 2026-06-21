"use client";

import { useMemo } from "react";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { StudyTopic, StudyTask, StudySession } from "@/lib/supabase/types";
import { BLOCK_MIN } from "@/lib/study";
import { cn } from "@/lib/utils";

interface StudyStatsProps {
  topics: StudyTopic[];
  tasks: StudyTask[];
  sessions: StudySession[];
}

function fmtMin(min: number): string {
  if (min < 60) return `${min}m`;
  const h = Math.floor(min / 60);
  const m = min % 60;
  return m ? `${h}h ${m}m` : `${h}h`;
}

export function StudyStats({ topics, tasks, sessions }: StudyStatsProps) {
  const stats = useMemo(() => {
    const topicById = new Map(topics.map((t) => [t.id, t]));
    const taskById = new Map(tasks.map((t) => [t.id, t]));

    // time per topic, split by kind
    const perTopic = new Map<
      string,
      { name: string; study: number; recall: number }
    >();
    let totalStudy = 0;
    let totalRecall = 0;

    for (const s of sessions) {
      const task = taskById.get(s.task_id);
      if (!task) continue;
      const topic = topicById.get(task.topic_id);
      const key = topic?.id ?? "unknown";
      const name = topic?.name ?? "Unknown";
      const row = perTopic.get(key) ?? { name, study: 0, recall: 0 };
      if (s.kind === "recall") {
        row.recall += s.duration_min;
        totalRecall += s.duration_min;
      } else {
        row.study += s.duration_min;
        totalStudy += s.duration_min;
      }
      perTopic.set(key, row);
    }

    const topicRows = [...perTopic.values()].sort(
      (a, b) => b.study + b.recall - (a.study + a.recall)
    );
    const maxTopic = Math.max(1, ...topicRows.map((r) => r.study + r.recall));

    // estimate accuracy for done tasks that have logged study time
    const studyMinByTask = new Map<string, number>();
    for (const s of sessions) {
      if (s.kind !== "study") continue;
      studyMinByTask.set(
        s.task_id,
        (studyMinByTask.get(s.task_id) ?? 0) + s.duration_min
      );
    }
    const doneTasks = tasks.filter((t) => t.status === "done");
    let estTotal = 0;
    let actualTotal = 0;
    for (const t of doneTasks) {
      const actual = studyMinByTask.get(t.id) ?? 0;
      if (actual === 0) continue;
      estTotal += t.estimate_blocks * BLOCK_MIN;
      actualTotal += actual;
    }
    const accuracyRatio = estTotal > 0 ? actualTotal / estTotal : null;

    return {
      topicRows,
      maxTopic,
      totalStudy,
      totalRecall,
      total: totalStudy + totalRecall,
      accuracyRatio,
      estTotal,
      actualTotal,
    };
  }, [topics, tasks, sessions]);

  if (stats.total === 0) {
    return (
      <EmptyState
        emoji="📊"
        message="No study time logged yet. Log sessions to see your breakdown."
      />
    );
  }

  const studyPct = stats.total ? (stats.totalStudy / stats.total) * 100 : 0;

  return (
    <div className="flex flex-col gap-4">
      <Card>
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-fg-muted">Total time</span>
          <span className="text-fg font-medium">{fmtMin(stats.total)}</span>
        </div>
        <div className="flex h-2 rounded-full overflow-hidden bg-elevated mb-2">
          <div className="h-full bg-violet" style={{ width: `${studyPct}%` }} />
          <div className="h-full bg-brand" style={{ width: `${100 - studyPct}%` }} />
        </div>
        <div className="flex items-center gap-4 text-xs text-fg-dim">
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-violet" /> Study{" "}
            {fmtMin(stats.totalStudy)}
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-brand" /> Recall{" "}
            {fmtMin(stats.totalRecall)}
          </span>
        </div>
      </Card>

      <Card>
        <span className="text-sm text-fg-muted">Time per topic</span>
        <div className="flex flex-col gap-2.5 mt-3">
          {stats.topicRows.map((r) => {
            const total = r.study + r.recall;
            return (
              <div key={r.name}>
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="text-fg truncate">{r.name}</span>
                  <span className="text-fg-dim">{fmtMin(total)}</span>
                </div>
                <div className="flex h-1.5 rounded-full overflow-hidden bg-elevated">
                  <div
                    className="h-full bg-violet"
                    style={{ width: `${(r.study / stats.maxTopic) * 100}%` }}
                  />
                  <div
                    className="h-full bg-brand"
                    style={{ width: `${(r.recall / stats.maxTopic) * 100}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      {stats.accuracyRatio !== null && (
        <Card>
          <div className="flex items-center justify-between mb-1">
            <span className="text-sm text-fg-muted">Estimate accuracy</span>
            <span
              className={cn(
                "text-sm font-medium",
                stats.accuracyRatio > 1.15
                  ? "text-danger"
                  : stats.accuracyRatio < 0.85
                    ? "text-amber"
                    : "text-success"
              )}
            >
              {stats.accuracyRatio > 1
                ? `${Math.round((stats.accuracyRatio - 1) * 100)}% over`
                : stats.accuracyRatio < 1
                  ? `${Math.round((1 - stats.accuracyRatio) * 100)}% under`
                  : "on target"}
            </span>
          </div>
          <p className="text-xs text-fg-dim">
            Estimated {fmtMin(stats.estTotal)} · actually spent{" "}
            {fmtMin(stats.actualTotal)} on completed tasks.
          </p>
        </Card>
      )}
    </div>
  );
}
