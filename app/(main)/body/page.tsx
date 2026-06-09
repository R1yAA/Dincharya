"use client";

import { useState, useMemo } from "react";
import { PageHeader } from "@/components/layout/page-header";
import { Fab } from "@/components/layout/fab";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { RatingDisplay } from "@/components/ui/rating-dots";
import { Chip } from "@/components/ui/chip";
import { BodyCheckinForm } from "@/components/body/body-checkin-form";
import { useBody } from "@/hooks/use-body";
import { useToast } from "@/components/ui/toast";
import { BodyCheckin } from "@/lib/supabase/types";
import { formatDate } from "@/lib/format";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";

const METRIC_TABS = ["weight", "energy", "mood", "skin", "digestion", "bloating"] as const;
type MetricTab = (typeof METRIC_TABS)[number];

export default function BodyPage() {
  const { checkins, upsert, remove } = useBody();
  const { toast } = useToast();
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<BodyCheckin | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [tab, setTab] = useState<MetricTab>("weight");

  const latest = checkins[0];
  const sorted = useMemo(
    () => [...checkins].sort((a, b) => a.date.localeCompare(b.date)),
    [checkins]
  );

  const chartData = useMemo(() => {
    return sorted
      .filter((c) => {
        if (tab === "weight") return c.weight_kg != null;
        return c[tab] != null;
      })
      .map((c) => ({
        date: c.date,
        value: tab === "weight" ? c.weight_kg : c[tab],
      }));
  }, [sorted, tab]);

  return (
    <>
      <PageHeader title="Body" />

      <div className="px-4 py-4 flex flex-col gap-4">
        {latest ? (
          <Card>
            <div className="flex items-baseline gap-2 mb-3">
              {latest.weight_kg && (
                <span className="text-2xl font-bold text-fg">
                  {latest.weight_kg} kg
                </span>
              )}
              <span className="text-xs text-fg-muted">
                {formatDate(latest.date)}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-3 text-sm">
              {latest.energy && (
                <div className="flex items-center justify-between">
                  <span className="text-fg-muted">Energy</span>
                  <RatingDisplay value={latest.energy} color="bg-brand" />
                </div>
              )}
              {latest.mood && (
                <div className="flex items-center justify-between">
                  <span className="text-fg-muted">Mood</span>
                  <RatingDisplay value={latest.mood} color="bg-brand" />
                </div>
              )}
              {latest.skin && (
                <div className="flex items-center justify-between">
                  <span className="text-fg-muted">Skin</span>
                  <RatingDisplay value={latest.skin} color="bg-violet" />
                </div>
              )}
              {latest.digestion && (
                <div className="flex items-center justify-between">
                  <span className="text-fg-muted">Digestion</span>
                  <RatingDisplay value={latest.digestion} color="bg-success" />
                </div>
              )}
            </div>
          </Card>
        ) : (
          <EmptyState
            emoji="💪"
            message="No body check-ins yet. Tap + to log how you're feeling."
          />
        )}

        <div className="flex flex-wrap gap-2">
          {METRIC_TABS.map((m) => (
            <Chip key={m} selected={tab === m} onClick={() => setTab(m)}>
              {m.charAt(0).toUpperCase() + m.slice(1)}
            </Chip>
          ))}
        </div>

        {chartData.length >= 2 && (
          <Card className="p-2">
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#2A2A36" />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 10, fill: "#A1A1AA" }}
                  tickFormatter={(d: string) => d.slice(5)}
                />
                <YAxis
                  tick={{ fontSize: 10, fill: "#A1A1AA" }}
                  domain={tab === "weight" ? ["dataMin - 1", "dataMax + 1"] : [1, 5]}
                />
                <Tooltip
                  contentStyle={{ background: "#16161D", border: "1px solid #2A2A36", borderRadius: 8 }}
                  labelStyle={{ color: "#A1A1AA" }}
                />
                <Line
                  type="monotone"
                  dataKey="value"
                  stroke="#8BAE66"
                  strokeWidth={2}
                  dot={{ r: 3 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </Card>
        )}

        {checkins.length > 0 && (
          <div>
            <h3 className="text-xs font-medium text-fg-muted px-1 mb-2">History</h3>
            <Card className="p-0 overflow-hidden">
              {checkins.map((c) => (
                <div
                  key={c.id}
                  className="flex items-center justify-between px-4 py-3 border-b border-line last:border-0 cursor-pointer active:bg-elevated"
                  onClick={() => { setEditing(c); setFormOpen(true); }}
                >
                  <div>
                    <span className="text-sm text-fg">{formatDate(c.date)}</span>
                    {c.weight_kg && (
                      <span className="text-sm text-fg-muted ml-2">{c.weight_kg} kg</span>
                    )}
                  </div>
                  <div className="flex gap-1">
                    {c.energy && <RatingDisplay value={c.energy} color="bg-brand" />}
                  </div>
                </div>
              ))}
            </Card>
          </div>
        )}
      </div>

      <Fab onClick={() => { setEditing(null); setFormOpen(true); }} />

      <BodyCheckinForm
        open={formOpen}
        onOpenChange={setFormOpen}
        initial={editing}
        onSave={(data) => {
          upsert.mutate(data, {
            onSuccess: () => toast(editing ? "Check-in updated" : "Check-in saved"),
          });
        }}
      />

      <ConfirmDialog
        open={!!deleting}
        onOpenChange={() => setDeleting(null)}
        title="Delete check-in?"
        description="This body check-in will be permanently removed."
        confirmLabel="Delete"
        onConfirm={() => {
          if (deleting) remove.mutate(deleting, { onSuccess: () => toast("Deleted") });
        }}
      />
    </>
  );
}
