"use client";

import { useState, type ReactNode } from "react";

import { WorkspaceLibraryProvider } from "@/context/WorkspaceLibraryContext";
import { DashboardSidebar } from "@/components/layouts/DashboardSidebar";
import { DashboardMobileHeader } from "@/components/layouts/DashboardMobileHeader";
import { DashboardBottomNav } from "@/components/layouts/DashboardBottomNav";
import { DashboardMobileMenu } from "@/components/layouts/DashboardMobileMenu";

export function DashboardShell({ children }: { children: ReactNode }) {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <WorkspaceLibraryProvider>
      <div className="flex h-[100dvh] min-h-[100dvh] overflow-hidden bg-background lg:h-screen lg:min-h-screen">
        <DashboardSidebar />
        <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
          <DashboardMobileHeader onOpenMenu={() => setMenuOpen(true)} />
          <main
            className="scrollbar-prominent relative flex-1 overflow-y-auto p-4 md:p-8 pb-[calc(5rem+env(safe-area-inset-bottom,0px))] lg:pb-8"
          >
            {children}
          </main>
          <DashboardBottomNav />
        </div>
      </div>
      <DashboardMobileMenu open={menuOpen} onClose={() => setMenuOpen(false)} />
    </WorkspaceLibraryProvider>
  );
}
