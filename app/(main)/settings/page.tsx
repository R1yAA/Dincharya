"use client";

import { useState } from "react";
import { PageHeader } from "@/components/layout/page-header";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useSettings } from "@/hooks/use-settings";
import { useDeleteAccount } from "@/hooks/use-delete-account";
import { useWorkspace } from "@/components/workspace/workspace-provider";
import { useToast } from "@/components/ui/toast";
import { useMeals } from "@/hooks/use-meals";
import { useBody } from "@/hooks/use-body";
import { useSleep } from "@/hooks/use-sleep";
import { useCycle } from "@/hooks/use-cycle";
import { useHair } from "@/hooks/use-hair";
import { useStudy } from "@/hooks/use-study";
import { useRecall } from "@/hooks/use-recall";
import * as csv from "@/lib/csv";

const MODULES = [
  { id: "meals", label: "Meals" },
  { id: "body", label: "Body" },
  { id: "sleep", label: "Sleep" },
  { id: "cycle", label: "Cycle" },
  { id: "hair", label: "Hair" },
  { id: "study", label: "Study" },
];

export default function SettingsPage() {
  const { settings, update } = useSettings();
  const { workspace, logout } = useWorkspace();
  const { clearAll, deleteAccount } = useDeleteAccount();
  const { toast } = useToast();
  const { meals } = useMeals();
  const { checkins } = useBody();
  const { logs: sleepLogs } = useSleep();
  const { days: cycleDays } = useCycle();
  const { logs: hairLogs } = useHair();
  const { logs: studyLogs } = useStudy();
  const { items: recallItems } = useRecall();

  const [name, setName] = useState(settings?.user_name || "");
  const [cycleLen, setCycleLen] = useState(settings?.default_cycle_len?.toString() || "28");
  const [periodLen, setPeriodLen] = useState(settings?.default_period_len?.toString() || "5");
  const [deleteConfirm, setDeleteConfirm] = useState("");
  const [clearConfirm, setClearConfirm] = useState("");

  const handleExport = () => {
    csv.downloadCsv(csv.mealsCsv(meals), "dincharya-meals.csv");
    csv.downloadCsv(csv.bodyCsv(checkins), "dincharya-body.csv");
    csv.downloadCsv(csv.sleepCsv(sleepLogs), "dincharya-sleep.csv");
    csv.downloadCsv(csv.cycleCsv(cycleDays), "dincharya-cycle.csv");
    csv.downloadCsv(csv.hairCsv(hairLogs), "dincharya-hair.csv");
    csv.downloadCsv(csv.studyCsv(studyLogs), "dincharya-study.csv");
    csv.downloadCsv(csv.recallCsv(recallItems), "dincharya-recall.csv");
    toast("All CSVs downloaded");
  };

  const toggleModule = (id: string) => {
    if (!settings) return;
    const current = settings.enabled_modules || [];
    const next = current.includes(id)
      ? current.filter((m) => m !== id)
      : [...current, id];
    update.mutate({ enabled_modules: next });
  };

  return (
    <>
      <PageHeader title="Settings" />

      <div className="px-4 py-4 flex flex-col gap-4">
        <Card>
          <h3 className="text-sm font-medium text-fg mb-3">Your name</h3>
          <div className="flex gap-2">
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="flex-1"
            />
            <Button
              size="sm"
              onClick={() => {
                update.mutate({ user_name: name }, { onSuccess: () => toast("Name updated") });
              }}
            >
              Save
            </Button>
          </div>
        </Card>

        <Card>
          <h3 className="text-sm font-medium text-fg mb-3">Cycle defaults</h3>
          <div className="flex gap-3">
            <Input
              label="Cycle length"
              type="number"
              value={cycleLen}
              onChange={(e) => setCycleLen(e.target.value)}
              className="flex-1"
            />
            <Input
              label="Period length"
              type="number"
              value={periodLen}
              onChange={(e) => setPeriodLen(e.target.value)}
              className="flex-1"
            />
          </div>
          <Button
            size="sm"
            className="mt-3"
            onClick={() => {
              update.mutate(
                {
                  default_cycle_len: parseInt(cycleLen) || 28,
                  default_period_len: parseInt(periodLen) || 5,
                },
                { onSuccess: () => toast("Cycle defaults updated") }
              );
            }}
          >
            Save
          </Button>
        </Card>

        <Card>
          <h3 className="text-sm font-medium text-fg mb-3">Module visibility</h3>
          <div className="flex flex-col gap-2">
            {MODULES.map((m) => {
              const enabled = settings?.enabled_modules?.includes(m.id) ?? true;
              return (
                <label key={m.id} className="flex items-center justify-between">
                  <span className="text-sm text-fg">{m.label}</span>
                  <input
                    type="checkbox"
                    checked={enabled}
                    onChange={() => toggleModule(m.id)}
                    className="w-5 h-5 rounded accent-brand"
                  />
                </label>
              );
            })}
          </div>
        </Card>

        <Card>
          <h3 className="text-sm font-medium text-fg mb-3">Export all data</h3>
          <p className="text-xs text-fg-muted mb-3">
            Downloads one CSV per module.
          </p>
          <Button variant="secondary" onClick={handleExport}>
            Export CSVs
          </Button>
        </Card>

        <Card>
          <h3 className="text-sm font-medium text-fg mb-1">About</h3>
          <p className="text-xs text-fg-muted">
            Dincharya v1.0 — your daily routine tracker.
          </p>
        </Card>

        <Card className="border-danger/30">
          <h3 className="text-sm font-medium text-danger mb-3">Danger zone</h3>

          <div className="flex flex-col gap-4">
            <div>
              <p className="text-xs text-fg-muted mb-2">
                Clear all data — type <code className="text-danger">DELETE</code> to confirm.
              </p>
              <div className="flex gap-2">
                <Input
                  value={clearConfirm}
                  onChange={(e) => setClearConfirm(e.target.value)}
                  placeholder="Type DELETE"
                  className="flex-1"
                />
                <Button
                  variant="danger"
                  size="sm"
                  disabled={clearConfirm !== "DELETE"}
                  onClick={() => {
                    clearAll.mutate(undefined, {
                      onSuccess: () => {
                        toast("All data cleared");
                        setClearConfirm("");
                      },
                    });
                  }}
                >
                  Clear
                </Button>
              </div>
            </div>

            <div>
              <p className="text-xs text-fg-muted mb-2">
                Delete account — type your workspace name to confirm.
              </p>
              <div className="flex gap-2">
                <Input
                  value={deleteConfirm}
                  onChange={(e) => setDeleteConfirm(e.target.value)}
                  placeholder={workspace || ""}
                  className="flex-1"
                />
                <Button
                  variant="danger"
                  size="sm"
                  disabled={deleteConfirm !== workspace}
                  onClick={() => deleteAccount.mutate()}
                >
                  Delete
                </Button>
              </div>
            </div>

            <Button variant="ghost" onClick={logout}>
              Log out
            </Button>
          </div>
        </Card>
      </div>
    </>
  );
}
