"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";
import type { DashboardNavItem } from "@/lib/dashboard-nav";

type DashboardNavLinkProps = {
  item: DashboardNavItem;
  label: string;
  active: boolean;
  variant: "sidebar" | "bottom" | "menu";
  onNavigate?: () => void;
};

export function DashboardNavLink({
  item,
  label,
  active,
  variant,
  onNavigate,
}: DashboardNavLinkProps) {
  const Icon = item.icon;

  if (variant === "bottom") {
    return (
      <Link
        href={item.href}
        onClick={onNavigate}
        aria-current={active ? "page" : undefined}
        className={cn(
          "flex min-h-11 min-w-[3.5rem] flex-1 flex-col items-center justify-center gap-0.5 rounded-lg px-1 py-1.5 text-[10px] font-semibold leading-tight transition-colors",
          active
            ? "text-emerald-600 dark:text-emerald-400"
            : "text-muted-foreground hover:text-foreground"
        )}
      >
        <Icon
          className={cn("size-5 shrink-0", active && "text-emerald-500")}
          aria-hidden
        />
        <span className="max-w-full truncate">{label}</span>
      </Link>
    );
  }

  if (variant === "menu") {
    return (
      <Link
        href={item.href}
        onClick={onNavigate}
        aria-current={active ? "page" : undefined}
        className={cn(
          "flex min-h-11 items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-colors",
          active
            ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
            : "text-foreground/80 hover:bg-muted hover:text-foreground"
        )}
      >
        <Icon className="size-5 shrink-0" aria-hidden />
        <span>{label}</span>
      </Link>
    );
  }

  return (
    <Link
      href={item.href}
      onClick={onNavigate}
      aria-current={active ? "page" : undefined}
      className={cn(
        "flex min-h-11 items-center space-x-3 rounded-md px-3 py-2 transition-colors",
        active
          ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
          : "text-foreground/80 hover:bg-emerald-500/10 hover:text-emerald-500"
      )}
    >
      <Icon className="size-5 shrink-0" aria-hidden />
      <span>{label}</span>
    </Link>
  );
}
