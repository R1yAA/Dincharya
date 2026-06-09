"use client";

import { cn } from "@/lib/utils";

interface ChipProps {
  selected?: boolean;
  onClick?: () => void;
  children: React.ReactNode;
  className?: string;
  variant?: "default" | "dashed";
}

export function Chip({
  selected,
  onClick,
  children,
  className,
  variant = "default",
}: ChipProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm transition-colors whitespace-nowrap",
        variant === "dashed" && "border border-dashed border-fg-dim text-fg-muted hover:border-brand hover:text-brand",
        variant === "default" && selected && "bg-brand text-bg",
        variant === "default" && !selected && "bg-elevated text-fg-muted hover:bg-line",
        className
      )}
    >
      {children}
    </button>
  );
}
