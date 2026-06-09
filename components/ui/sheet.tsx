"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

interface SheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  children: React.ReactNode;
}

export function Sheet({ open, onOpenChange, title, children }: SheetProps) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/60 z-40 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
        <Dialog.Content
          className={cn(
            "fixed bottom-0 left-0 right-0 z-50 bg-surface rounded-t-2xl border-t border-line",
            "max-h-[85vh] overflow-y-auto",
            "pb-[env(safe-area-inset-bottom)]",
            "data-[state=open]:animate-in data-[state=closed]:animate-out",
            "data-[state=closed]:slide-out-to-bottom data-[state=open]:slide-in-from-bottom",
            "duration-200"
          )}
        >
          <div className="sticky top-0 bg-surface z-10 flex items-center justify-between px-4 py-3 border-b border-line">
            <Dialog.Title className="text-lg font-semibold text-fg">
              {title}
            </Dialog.Title>
            <Dialog.Close className="rounded-full p-1.5 hover:bg-elevated text-fg-muted">
              <X size={20} />
            </Dialog.Close>
          </div>
          <div className="px-4 py-4">{children}</div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
