import Link from 'next/link';
import { LayoutDashboard, Megaphone, Settings, Gift } from 'lucide-react';
import { ThemeToggle } from '@/components/shared/ThemeToggle';

export function DashboardSidebar() {
  return (
    <aside className="w-64 h-full hidden lg:flex flex-col glass border-r-0 rounded-l-none">
      <div className="p-6 flex items-center space-x-2">
        <Gift className="w-6 h-6 text-emerald-500" />
        <span className="font-bold text-lg tracking-tight">SharePlatform</span>
      </div>
      
      <nav className="flex-1 px-4 space-y-2 mt-4">
        <Link href="/dashboard" className="flex items-center space-x-3 px-3 py-2 rounded-md hover:bg-emerald-500/10 text-foreground/80 hover:text-emerald-500 transition-colors">
          <LayoutDashboard className="w-5 h-5" />
          <span>Dashboard</span>
        </Link>
        <Link href="/campaigns" className="flex items-center space-x-3 px-3 py-2 rounded-md hover:bg-emerald-500/10 text-foreground/80 hover:text-emerald-500 transition-colors">
          <Megaphone className="w-5 h-5" />
          <span>Campaigns</span>
        </Link>
        <Link href="/settings" className="flex items-center space-x-3 px-3 py-2 rounded-md hover:bg-emerald-500/10 text-foreground/80 hover:text-emerald-500 transition-colors">
          <Settings className="w-5 h-5" />
          <span>Settings</span>
        </Link>
      </nav>

      <div className="p-4 border-t border-border/10 flex justify-between items-center">
        <span className="text-xs text-muted-foreground">v2.0 MVP</span>
        <ThemeToggle />
      </div>
    </aside>
  );
}
