"use client";

import { useState, useMemo } from "react";
import { PageHeader } from "@/components/layout/page-header";
import { Fab } from "@/components/layout/fab";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { RatingDisplay } from "@/components/ui/rating-dots";
import { HairForm } from "@/components/hair/hair-form";
import { useHair } from "@/hooks/use-hair";
import { useToast } from "@/components/ui/toast";
import { HairLog } from "@/lib/supabase/types";
import { formatDate, daysBetween, todayStr } from "@/lib/format";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from "recharts";

export default function HairPage() {
  const { logs, upsert, remove } = useHair();
  const { toast } = useToast();
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<HairLog | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);

  const latest = logs[0];
  const lastWash = logs.find((l) => l.washed);
  const daysSinceWash = lastWash ? daysBetween(lastWash.date, todayStr()) : null;

  const chartData = useMemo(
    () =>
      [...logs]
        .reverse()
        .filter((l) => l.shedding || l.condition)
        .map((l) => ({
          date: l.date.slice(5),
          shedding: l.shedding,
          condition: l.condition,
        })),
    [logs]
  );

  return (
    <>
      <PageHeader title="Hair" />

      <div className="px-4 py-4 flex flex-col gap-4">
        {latest ? (
          <Card>
            <div className="flex items-baseline gap-3 mb-2">
              <span className="text-lg font-semibold text-fg">Latest check-in</span>
              <span className="text-xs text-fg-muted">{formatDate(latest.date)}</span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-sm">
              {lastWash && daysSinceWash !== null && (
                <div>
                  <span className="text-fg-muted">Days since wash</span>
                  <p className="text-fg font-medium">{daysSinceWash}</p>
                </div>
              )}
              {latest.shedding && (
                <div className="flex items-center gap-2">
                  <span className="text-fg-muted">Shedding</span>
                  <RatingDisplay value={latest.shedding} color="bg-amber" />
                </div>
              )}
              {latest.scalp && (
                <div className="flex items-center gap-2">
                  <span className="text-fg-muted">Scalp</span>
                  <RatingDisplay value={latest.scalp} color="bg-amber" />
                </div>
              )}
              {latest.condition && (
                <div className="flex items-center gap-2">
                  <span className="text-fg-muted">Condition</span>
                  <RatingDisplay value={latest.condition} color="bg-amber" />
                </div>
              )}
            </div>
            {latest.routine && (
              <p className="text-xs text-fg-dim mt-2">{latest.routine}</p>
            )}
          </Card>
        ) : (
          <EmptyState
            emoji="💇"
            message="No hair logs yet. Tap + to log your first check-in."
          />
        )}

        {chartData.length >= 2 && (
          <Card className="p-2">
            <ResponsiveContainer width="100%" height={180}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#2A2A36" />
                <XAxis dataKey="date" tick={{ fontSize: 10, fill: "#A1A1AA" }} />
                <YAxis domain={[1, 5]} tick={{ fontSize: 10, fill: "#A1A1AA" }} />
                <Tooltip
                  contentStyle={{ background: "#16161D", border: "1px solid #2A2A36", borderRadius: 8 }}
                />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Line type="monotone" dataKey="shedding" stroke="#C9A227" strokeWidth={2} dot={{ r: 2 }} />
                <Line type="monotone" dataKey="condition" stroke="#8BAE66" strokeWidth={2} dot={{ r: 2 }} />
              </LineChart>
            </ResponsiveContainer>
          </Card>
        )}

        {logs.length > 0 && (
          <div>
            <h3 className="text-xs font-medium text-fg-muted px-1 mb-2">History</h3>
            <Card className="p-0 overflow-hidden">
              {logs.map((log) => (
                <div
                  key={log.id}
                  className="flex items-center justify-between px-4 py-3 border-b border-line last:border-0 cursor-pointer active:bg-elevated"
                  onClick={() => { setEditing(log); setFormOpen(true); }}
                >
                  <div>
                    <div className="text-sm text-fg">
                      {formatDate(log.date)}
                      {log.washed && <span className="text-xs text-accent2 ml-2">washed</span>}
                    </div>
                    {log.routine && (
                      <div className="text-xs text-fg-dim">{log.routine}</div>
                    )}
                  </div>
                  {log.condition && (
                    <RatingDisplay value={log.condition} color="bg-amber" />
                  )}
                </div>
              ))}
            </Card>
          </div>
        )}
      </div>

      <Fab onClick={() => { setEditing(null); setFormOpen(true); }} />

      <HairForm
        open={formOpen}
        onOpenChange={setFormOpen}
        initial={editing}
        onSave={(data) => {
          upsert.mutate(data, {
            onSuccess: () => toast(editing ? "Hair log updated" : "Hair check-in saved"),
          });
        }}
      />

      <ConfirmDialog
        open={!!deleting}
        onOpenChange={() => setDeleting(null)}
        title="Delete hair log?"
        description="This entry will be permanently removed."
        confirmLabel="Delete"
        onConfirm={() => {
          if (deleting) remove.mutate(deleting, { onSuccess: () => toast("Deleted") });
        }}
      />
    </>
  );
}
