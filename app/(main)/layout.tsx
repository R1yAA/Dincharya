"use client";

import { BottomTabs } from "@/components/layout/bottom-tabs";

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col min-h-screen">
      <main className="flex-1 pb-20">{children}</main>
      <BottomTabs />
    </div>
  );
}
