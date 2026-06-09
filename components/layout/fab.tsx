"use client";

import { Plus } from "lucide-react";
import { cn } from "@/lib/utils";

interface FabProps {
  onClick: () => void;
  className?: string;
}

export function Fab({ onClick, className }: FabProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "fixed bottom-2 right-4 z-50 w-12 h-12 rounded-full bg-brand text-bg shadow-lg",
        "flex items-center justify-center",
        "hover:bg-brand/90 active:scale-95 transition-transform",
        "safe-bottom",
        className
      )}
    >
      <Plus size={22} />
    </button>
  );
}
