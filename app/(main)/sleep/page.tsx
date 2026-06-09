"use client";

import { useState, useMemo } from "react";
import { PageHeader } from "@/components/layout/page-header";
import { Fab } from "@/components/layout/fab";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { RatingDisplay } from "@/components/ui/rating-dots";
import { SleepForm } from "@/components/sleep/sleep-form";
import { useSleep } from "@/hooks/use-sleep";
import { useToast } from "@/components/ui/toast";
import { SleepLog } from "@/lib/supabase/types";
import { formatDate, formatTime } from "@/lib/format";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";

export default function SleepPage() {
  const { logs, upsert, remove } = useSleep();
  const { toast } = useToast();
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<SleepLog | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);

  const thisWeek = useMemo(() => {
    const recent = logs.slice(0, 7);
    const avgHours =
      recent.length > 0
        ? recent.reduce((s, l) => s + (l.hours || 0), 0) / recent.length
        : 0;
    const avgQuality =
      recent.filter((l) => l.quality).length > 0
        ? recent.filter((l) => l.quality).reduce((s, l) => s + l.quality!, 0) /
          recent.filter((l) => l.quality).length
        : 0;
    return { avgHours, avgQuality, recent };
  }, [logs]);

  const chartData = useMemo(
    () =>
      [...thisWeek.recent]
        .reverse()
        .map((l) => ({
          date: l.date.slice(5),
          hours: l.hours || 0,
          quality: l.quality || 0,
        })),
    [thisWeek.recent]
  );

  return (
    <>
      <PageHeader title="Sleep" />

      <div className="px-4 py-4 flex flex-col gap-4">
        {thisWeek.recent.length > 0 ? (
          <Card>
            <div className="flex items-baseline gap-4 mb-3">
              <div>
                <span className="text-2xl font-bold text-fg">
                  {thisWeek.avgHours.toFixed(1)}h
                </span>
                <span className="text-xs text-fg-muted ml-1">avg this week</span>
              </div>
              {thisWeek.avgQuality > 0 && (
                <div className="flex items-center gap-1">
                  <RatingDisplay
                    value={Math.round(thisWeek.avgQuality)}
                    color="bg-accent2"
                  />
                </div>
              )}
            </div>

            {chartData.length >= 2 && (
              <ResponsiveContainer width="100%" height={140}>
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#2A2A36" />
                  <XAxis
                    dataKey="date"
                    tick={{ fontSize: 10, fill: "#A1A1AA" }}
                  />
                  <YAxis
                    tick={{ fontSize: 10, fill: "#A1A1AA" }}
                    domain={[0, 12]}
                  />
                  <Tooltip
                    contentStyle={{
                      background: "#16161D",
                      border: "1px solid #2A2A36",
                      borderRadius: 8,
                    }}
                  />
                  <Bar dataKey="hours" fill="#6AA8FF" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </Card>
        ) : (
          <EmptyState
            emoji="😴"
            message="No sleep logs yet. Tap + to log last night's sleep."
          />
        )}

        {logs.length > 0 && (
          <div>
            <h3 className="text-xs font-medium text-fg-muted px-1 mb-2">History</h3>
            <Card className="p-0 overflow-hidden">
              {logs.map((log) => (
                <div
                  key={log.id}
                  className="flex items-center justify-between px-4 py-3 border-b border-line last:border-0 cursor-pointer active:bg-elevated"
                  onClick={() => {
                    setEditing(log);
                    setFormOpen(true);
                  }}
                >
                  <div>
                    <div className="text-sm text-fg">{formatDate(log.date)}</div>
                    <div className="text-xs text-fg-muted">
                      {formatTime(log.bedtime)} → {formatTime(log.waketime)}
                      {log.hours && ` · ${log.hours.toFixed(1)}h`}
                    </div>
                    {log.tags?.length > 0 && (
                      <div className="text-xs text-fg-dim mt-0.5">
                        {log.tags.join(", ")}
                      </div>
                    )}
                  </div>
                  {log.quality && (
                    <RatingDisplay value={log.quality} color="bg-accent2" />
                  )}
                </div>
              ))}
            </Card>
          </div>
        )}
      </div>

      <Fab
        onClick={() => {
          setEditing(null);
          setFormOpen(true);
        }}
      />

      <SleepForm
        open={formOpen}
        onOpenChange={setFormOpen}
        initial={editing}
        onSave={(data) => {
          upsert.mutate(data, {
            onSuccess: () => toast(editing ? "Sleep updated" : "Sleep logged"),
          });
        }}
      />

      <ConfirmDialog
        open={!!deleting}
        onOpenChange={() => setDeleting(null)}
        title="Delete sleep log?"
        description="This entry will be permanently removed."
        confirmLabel="Delete"
        onConfirm={() => {
          if (deleting) remove.mutate(deleting, { onSuccess: () => toast("Deleted") });
        }}
      />
    </>
  );
}
