import type { LucideIcon } from "lucide-react";
import {
  FolderOpen,
  LayoutDashboard,
  Megaphone,
  Plug,
  Settings,
  Users,
} from "lucide-react";

export type DashboardNavLabelKey =
  | "dashboard"
  | "campaigns"
  | "library"
  | "recipients"
  | "settings"
  | "integrations";

export type DashboardNavItem = {
  id: string;
  href: string;
  icon: LucideIcon;
  labelKey: DashboardNavLabelKey;
  isActive: (pathname: string) => boolean;
};

export const DASHBOARD_BOTTOM_NAV: DashboardNavItem[] = [
  {
    id: "dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
    labelKey: "dashboard",
    isActive: (pathname) => pathname === "/dashboard",
  },
  {
    id: "campaigns",
    href: "/campaigns",
    icon: Megaphone,
    labelKey: "campaigns",
    isActive: (pathname) =>
      pathname === "/campaigns" || pathname.startsWith("/campaigns/"),
  },
  {
    id: "library",
    href: "/library",
    icon: FolderOpen,
    labelKey: "library",
    isActive: (pathname) => pathname === "/library",
  },
  {
    id: "recipients",
    href: "/recipients",
    icon: Users,
    labelKey: "recipients",
    isActive: (pathname) => pathname === "/recipients",
  },
  {
    id: "settings",
    href: "/settings",
    icon: Settings,
    labelKey: "settings",
    isActive: (pathname) =>
      pathname === "/settings" ||
      (pathname.startsWith("/settings/") &&
        !pathname.startsWith("/settings/integrations")),
  },
];

export const DASHBOARD_SIDEBAR_NAV: DashboardNavItem[] = [
  ...DASHBOARD_BOTTOM_NAV.filter((item) => item.id !== "settings"),
  {
    id: "integrations",
    href: "/settings/integrations",
    icon: Plug,
    labelKey: "integrations",
    isActive: (pathname) => pathname.startsWith("/settings/integrations"),
  },
  ...DASHBOARD_BOTTOM_NAV.filter((item) => item.id === "settings"),
];
