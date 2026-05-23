import type { Metadata } from "next";

import { DashboardShell } from "@/components/layouts/DashboardShell";
import { NOINDEX_METADATA } from "@/lib/seo/noindex";
import { OnboardingTour } from "@/components/features/onboarding/OnboardingTour";
import { GlobalCommandPaletteHotkey } from "@/components/features/library/GlobalCommandPaletteHotkey";
import { GlobalCommandPaletteRoot } from "@/components/features/library/GlobalCommandPaletteRoot";

export const metadata: Metadata = NOINDEX_METADATA;

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <DashboardShell>
      {children}
      <OnboardingTour />
      <GlobalCommandPaletteHotkey />
      <GlobalCommandPaletteRoot />
    </DashboardShell>
  );
}
