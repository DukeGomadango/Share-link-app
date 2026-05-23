"use client";

import type { ReactNode } from "react";

import { WorkspaceLibraryProvider } from "@/context/WorkspaceLibraryContext";
import { DashboardSidebar } from "@/components/layouts/DashboardSidebar";

export function DashboardShell({ children }: { children: ReactNode }) {
  return (
    <WorkspaceLibraryProvider>
      <div className="flex h-screen overflow-hidden bg-background">
        <DashboardSidebar />
        <main className="scrollbar-prominent flex-1 overflow-y-auto p-4 md:p-8 relative">
          {children}
        </main>
      </div>
    </WorkspaceLibraryProvider>
  );
}
