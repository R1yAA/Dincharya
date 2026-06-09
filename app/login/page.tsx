"use client";

import { useState } from "react";
import { useWorkspace } from "@/components/workspace/workspace-provider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function LoginPage() {
  const [name, setName] = useState("");
  const { setWorkspace } = useWorkspace();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (trimmed) setWorkspace(trimmed);
  };

  return (
    <div className="min-h-screen bg-bg flex flex-col items-center justify-center px-6 safe-top safe-bottom">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-fg mb-2">दिनचर्या</h1>
          <p className="text-fg-muted text-sm">Your daily routine tracker</p>
        </div>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <Input
            id="username"
            label="Your name"
            placeholder="Enter your name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            autoFocus
            autoComplete="off"
          />
          <Button type="submit" size="lg" disabled={!name.trim()}>
            Start tracking
          </Button>
        </form>
        <p className="text-fg-dim text-xs text-center mt-6">
          No account needed. Your name is your workspace key.
        </p>
      </div>
    </div>
  );
}
