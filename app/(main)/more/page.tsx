"use client";

import Link from "next/link";
import { Moon, Scissors, BookOpen, Lightbulb, Settings } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Card } from "@/components/ui/card";
import { useSleep } from "@/hooks/use-sleep";
import { useHair } from "@/hooks/use-hair";
import { useRecall } from "@/hooks/use-recall";
import { useMemo } from "react";

const LINKS = [
  { href: "/sleep", label: "Sleep", icon: Moon, color: "text-accent2" },
  { href: "/hair", label: "Hair", icon: Scissors, color: "text-amber" },
  { href: "/study", label: "Study", icon: BookOpen, color: "text-violet" },
  { href: "/insights", label: "Insights", icon: Lightbulb, color: "text-brand" },
  { href: "/settings", label: "Settings", icon: Settings, color: "text-fg-muted" },
] as const;

export default function MorePage() {
  const { logs: sleepLogs } = useSleep();
  const { logs: hairLogs } = useHair();
  const { dueCount } = useRecall();

  const sleepAvg = useMemo(() => {
    const recent = sleepLogs.slice(0, 7);
    if (recent.length === 0) return null;
    return (recent.reduce((s, l) => s + (l.hours || 0), 0) / recent.length).toFixed(1);
  }, [sleepLogs]);

  const getSubline = (href: string) => {
    switch (href) {
      case "/sleep": return sleepAvg ? `avg ${sleepAvg}h this week` : "Track your sleep";
      case "/hair": return hairLogs[0] ? `Last log: ${hairLogs[0].date}` : "Track hair health";
      case "/study": return dueCount > 0 ? `${dueCount} reviews due` : "Log study sessions";
      case "/insights": return "See patterns & correlations";
      case "/settings": return "Preferences & export";
      default: return "";
    }
  };

  return (
    <>
      <PageHeader title="More" />
      <div className="px-4 py-4 flex flex-col gap-3">
        {LINKS.map((link) => {
          const Icon = link.icon;
          return (
            <Link key={link.href} href={link.href}>
              <Card className="flex items-center gap-4 active:bg-elevated transition-colors">
                <Icon size={22} className={link.color} />
                <div className="flex-1">
                  <div className="text-fg font-medium text-sm">{link.label}</div>
                  <div className="text-fg-muted text-xs">{getSubline(link.href)}</div>
                </div>
              </Card>
            </Link>
          );
        })}
      </div>
    </>
  );
}
