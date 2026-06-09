"use client";

import { useState, useMemo } from "react";
import { Check, Circle, Trash2 } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Fab } from "@/components/layout/fab";
import { Card } from "@/components/ui/card";
import { Chip } from "@/components/ui/chip";
import { EmptyState } from "@/components/ui/empty-state";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { RatingDisplay } from "@/components/ui/rating-dots";
import { StudyForm } from "@/components/study/study-form";
import { ReviewCalendar } from "@/components/study/review-calendar";
import { useStudy } from "@/hooks/use-study";
import { useRecall } from "@/hooks/use-recall";
import { useToast } from "@/components/ui/toast";
import { StudyLog, RecallItem } from "@/lib/supabase/types";
import { groupLabel, formatDate, todayStr } from "@/lib/format";
import { cn } from "@/lib/utils";

type View = "log" | "review" | "calendar";

export default function StudyPage() {
  const [view, setView] = useState<View>("log");
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<StudyLog | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [calDate, setCalDate] = useState<string | null>(null);

  const { logs, upsert, remove, subjects } = useStudy();
  const {
    todayItems,
    dueCount,
    todayReviewed,
    todayTotal,
    completionPct,
    createReminders,
    markReviewed,
    unmarkReviewed,
  } = useRecall();
  const calRecall = useRecall(calDate || undefined);
  const { toast } = useToast();

  const grouped = logs.reduce<Record<string, StudyLog[]>>((acc, l) => {
    (acc[l.date] ||= []).push(l);
    return acc;
  }, {});

  const reviewsBySubject = (items: RecallItem[]) =>
    items.reduce<Record<string, RecallItem[]>>((acc, item) => {
      const key = item.subject || "Other";
      (acc[key] ||= []).push(item);
      return acc;
    }, {});

  const todayGrouped = useMemo(() => reviewsBySubject(todayItems), [todayItems]);
  const calGrouped = useMemo(
    () => reviewsBySubject(calRecall.dateItems),
    [calRecall.dateItems]
  );

  return (
    <>
      <PageHeader title="Study">
        <div className="flex gap-1">
          <Chip selected={view === "log"} onClick={() => setView("log")}>
            Log
          </Chip>
          <Chip selected={view === "review"} onClick={() => setView("review")}>
            Review{dueCount > 0 && ` (${dueCount})`}
          </Chip>
          <Chip selected={view === "calendar"} onClick={() => setView("calendar")}>
            Calendar
          </Chip>
        </div>
      </PageHeader>

      <div className="px-4 py-4 flex flex-col gap-4">
        {/* ===== LOG VIEW ===== */}
        {view === "log" && (
          <>
            {logs.length === 0 ? (
              <EmptyState
                emoji="📚"
                message="No study sessions logged yet. Tap + to get started."
              />
            ) : (
              Object.entries(grouped).map(([date, items]) => (
                <div key={date}>
                  <h3 className="text-xs font-medium text-fg-muted px-1 mb-1">
                    {groupLabel(date)}
                  </h3>
                  <Card className="p-0 overflow-hidden">
                    {items.map((log) => (
                      <div
                        key={log.id}
                        className="flex items-center justify-between px-4 py-3 border-b border-line last:border-0 cursor-pointer active:bg-elevated"
                        onClick={() => {
                          setEditing(log);
                          setFormOpen(true);
                        }}
                      >
                        <div className="flex-1 min-w-0">
                          <div className="text-sm text-fg font-medium truncate">
                            {log.subject}
                          </div>
                          <div className="text-xs text-fg-muted">
                            {log.topic && <span>{log.topic} · </span>}
                            {log.duration_min && <span>{log.duration_min}min</span>}
                          </div>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          {log.confidence && (
                            <RatingDisplay value={log.confidence} color="bg-violet" />
                          )}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setDeleting(log.id);
                            }}
                            className="p-2 text-fg-dim hover:text-danger transition-colors"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </Card>
                </div>
              ))
            )}
          </>
        )}

        {/* ===== REVIEW VIEW (today) ===== */}
        {view === "review" && (
          <>
            {completionPct !== null && (
              <Card className="py-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-fg-muted">Today&apos;s reviews</span>
                  <span className="text-sm text-fg">
                    {todayReviewed}/{todayTotal}
                    <span
                      className={cn(
                        "ml-2 text-xs px-2 py-0.5 rounded-full font-medium",
                        completionPct === 100
                          ? "bg-success/20 text-success"
                          : completionPct >= 50
                            ? "bg-brand/20 text-brand"
                            : "bg-elevated text-fg-muted"
                      )}
                    >
                      {completionPct}%
                    </span>
                  </span>
                </div>
                <div className="h-1.5 rounded-full bg-elevated overflow-hidden">
                  <div
                    className={cn(
                      "h-full rounded-full transition-all",
                      completionPct === 100 ? "bg-success" : "bg-brand"
                    )}
                    style={{ width: `${completionPct}%` }}
                  />
                </div>
              </Card>
            )}

            {todayItems.length === 0 ? (
              <EmptyState
                emoji="📖"
                message="No reviews due today. Log study sessions to build your review schedule."
              />
            ) : (
              <ReviewList
                grouped={todayGrouped}
                onToggle={(item) => {
                  if (item.last_reviewed) {
                    unmarkReviewed.mutate(item.id);
                  } else {
                    markReviewed.mutate(item.id);
                  }
                }}
              />
            )}
          </>
        )}

        {/* ===== CALENDAR VIEW ===== */}
        {view === "calendar" && (
          <>
            <Card>
              <ReviewCalendar
                selectedDate={calDate}
                onDayClick={(date) => setCalDate(date)}
              />
            </Card>

            {calDate && (
              <>
                <h3 className="text-xs font-medium text-fg-muted px-1">
                  {calDate === todayStr() ? "Today" : formatDate(calDate)}
                  {calRecall.dateItems.length > 0 && (
                    <span className="text-fg-dim ml-1">
                      — {calRecall.dateItems.filter((i) => i.last_reviewed).length}/
                      {calRecall.dateItems.length} reviewed
                    </span>
                  )}
                </h3>
                {calRecall.dateItems.length === 0 ? (
                  <EmptyState
                    emoji="📅"
                    message="No reviews scheduled for this day."
                  />
                ) : (
                  <ReviewList
                    grouped={calGrouped}
                    onToggle={(item) => {
                      if (item.last_reviewed) {
                        unmarkReviewed.mutate(item.id);
                      } else {
                        markReviewed.mutate(item.id);
                      }
                    }}
                  />
                )}
              </>
            )}
          </>
        )}
      </div>

      {view === "log" && (
        <Fab
          onClick={() => {
            setEditing(null);
            setFormOpen(true);
          }}
        />
      )}

      <StudyForm
        open={formOpen}
        onOpenChange={setFormOpen}
        initial={editing}
        subjects={subjects}
        onSave={(data) => {
          upsert.mutate(data, {
            onSuccess: (result) => {
              toast(editing ? "Updated" : "Study session logged");
              if (!editing && result) {
                const saved = result as StudyLog;
                createReminders.mutate({
                  study_log_id: saved.id,
                  subject: saved.subject,
                  topic: saved.topic,
                  studyDate: saved.date,
                });
              }
            },
          });
        }}
      />

      <ConfirmDialog
        open={!!deleting}
        onOpenChange={() => setDeleting(null)}
        title="Delete study entry?"
        description="This entry and its review reminders will be removed."
        confirmLabel="Delete"
        onConfirm={() => {
          if (deleting)
            remove.mutate(deleting, { onSuccess: () => toast("Deleted") });
        }}
      />
    </>
  );
}

function ReviewList({
  grouped,
  onToggle,
}: {
  grouped: Record<string, RecallItem[]>;
  onToggle: (item: RecallItem) => void;
}) {
  return (
    <>
      {Object.entries(grouped).map(([subject, items]) => (
        <div key={subject}>
          <h3 className="text-xs font-medium text-fg-muted px-1 mb-1">
            {subject}
          </h3>
          <Card className="p-0 overflow-hidden">
            {items.map((item) => {
              const done = !!item.last_reviewed;
              return (
                <button
                  key={item.id}
                  onClick={() => onToggle(item)}
                  className="flex items-center gap-3 px-4 py-3 border-b border-line last:border-0 w-full text-left active:bg-elevated transition-colors"
                >
                  {done ? (
                    <div className="w-5 h-5 rounded-full bg-success/20 flex items-center justify-center shrink-0">
                      <Check size={14} className="text-success" />
                    </div>
                  ) : (
                    <Circle size={20} className="text-fg-dim shrink-0" />
                  )}
                  <div className="flex-1 min-w-0">
                    <div
                      className={cn(
                        "text-sm truncate",
                        done ? "text-fg-muted line-through" : "text-fg"
                      )}
                    >
                      {item.prompt}
                    </div>
                    <div className="text-xs text-fg-dim">
                      day {item.interval_days} review
                    </div>
                  </div>
                </button>
              );
            })}
          </Card>
        </div>
      ))}
    </>
  );
}
