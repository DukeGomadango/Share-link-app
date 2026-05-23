import type { Metadata } from "next";
import { DashboardSidebar } from "@/components/layouts/DashboardSidebar";
import { NOINDEX_METADATA } from "@/lib/seo/noindex";

export const metadata: Metadata = NOINDEX_METADATA;
import { OnboardingTour } from "@/components/features/onboarding/OnboardingTour";
import { GlobalCommandPaletteHotkey } from "@/components/features/library/GlobalCommandPaletteHotkey";
import { GlobalCommandPaletteRoot } from "@/components/features/library/GlobalCommandPaletteRoot";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <DashboardSidebar />
      <main className="scrollbar-prominent flex-1 overflow-y-auto p-4 md:p-8 relative">
        {children}
        <OnboardingTour />
        <GlobalCommandPaletteHotkey />
        <GlobalCommandPaletteRoot />
      </main>
    </div>
  );
}
