"use client";

import { cn } from "@/lib/utils";

interface PageHeaderProps {
  title: string;
  children?: React.ReactNode;
  className?: string;
}

export function PageHeader({ title, children, className }: PageHeaderProps) {
  return (
    <div
      className={cn(
        "sticky top-0 z-30 bg-surface border-b border-line safe-top",
        className
      )}
    >
      <div className="flex items-center justify-between px-4 h-14">
        <h1 className="text-lg font-semibold text-fg">{title}</h1>
        {children}
      </div>
    </div>
  );
}
