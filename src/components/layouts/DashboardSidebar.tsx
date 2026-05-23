"use client";

import Link from "next/link";
import { LayoutDashboard, Megaphone, Settings, Gift, FolderOpen, Plug, Users } from "lucide-react";
import { ThemeToggle } from "@/components/shared/ThemeToggle";
import { LanguageToggle } from "@/components/shared/LanguageToggle";
import { useTranslation } from "@/lib/i18n";
import { SignOutButton } from "@/components/auth/SignOutButton";
import { PlanStatusWidget } from "@/components/shared/PlanStatusWidget";
import { useWorkspaceStats } from "@/hooks/features/workspace/useWorkspaceStats";

export function DashboardSidebar() {
  const { t } = useTranslation();
  const { stats } = useWorkspaceStats();

  return (
    <aside className="w-64 h-full hidden lg:flex flex-col glass border-r-0 rounded-l-none">
      <div className="p-6 flex items-center space-x-2">
        <Gift className="w-6 h-6 text-emerald-500" />
        <span className="font-bold text-lg tracking-tight">SharePlatform</span>
      </div>

      <nav className="flex-1 px-4 space-y-2 mt-4">
        {/* ... (navigation links) ... */}
        <Link
          href="/dashboard"
          className="flex items-center space-x-3 px-3 py-2 rounded-md hover:bg-emerald-500/10 text-foreground/80 hover:text-emerald-500 transition-colors"
        >
          <LayoutDashboard className="w-5 h-5" />
          <span>{t.nav.dashboard}</span>
        </Link>
        <Link
          href="/campaigns"
          className="flex items-center space-x-3 px-3 py-2 rounded-md hover:bg-emerald-500/10 text-foreground/80 hover:text-emerald-500 transition-colors"
        >
          <Megaphone className="w-5 h-5" />
          <span>{t.nav.campaigns}</span>
        </Link>
        <Link
          href="/library"
          className="flex items-center space-x-3 px-3 py-2 rounded-md hover:bg-emerald-500/10 text-foreground/80 hover:text-emerald-500 transition-colors"
        >
          <FolderOpen className="w-5 h-5" />
          <span>{t.nav.library}</span>
        </Link>
        <Link
          href="/recipients"
          className="flex items-center space-x-3 px-3 py-2 rounded-md hover:bg-emerald-500/10 text-foreground/80 hover:text-emerald-500 transition-colors"
        >
          <Users className="w-5 h-5" />
          <span>{t.nav.recipients}</span>
        </Link>
        <Link
          href="/settings/integrations"
          className="flex items-center space-x-3 px-3 py-2 rounded-md hover:bg-emerald-500/10 text-foreground/80 hover:text-emerald-500 transition-colors"
        >
          <Plug className="w-5 h-5" />
          <span>{t.nav.integrations}</span>
        </Link>
        <Link
          href="/settings"
          className="flex items-center space-x-3 px-3 py-2 rounded-md hover:bg-emerald-500/10 text-foreground/80 hover:text-emerald-500 transition-colors"
        >
          <Settings className="w-5 h-5" />
          <span>{t.nav.settings}</span>
        </Link>
      </nav>

      <div className="px-4 mb-4">
        <PlanStatusWidget 
          planTier={(stats?.planTier === "pro" ? "pro" : "free")} 
          usedBytes={stats?.usedBytes || 0}
          limitBytes={stats?.limitBytes || 2147483648}
        />
      </div>

      <div className="p-4 border-t border-border/10 space-y-2">
        <SignOutButton label={t.settings.account.signOut} className="w-full" variant="ghost" />
        <LanguageToggle className="w-full justify-center" />
        <div className="flex justify-between items-center">
          <span className="text-xs text-muted-foreground">{t.nav.version}</span>
          <ThemeToggle />
        </div>
      </div>
    </aside>
  );
}
