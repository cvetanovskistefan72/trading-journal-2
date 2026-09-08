import {
  BarChart2,
  BookOpen,
  CalendarDays,
  LayoutDashboard,
  PieChart,
  TrendingUp,
  Users,
} from "lucide-react";

import { Role } from "@prisma/client";
import { routes } from "@/config/routes";
import type { NavItem } from "@/types/navigation";

/** Routes where the sidebar is hidden (auth pages). */
export const HIDDEN_ON: string[] = [
  routes.login,
  routes.forgotPassword,
  routes.setPassword,
];

export const NAV_ITEMS: NavItem[] = [
  {
    label: "Dashboard",
    href: routes.dashboard,
    icon: LayoutDashboard,
  },
  {
    label: "Analytics",
    icon: BarChart2,
    children: [
      { label: "Performance", href: routes.analyticsPerformance, icon: PieChart },
      { label: "Calendar", href: routes.analyticsDay, icon: CalendarDays },
      { label: "Strategies", href: routes.analyticsStrategies, icon: TrendingUp },
    ],
  },
  {
    label: "Journal",
    href: routes.journal,
    icon: BookOpen,
  },
];

export const ADMIN_NAV_ITEMS: NavItem[] = [
  { label: "Users", href: routes.adminUsers, icon: Users },
];

export function navItemsForRole(role: Role | undefined): NavItem[] {
  return role === Role.ADMIN ? [...NAV_ITEMS, ...ADMIN_NAV_ITEMS] : NAV_ITEMS;
}
