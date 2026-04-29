import { DashboardSidebar } from "@/components/layouts/DashboardSidebar";
import { OnboardingTour } from "@/components/features/onboarding/OnboardingTour";

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
      </main>
    </div>
  );
}
