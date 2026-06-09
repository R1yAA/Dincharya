"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { Home, UtensilsCrossed, Activity, BookOpen, MoreHorizontal } from "lucide-react";
import { cn } from "@/lib/utils";

const TABS = [
  { href: "/", label: "Today", icon: Home },
  { href: "/meals", label: "Meals", icon: UtensilsCrossed },
  { href: "/body", label: "Body", icon: Activity },
  { href: "/study", label: "Study", icon: BookOpen },
  { href: "/more", label: "More", icon: MoreHorizontal },
] as const;

export function BottomTabs() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-surface border-t border-line safe-bottom">
      <div className="flex items-center justify-around h-14">
        {TABS.map((tab) => {
          const active = tab.href === "/"
            ? pathname === "/"
            : pathname.startsWith(tab.href);
          const Icon = tab.icon;
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={cn(
                "flex flex-col items-center gap-0.5 px-3 py-1.5 text-xs transition-colors",
                active ? "text-brand" : "text-fg-dim"
              )}
            >
              <Icon size={20} />
              <span>{tab.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
