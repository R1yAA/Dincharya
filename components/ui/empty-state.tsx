"use client";

interface EmptyStateProps {
  emoji: string;
  message: string;
  action?: React.ReactNode;
}

export function EmptyState({ emoji, message, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <span className="text-4xl mb-3">{emoji}</span>
      <p className="text-fg-muted text-sm mb-4">{message}</p>
      {action}
    </div>
  );
}
